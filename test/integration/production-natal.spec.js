import { test, expect } from "@playwright/test";

test("production browser reaches real Worker natal APIs and renders a real natal chart", async ({ page }) => {
  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );

  const apiResponses = [];
  page.on("response", response => {
    const url = response.url();
    if (url.includes("/api/natal/timezone") || url.includes("/api/natal/ephemeris")) {
      apiResponses.push({
        url,
        status: response.status()
      });
    }
  });

  await page.goto("/?liveIntegration=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => typeof window.LUMEN_EXT_ROUTES?.natal === "function");

  const sameOrigin = await page.evaluate(async () => {
    const healthResponse = await fetch("/api/health", { cache: "no-store" });
    const health = await healthResponse.json();

    const timezoneResponse = await fetch("/api/natal/timezone", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: "2000-01-15",
        time: "12:30",
        lat: 50.4501,
        lon: 30.5234
      })
    });
    const timezone = await timezoneResponse.json();

    return {
      healthStatus: healthResponse.status,
      health,
      timezoneStatus: timezoneResponse.status,
      timezone
    };
  });

  expect(sameOrigin.healthStatus).toBe(200);
  expect(sameOrigin.health?.ok).toBe(true);
  expect(sameOrigin.timezoneStatus).toBe(200);
  expect(sameOrigin.timezone).toMatchObject({
    ok: true,
    timeZone: "Europe/Kyiv",
    utc: "2000-01-15T10:30:00.000Z"
  });

  await page.locator('[data-go="natal"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Натальна карта");

  await page.locator("#xNDate").fill("2000-01-15");
  await page.locator("#xNTime").fill("12:30");
  await page.locator("#xNPlace").fill("Kyiv live integration");
  await page.locator("#xNLat").fill("50.4501");
  await page.locator("#xNLon").fill("30.5234");
  await page.locator("#xNHouseSystem").selectOption("equal");
  await page.locator("#xNCalc").click();

  await page.waitForFunction(() =>
    window.LUMEN_NATAL_EXPORT_DATA?.engineLabel?.startsWith("Astronomy Engine")
  );

  const data = await page.evaluate(() =>
    structuredClone(window.LUMEN_NATAL_EXPORT_DATA)
  );

  expect(data.engineLabel).toContain("Astronomy Engine");
  expect(data.houseMeta).toMatchObject({
    requested: "equal",
    used: "equal",
    fallback: false
  });

  const bodies = Object.values(data.pos || {});
  expect(bodies).toHaveLength(10);
  expect(bodies.every(value => Number.isFinite(Number(value)))).toBe(true);

  const timezoneCalls = apiResponses.filter(x => x.url.includes("/api/natal/timezone"));
  const ephemerisCalls = apiResponses.filter(x => x.url.includes("/api/natal/ephemeris"));

  expect(timezoneCalls.some(x => x.status === 200)).toBe(true);
  expect(ephemerisCalls.some(x => x.status === 200)).toBe(true);

  await expect(page.locator("#xNatalWheel")).toBeVisible();
});
