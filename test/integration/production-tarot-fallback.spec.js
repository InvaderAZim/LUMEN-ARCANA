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


async function drawYesNoClientFallback(page, question, cardName, orientationRandom = 0.5) {
  await page.evaluate(() => window.LUMEN_NAVIGATE?.("reading"));
  await expect(page.locator("#app .top h1")).toHaveText("Таро");
  await page.locator('[data-type="yesno"]').click();
  await page.locator("#q").fill(question);
  await page.evaluate(({ cardName, orientationRandom }) => {
    const deck = window.LUMEN_TAROT78;
    const target = deck.find(card => card.name === cardName);
    if (!target) throw new Error(`Tarot test card not found: ${cardName}`);
    const originalDeck = [...deck];
    const originalRandom = Math.random;
    deck.splice(0, deck.length, target);
    Math.random = () => orientationRandom;
    window.__restoreTarotFixture = () => {
      deck.splice(0, deck.length, ...originalDeck);
      Math.random = originalRandom;
      delete window.__restoreTarotFixture;
    };
  }, { cardName, orientationRandom });
  await page.locator("#draw").click();
  await page.evaluate(() => window.__restoreTarotFixture?.());
  await expect(page.locator(".result-premium")).toBeVisible();
  await expect(page.locator(".tarot-source-badge")).toHaveText(
    "Локальне тлумачення · сервер недоступний"
  );
}

test("production client yes-no fallback preserves yes no unclear reversed and high-stakes safety", async ({ page }) => {
  await page.route("**/api/interpret", route =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "production_yesno_fallback_audit" })
    })
  );

  await prepareProductionTarot(page);

  const cases = [
    {
      question: "Чи варто погодитися на цю зустріч?",
      cardName: "Маг",
      orientationRandom: 0.5,
      title: "Тенденція: скоріше так"
    },
    {
      question: "Чи варто поспішати з цим рішенням?",
      cardName: "Вежа",
      orientationRandom: 0.5,
      title: "Тенденція: скоріше ні"
    },
    {
      question: "Чи варто повернутися до цієї розмови?",
      cardName: "Верховна Жриця",
      orientationRandom: 0.5,
      title: "Тенденція: неоднозначно"
    },
    {
      question: "Чи варто погодитися на цю зустріч?",
      cardName: "Маг",
      orientationRandom: 0.1,
      title: "Тенденція: неоднозначно"
    },
    {
      question: "Чи покращаться мої фінанси найближчим часом?",
      cardName: "Сонце",
      orientationRandom: 0.5,
      title: "Тенденція: неоднозначно"
    },
    {
      question: "Чи варто мені приймати ці ліки?",
      cardName: "Сонце",
      orientationRandom: 0.5,
      title: "Тенденція: неоднозначно"
    },
    {
      question: "Чи варто мені підписувати цей договір?",
      cardName: "Сонце",
      orientationRandom: 0.5,
      title: "Тенденція: неоднозначно"
    }
  ];

  for (const item of cases) {
    await drawYesNoClientFallback(page, item.question, item.cardName, item.orientationRandom);
    await expect(page.locator(".result-premium h2")).toHaveText(item.title);
  }
});

test("production Tarot image failure stays CSP-safe", async ({ page }) => {
  let releaseInterpret;
  const gate = new Promise(resolve => {
    releaseInterpret = resolve;
  });

  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );

  await page.addInitScript(() => {
    window.__imageFallbackCspViolations = [];
    document.addEventListener("securitypolicyviolation", event => {
      window.__imageFallbackCspViolations.push({
        effectiveDirective: event.effectiveDirective || "",
        blockedURI: event.blockedURI || "",
        disposition: event.disposition || ""
      });
    });
  });

  await page.route("**/api/interpret", async route => {
    const body = route.request().postDataJSON();
    await gate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        blocked: false,
        risk: "normal",
        source: "mock",
        title: "Production image fallback test",
        cards: body.cards.map(card => ({
          card: card.name,
          symbolism: (card.keywords || []).join(" · "),
          practice: "Production image fallback"
        })),
        synthesis: "Production image fallback"
      })
    });
  });

  await page.route("**/cards/rws/**", route => route.abort());

  await page.goto("/?tarotImageFallbackLive=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => Array.isArray(window.LUMEN_TAROT78) && window.LUMEN_TAROT78.length === 78);

  await page.evaluate(() => window.LUMEN_NAVIGATE?.("reading"));
  await expect(page.locator("#app .top h1")).toHaveText("Таро");
  await page.locator('[data-type="single"]').click();
  await page.locator("#q").fill("Production image fallback audit");
  await page.locator("#draw").click();

  const image = page.locator(".drawing .rws-card-img.image-failed").first();
  const fallback = page.locator(".drawing .tarot-art-fallback").first();

  await expect(image).toHaveCount(1);
  await expect(fallback).toHaveClass(/tarot-art-fallback-visible/);
  await expect(fallback).not.toHaveClass(/tarot-art-fallback-hidden/);

  const state = await fallback.evaluate(node => ({
    styleAttr: node.getAttribute("style"),
    display: getComputedStyle(node).display
  }));
  expect(state.styleAttr).toBeNull();
  expect(state.display).toBe("grid");

  const violations = await page.evaluate(() =>
    structuredClone(window.__imageFallbackCspViolations || [])
  );
  expect(violations).toEqual([]);

  releaseInterpret();
  await expect(page.locator(".result-premium")).toBeVisible();
});
