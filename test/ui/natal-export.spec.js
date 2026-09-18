import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

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
  await expect(page.locator("#xNatalClassic")).toHaveClass(/primary/);
  await expect(page.locator(".classic-natal-table")).toBeVisible();
  await expect(page.locator(".classic-aspect-matrix")).toBeVisible();
  await expect(page.locator("#xPng")).toBeVisible();
  await expect(page.locator("#xPrint")).toBeVisible();
}

test("Classic Natal PNG exports the full clean chart at export resolution", async ({ page }) => {
  const calls = { timezone: [], ephemeris: [] };
  await installNatalMocks(page, calls);
  await openApp(page);
  await buildClassicNatal(page, calls);

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#xPng").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("lumen-natal-classic.png");
  const path = await download.path();
  expect(path).toBeTruthy();

  const png = await readFile(path);
  expect(png.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );

  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  expect(width).toBe(1400);
  expect(height).toBeGreaterThan(2200);
});

test("Classic Natal PDF/Print creates two A4-ready clean pages", async ({ page }) => {
  const calls = { timezone: [], ephemeris: [] };
  await installNatalMocks(page, calls);
  await openApp(page);
  await buildClassicNatal(page, calls);

  await page.evaluate(() => {
    window.__lumenPrintCalls = 0;
    window.print = () => {
      window.__lumenPrintCalls += 1;
    };
  });

  await page.locator("#xPrint").click();

  await expect(page.locator("#xNatalPrintSheet")).toBeAttached();
  await expect(page.locator("#xNatalPrintSheet .x-natal-print-page")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => window.__lumenPrintCalls)).toBe(1);

  const audit = await page.evaluate(() => {
    const sheet = document.querySelector("#xNatalPrintSheet");
    const style = document.querySelector("#xNatalPrintStyle");
    const pages = [...sheet.querySelectorAll(".x-natal-print-page")];
    const svgs = pages.map(page => page.querySelector("svg"));

    const parseViewBox = svg =>
      String(svg.getAttribute("viewBox") || "")
        .trim()
        .split(/\s+/)
        .map(Number);

    const firstView = parseViewBox(svgs[0]);
    const secondView = parseViewBox(svgs[1]);
    const positionTitle = [...svgs[0].querySelectorAll("text")].find(
      node => node.textContent?.trim() === "Положення планет"
    );
    const matrixTitle = [...svgs[0].querySelectorAll("text")].find(
      node => node.textContent?.trim() === "Матриця аспектів"
    );

    return {
      pageCount: pages.length,
      firstLabel: svgs[0].getAttribute("aria-label"),
      secondLabel: svgs[1].getAttribute("aria-label"),
      firstView,
      secondView,
      positionY: Number(positionTitle?.getAttribute("y")),
      matrixY: Number(matrixTitle?.getAttribute("y")),
      styleText: style?.textContent || "",
      sheetHasApp: !!sheet.querySelector("#app"),
      sheetHasBottomNav: !!sheet.querySelector("#bottom-nav"),
      firstHasWhiteBackground:
        [...svgs[0].querySelectorAll("rect")].some(
          rect => rect.getAttribute("fill") === "#fff"
        )
    };
  });

  expect(audit.pageCount).toBe(2);
  expect(audit.firstLabel).toBe("Classic Natal Chart · колесо та положення");
  expect(audit.secondLabel).toBe("Classic Natal Chart · матриця аспектів");

  const firstEnd = audit.firstView[1] + audit.firstView[3];
  expect(audit.firstView[0]).toBe(0);
  expect(audit.firstView[1]).toBe(0);
  expect(audit.firstView[2]).toBe(1400);
  expect(audit.positionY).toBeLessThan(firstEnd);
  expect(audit.matrixY).toBeGreaterThan(firstEnd);

  expect(audit.secondView[0]).toBe(0);
  expect(audit.secondView[1]).toBe(firstEnd);
  expect(audit.secondView[2]).toBe(1400);
  expect(audit.matrixY).toBeGreaterThanOrEqual(audit.secondView[1]);
  expect(audit.matrixY).toBeLessThan(audit.secondView[1] + audit.secondView[3]);

  expect(audit.styleText).toContain("body>:not(#xNatalPrintSheet){display:none!important}");
  expect(audit.styleText).toContain("@page{size:A4 portrait;margin:7mm}");
  expect(audit.styleText).toContain("page-break-after:always");
  expect(audit.sheetHasApp).toBe(false);
  expect(audit.sheetHasBottomNav).toBe(false);
  expect(audit.firstHasWhiteBackground).toBe(true);
});
