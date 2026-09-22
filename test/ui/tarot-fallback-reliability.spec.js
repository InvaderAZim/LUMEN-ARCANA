import { test, expect } from "@playwright/test";

async function openTarot(page) {
  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
  );
  await page.goto("/");
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(
    () => Array.isArray(window.LUMEN_TAROT78) && window.LUMEN_TAROT78.length === 78
  );
  await page.evaluate(() => window.LUMEN_NAVIGATE?.("reading"));
  await expect(page.locator("#app .top h1")).toHaveText("Таро");
}

async function drawSingle(page, question) {
  await page.locator('[data-type="single"]').click();
  await page.locator("#q").fill(question);
  await page.locator("#draw").click();
  await expect(page.locator(".result-premium")).toBeVisible();
  await expect(page.locator(".tarot-source-badge")).toHaveText(
    "Локальне тлумачення · сервер недоступний"
  );
  await expect(page.locator(".result-premium h2")).toHaveText("Твій розклад");
}

test("Tarot interpretation timeout degrades to client fallback", async ({ page }) => {
  await page.addInitScript(() => {
    window.LUMEN_TAROT_INTERPRET_TIMEOUT_MS = 50;
  });
  await page.route("**/api/interpret", async route => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!route.request().isNavigationRequest()) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ title: "Too late", synthesis: "Too late" })
      }).catch(() => {});
    }
  });

  await openTarot(page);
  await drawSingle(page, "Timeout regression");
});

for (const [name, response] of [
  ["malformed JSON", { status: 200, contentType: "application/json", body: "{" }],
  ["empty object", { status: 200, contentType: "application/json", body: "{}" }]
]) {
  test(`Tarot ${name} degrades to client fallback`, async ({ page }) => {
    await page.route("**/api/interpret", route => route.fulfill(response));
    await openTarot(page);
    await drawSingle(page, `${name} regression`);
  });
}


test("late Tarot interpretation cannot overwrite another route", async ({ page }) => {
  let releaseInterpret;
  const gate = new Promise(resolve => {
    releaseInterpret = resolve;
  });

  await page.route("**/api/interpret", async route => {
    const body = route.request().postDataJSON();
    await gate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source: "mock",
        title: "Late Tarot result",
        cards: body.cards.map(card => ({
          card: card.name,
          symbolism: (card.keywords || []).join(" · "),
          practice: "Late response"
        })),
        synthesis: "This response must stay on the abandoned reading."
      })
    });
  });

  await openTarot(page);
  await page.locator('[data-type="single"]').click();
  await page.locator("#q").fill("Race regression");
  await page.locator("#draw").click();
  await expect(page.locator(".drawing")).toBeVisible();

  await page.evaluate(() => window.LUMEN_NAVIGATE?.("home"));
  await expect(page.locator("#app .top h1")).toContainText("Привіт");

  releaseInterpret();
  await page.waitForTimeout(150);

  await expect(page.locator("#app .top h1")).toContainText("Привіт");
  await expect(page.locator(".result-premium")).toHaveCount(0);
  await expect(page.getByText("Late Tarot result", { exact: true })).toHaveCount(0);
});


test("Tarot save recovers from non-array journal storage", async ({ page }) => {
  await page.route("**/api/interpret", route =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "journal_storage_regression" })
    })
  );

  await openTarot(page);
  await page.evaluate(() => {
    localStorage.setItem("la_journal", JSON.stringify({ corrupted: true }));
  });

  await page.locator('[data-type="single"]').click();
  await page.locator("#q").fill("Journal recovery regression");
  await page.locator("#draw").click();
  await expect(page.locator(".result-premium")).toBeVisible();
  await page.locator("#save78").click();

  const journal = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("la_journal") || "[]")
  );
  expect(Array.isArray(journal)).toBe(true);
  expect(journal).toHaveLength(1);
  expect(journal[0].question).toBe("Journal recovery regression");
});
