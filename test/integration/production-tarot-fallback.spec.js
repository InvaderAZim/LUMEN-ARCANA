import { test, expect } from "@playwright/test";

async function prepareProductionTarot(page) {
  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );

  await page.goto("/?tarotFallbackLive=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => Array.isArray(window.LUMEN_TAROT78) && window.LUMEN_TAROT78.length === 78);
}

async function drawSingle(page, question) {
  await page.evaluate(() => window.LUMEN_NAVIGATE?.("reading"));
  await expect(page.locator("#app .top h1")).toHaveText("Таро");
  await page.locator('[data-type="single"]').click();
  await page.locator("#q").fill(question);
  await page.locator("#draw").click();
  await expect(page.locator(".result-premium")).toBeVisible();
}

test("production UI labels server local Tarot fallback", async ({ page }) => {
  await page.route("**/api/interpret", async route => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        blocked: false,
        risk: "normal",
        source: "local",
        title: "Production local fallback test",
        cards: body.cards.map(card => ({
          card: card.name,
          symbolism: (card.keywords || []).join(" · "),
          practice: "Production fallback practice"
        })),
        synthesis: "Production local fallback synthesis"
      })
    });
  });

  await prepareProductionTarot(page);
  await drawSingle(page, "Production local fallback audit");
  await expect(page.locator(".tarot-source-badge")).toHaveText("Локальне тлумачення");
});

test("production UI labels client Tarot fallback when API fails", async ({ page }) => {
  await page.route("**/api/interpret", route =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "production_fallback_audit" })
    })
  );

  await prepareProductionTarot(page);
  await drawSingle(page, "Production client fallback audit");
  await expect(page.locator(".tarot-source-badge")).toHaveText(
    "Локальне тлумачення · сервер недоступний"
  );
  await expect(page.locator(".result-premium h2")).toHaveText("Твій розклад");
});
