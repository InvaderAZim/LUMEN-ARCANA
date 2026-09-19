import { test, expect } from "@playwright/test";

test("production enforced CSP audit covers primary UI and exports", async ({ page }) => {
  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );

  await page.addInitScript(() => {
    window.__LUMEN_CSP_VIOLATIONS = [];
    document.addEventListener("securitypolicyviolation", event => {
      window.__LUMEN_CSP_VIOLATIONS.push({
        effectiveDirective: event.effectiveDirective || "",
        violatedDirective: event.violatedDirective || "",
        blockedURI: event.blockedURI || "",
        sourceFile: event.sourceFile || "",
        lineNumber: event.lineNumber || 0,
        columnNumber: event.columnNumber || 0,
        disposition: event.disposition || "",
        originalPolicy: event.originalPolicy || ""
      });
    });
  });

  const rootResponse = await page.goto("/?cspLiveAudit=1", {
    waitUntil: "domcontentloaded"
  });
  expect(rootResponse).not.toBeNull();

  const reportOnly =
    rootResponse?.headers()["content-security-policy-report-only"] || "";
  const enforcement =
    rootResponse?.headers()["content-security-policy"] || "";

  expect(reportOnly).toContain("default-src 'self'");
  expect(reportOnly).toContain("script-src 'self' https://telegram.org");
  expect(reportOnly).toContain("style-src 'self'");
  expect(reportOnly).toContain("style-src-attr 'none'");
  expect(reportOnly).not.toContain("frame-ancestors");
  expect(enforcement).toBe(reportOnly);

  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => window.LUMEN_BOOT_STATUS);
  await page.waitForFunction(() => typeof window.LUMEN_EXT_ROUTES?.natal === "function");

  // Home
  await expect(page.locator("#app .top h1")).toBeVisible();

  // Tarot
  await page.evaluate(() => window.LUMEN_NAVIGATE?.("reading"));
  await expect(page.locator("#app .top h1")).toHaveText("Таро");

  // Profile
  await page.evaluate(() => window.LUMEN_NAVIGATE?.("profile"));
  await expect(page.locator("#app .top h1")).toHaveText("Профіль");
  await expect(page.locator("#lumenSoundSetting")).toBeVisible();

  // Natal with a complete pre-resolved profile so the audit focuses on browser CSP.
  await page.evaluate(() => {
    const profile = {
      date: "2000-01-15",
      time: "12:30",
      place: "Kyiv CSP audit",
      lat: "50.4501",
      lon: "30.5234",
      utcOffset: "2",
      timezone: "Europe/Kyiv",
      utcIso: "2000-01-15T10:30:00.000Z",
      timezoneToken: "2000-01-15|12:30|50.4501|30.5234",
      houseSystem: "equal"
    };
    localStorage.setItem("la_natal_profile", JSON.stringify(profile));
    localStorage.setItem("la_natal_view", "classic");
    window.LUMEN_NAVIGATE?.("natal");
  });

  await expect(page.locator("#app .top h1")).toHaveText("Натальна карта");
  await expect(page.locator(".classic-natal-svg")).toBeVisible();
  await page.waitForFunction(() =>
    window.LUMEN_NATAL_EXPORT_DATA?.engineLabel?.length > 0
  );

  // PNG export: trigger creation; do not depend on platform-specific download UI.
  await page.locator("#xPng").click();
  await page.waitForTimeout(800);

  // Print/PDF: intercept native print, but execute the actual two-page sheet flow.
  await page.evaluate(() => {
    window.__lumenCspPrintCalls = 0;
    window.print = () => {
      window.__lumenCspPrintCalls += 1;
    };
  });
  await page.locator("#xPrint").click();
  await expect.poll(() =>
    page.evaluate(() => window.__lumenCspPrintCalls)
  ).toBe(1);
  await expect(page.locator("#xNatalPrintSheet .x-natal-print-page")).toHaveCount(2);

  await page.waitForTimeout(500);

  const violations = await page.evaluate(() =>
    structuredClone(window.__LUMEN_CSP_VIOLATIONS || [])
  );

  const unique = [];
  const seen = new Set();
  for (const violation of violations) {
    const key = [
      violation.effectiveDirective,
      violation.blockedURI,
      violation.sourceFile,
      violation.lineNumber,
      violation.columnNumber
    ].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(violation);
    }
  }

  console.log("CSP_AUDIT " + JSON.stringify({
    reportOnly,
    enforcementPresent: Boolean(enforcement),
    totalViolations: violations.length,
    uniqueViolations: unique
  }));
});
