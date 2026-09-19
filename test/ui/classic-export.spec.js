import { test, expect } from "@playwright/test";

const NATAL_POSITIONS = {
  Sun: 295.1,
  Moon: 140.2,
  Mercury: 280.3,
  Venus: 310.4,
  Mars: 100.5,
  Jupiter: 70.6,
  Saturn: 350.7,
  Uranus: 50.8,
  Neptune: 330.9,
  Pluto: 300
};

async function openApp(page) {
  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );

  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => {};
  });

  await page.goto("/");
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => typeof window.LUMEN_EXT_ROUTES?.natal === "function");
}

async function installNatalMocks(page, calls) {
  await page.route("**/api/natal/timezone", async route => {
    const body = route.request().postDataJSON();
    calls.timezone.push(body);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        source: "tz-lookup+Intl",
        timeZone: "Europe/Kyiv",
        offsetHours: 2,
        offsetMinutes: 120,
        utc: "2000-01-15T10:30:00.000Z"
      })
    });
  });

  await page.route("**/api/natal/ephemeris", async route => {
    const body = route.request().postDataJSON();
    calls.ephemeris.push(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        source: "astronomy-engine",
        frame: "true-ecliptic-of-date",
        utc: body.utc,
        positions: NATAL_POSITIONS
      })
    });
  });
}

async function buildClassicNatal(page, calls) {
  await installNatalMocks(page, calls);
  await openApp(page);

  await page.locator('[data-go="natal"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Натальна карта");

  await page.locator("#xNDate").fill("2000-01-15");
  await page.locator("#xNTime").fill("12:30");
  await page.locator("#xNPlace").fill("Kyiv Export Test");
  await page.locator("#xNLat").fill("50.4501");
  await page.locator("#xNLon").fill("30.5234");
  await page.locator("#xNHouseSystem").selectOption("equal");
  await page.locator("#xNCalc").click();

  await expect.poll(() => calls.timezone.length).toBe(1);
  await expect.poll(() => calls.ephemeris.length).toBe(1);
  await page.waitForFunction(() =>
    window.LUMEN_NATAL_EXPORT_DATA?.engineLabel?.startsWith("Astronomy Engine")
  );

  await page.locator("#xNatalClassic").click();
  await expect(page.locator(".classic-chart-shell")).toBeVisible();
  await expect(page.locator(".classic-natal-table")).toBeVisible();
  await expect(page.locator(".classic-aspect-matrix")).toBeVisible();
  await expect(page.locator("#xPng")).toBeVisible();
  await expect(page.locator("#xPrint")).toBeVisible();
}

test("Classic Natal PNG exports a real PNG file", async ({ page }) => {
  const calls = { timezone: [], ephemeris: [] };
  await buildClassicNatal(page, calls);

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#xPng").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("lumen-natal-classic.png");
  expect(await download.failure()).toBeNull();

  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();

  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const png = Buffer.concat(chunks);

  expect(png.length).toBeGreaterThan(10_000);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  expect(width).toBe(1400);
  expect(height).toBeGreaterThan(2200);

  expect(calls.timezone).toHaveLength(1);
  expect(calls.ephemeris).toHaveLength(1);
});

test("Classic Natal PDF/Print renders exactly two A4 pages with clean print-only content", async ({ page }) => {
  const calls = { timezone: [], ephemeris: [] };
  await buildClassicNatal(page, calls);

  await page.evaluate(() => {
    window.__lumenPrintCalls = 0;
    window.print = () => {
      window.__lumenPrintCalls += 1;
    };
  });

  await page.locator("#xPrint").click();

  await expect.poll(() =>
    page.evaluate(() => window.__lumenPrintCalls)
  ).toBe(1);

  const printState = await page.evaluate(async () => {
    const sheet = document.querySelector("#xNatalPrintSheet");
    const style = document.querySelector("#xNatalPrintStyle");
    const pages = [...document.querySelectorAll("#xNatalPrintSheet .x-natal-print-page")];
    const svgs = pages.map(page => page.querySelector("svg"));
    const viewBoxes = svgs.map(svg =>
      String(svg?.getAttribute("viewBox") || "").split(/\s+/).map(Number)
    );

    const [printCss, extensionsSource] = await Promise.all([
      fetch("/natal-print.css?v=3.0.0-beta.1-a1", { cache: "no-store" }).then(r => r.text()),
      fetch("/extensions.js?v=3.0.0-beta.1-a7", { cache: "no-store" }).then(r => r.text())
    ]);

    const firstSvg = svgs[0];
    const secondSvg = svgs[1];
    const textY = (svg, text) => {
      const node = [...(svg?.querySelectorAll("text") || [])]
        .find(item => item.textContent?.trim() === text);
      return Number(node?.getAttribute("y"));
    };

    return {
      pageCount: pages.length,
      labels: svgs.map(svg => svg?.getAttribute("aria-label") || ""),
      viewBoxes,
      firstPositionsY: textY(firstSvg, "Положення планет"),
      firstMatrixY: textY(firstSvg, "Матриця аспектів"),
      secondMatrixY: textY(secondSvg, "Матриця аспектів"),
      sheetContainsApp: !!sheet?.querySelector("#app"),
      sheetContainsNav: !!sheet?.querySelector("#bottom-nav"),
      firstHasWhiteBackground:
        [...(firstSvg?.querySelectorAll("rect") || [])].some(
          rect => rect.getAttribute("fill") === "#fff"
        ),
      dynamicStylePresent: !!style,
      printCss,
      extensionsCreatesStyle: /createElement\s*\(\s*["']style["']\s*\)/.test(extensionsSource)
    };
  });

  expect(printState.pageCount).toBe(2);
  expect(printState.labels).toEqual([
    "Classic Natal Chart · колесо та положення",
    "Classic Natal Chart · матриця аспектів"
  ]);

  const [firstViewBox, secondViewBox] = printState.viewBoxes;
  expect(firstViewBox).toHaveLength(4);
  expect(secondViewBox).toHaveLength(4);
  expect(firstViewBox[0]).toBe(0);
  expect(firstViewBox[1]).toBe(0);
  expect(secondViewBox[0]).toBe(0);
  expect(secondViewBox[1]).toBeCloseTo(firstViewBox[3], 8);
  expect(secondViewBox[2]).toBe(firstViewBox[2]);

  expect(printState.firstPositionsY).toBeGreaterThan(0);
  expect(printState.firstPositionsY).toBeLessThan(firstViewBox[3]);
  expect(printState.firstMatrixY).toBeGreaterThanOrEqual(secondViewBox[1]);
  expect(printState.secondMatrixY).toBeGreaterThanOrEqual(secondViewBox[1]);

  expect(printState.sheetContainsApp).toBe(false);
  expect(printState.sheetContainsNav).toBe(false);
  expect(printState.firstHasWhiteBackground).toBe(true);
  expect(printState.dynamicStylePresent).toBe(false);
  expect(printState.extensionsCreatesStyle).toBe(false);
  expect(printState.printCss).toContain("body>:not(#xNatalPrintSheet){display:none!important}");
  expect(printState.printCss).toContain("@page{size:A4 portrait;margin:7mm}");
  expect(printState.printCss).toContain("page-break-after:always");
  expect(printState.printCss).toContain("width:196mm!important");
  expect(printState.printCss).toContain("max-height:269mm!important");

  await page.emulateMedia({ media: "print" });

  const displays = await page.evaluate(() => ({
    app: getComputedStyle(document.querySelector("#app")).display,
    nav: getComputedStyle(document.querySelector("#bottom-nav")).display,
    sheet: getComputedStyle(document.querySelector("#xNatalPrintSheet")).display
  }));

  expect(displays.app).toBe("none");
  expect(displays.nav).toBe("none");
  expect(displays.sheet).toBe("block");

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true
  });

  expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");
  expect(pdf.length).toBeGreaterThan(20_000);

  const pageObjects = pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || [];
  expect(pageObjects.length).toBe(2);
});
