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

async function installNatalMocks(page, {
  utc,
  timeZone,
  offsetHours,
  positions = NATAL_POSITIONS
}) {
  await page.route("**/api/natal/timezone", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        source: "tz-lookup+Intl",
        timeZone,
        offsetHours,
        offsetMinutes: offsetHours * 60,
        utc
      })
    });
  });

  await page.route("**/api/natal/ephemeris", async route => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        source: "astronomy-engine",
        frame: "true-ecliptic-of-date",
        utc: body.utc,
        positions
      })
    });
  });
}

async function buildNatal(page, {
  date,
  time,
  place,
  lat,
  lon,
  houseSystem
}) {
  await page.locator('[data-go="natal"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Натальна карта");

  await page.locator("#xNDate").fill(date);
  await page.locator("#xNTime").fill(time);
  await page.locator("#xNPlace").fill(place);
  await page.locator("#xNLat").fill(String(lat));
  await page.locator("#xNLon").fill(String(lon));
  await page.locator("#xNHouseSystem").selectOption(houseSystem);
  await page.locator("#xNCalc").click();

  await page.waitForFunction(() =>
    window.LUMEN_NATAL_EXPORT_DATA?.engineLabel?.startsWith("Astronomy Engine")
  );

  return page.evaluate(() => structuredClone(window.LUMEN_NATAL_EXPORT_DATA));
}

function angularDelta(actual, expected) {
  const d = Math.abs((((actual - expected) % 360) + 540) % 360 - 180);
  return d;
}

function expectAngle(actual, expected, tolerance = 0.05) {
  expect(angularDelta(actual, expected)).toBeLessThanOrEqual(tolerance);
}

function expectCusps(actual, expected, tolerance = 0.05) {
  expect(actual).toHaveLength(12);
  expected.forEach((value, index) => expectAngle(actual[index], value, tolerance));
}

test("Equal House preserves 30° cusps and reference angles for Kyiv", async ({ page }) => {
  await installNatalMocks(page, {
    utc: "2000-01-15T10:30:00.000Z",
    timeZone: "Europe/Kyiv",
    offsetHours: 2
  });
  await openApp(page);

  const data = await buildNatal(page, {
    date: "2000-01-15",
    time: "12:30",
    place: "Kyiv benchmark",
    lat: 50.4501,
    lon: 30.5234,
    houseSystem: "equal"
  });

  // Swiss Ephemeris reference angles for 2000-01-15 10:30 UTC.
  expectAngle(data.asc, 61.0790062571);
  expectAngle(data.mc, 300.0356001265);

  expect(data.houseMeta).toMatchObject({
    requested: "equal",
    used: "equal",
    fallback: false
  });

  const expectedCusps = Array.from({ length: 12 }, (_, i) =>
    (61.0790062571 + i * 30) % 360
  );
  expectCusps(data.houseMeta.cusps, expectedCusps);
});

test("Placidus matches Swiss Ephemeris reference for Kyiv", async ({ page }) => {
  await installNatalMocks(page, {
    utc: "2000-01-15T10:30:00.000Z",
    timeZone: "Europe/Kyiv",
    offsetHours: 2
  });
  await openApp(page);

  const data = await buildNatal(page, {
    date: "2000-01-15",
    time: "12:30",
    place: "Kyiv benchmark",
    lat: 50.4501,
    lon: 30.5234,
    houseSystem: "placidus"
  });

  expectAngle(data.asc, 61.0790062571);
  expectAngle(data.mc, 300.0356001265);

  expect(data.houseMeta).toMatchObject({
    requested: "placidus",
    used: "placidus",
    fallback: false
  });

  expectCusps(data.houseMeta.cusps, [
    61.0790062571,
    83.7210065202,
    101.4932729881,
    120.0356001265,
    144.3191946212,
    183.7174001218,
    241.0790062571,
    263.7210065202,
    281.4932729881,
    300.0356001265,
    324.3191946212,
    3.7174001218
  ]);
});

test("Placidus remains stable near the high-latitude boundary in Reykjavik", async ({ page }) => {
  await installNatalMocks(page, {
    utc: "2024-03-20T12:00:00.000Z",
    timeZone: "Atlantic/Reykjavik",
    offsetHours: 0
  });
  await openApp(page);

  const data = await buildNatal(page, {
    date: "2024-03-20",
    time: "12:00",
    place: "Reykjavik benchmark",
    lat: 64.1466,
    lon: -21.9426,
    houseSystem: "placidus"
  });

  expectAngle(data.asc, 116.4276661916);
  expectAngle(data.mc, 334.7147541149);

  expect(data.houseMeta).toMatchObject({
    requested: "placidus",
    used: "placidus",
    fallback: false
  });

  expectCusps(data.houseMeta.cusps, [
    116.4276661916,
    124.6405132119,
    136.1892385361,
    154.7147541149,
    190.1799509374,
    258.0539883044,
    296.4276661916,
    304.6405132119,
    316.1892385361,
    334.7147541149,
    10.1799509374,
    78.0539883044
  ]);
});

test("Placidus falls back to Equal House when the reference system is undefined at polar latitude", async ({ page }) => {
  await installNatalMocks(page, {
    utc: "2024-06-21T12:00:00.000Z",
    timeZone: "Europe/Oslo",
    offsetHours: 2
  });
  await openApp(page);

  const data = await buildNatal(page, {
    date: "2024-06-21",
    time: "14:00",
    place: "Tromso benchmark",
    lat: 69.6492,
    lon: 18.9553,
    houseSystem: "placidus"
  });

  // Swiss Ephemeris reports Placidus houses as undefined for this benchmark.
  expect(data.houseMeta).toMatchObject({
    requested: "placidus",
    used: "equal",
    fallback: true,
    reason: "placidus-unavailable"
  });

  const asc = data.asc;
  const expectedCusps = Array.from({ length: 12 }, (_, i) => (asc + i * 30) % 360);
  expectCusps(data.houseMeta.cusps, expectedCusps, 1e-7);
});


test("Natal shows an explicit message for an ambiguous DST local time", async ({ page }) => {
  await page.route("**/api/natal/timezone", async route => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "local_time_ambiguous" })
    });
  });
  await openApp(page);

  await page.locator('[data-go="natal"]').click();
  await page.locator("#xNDate").fill("2026-10-25");
  await page.locator("#xNTime").fill("03:30");
  await page.locator("#xNPlace").fill("Kyiv DST overlap");
  await page.locator("#xNLat").fill("50.4501");
  await page.locator("#xNLon").fill("30.5234");
  await page.locator("#xNHouseSystem").selectOption("equal");
  await page.locator("#xNCalc").click();

  await expect(page.locator("#toast")).toContainText(
    "Цей місцевий час повторюється через переведення годинника"
  );
});
