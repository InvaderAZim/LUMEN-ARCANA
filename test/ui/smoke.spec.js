import { test, expect } from "@playwright/test";

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
  await page.waitForFunction(() => typeof window.LUMEN_EXT_ROUTES?.profile === "function");
  await page.waitForFunction(() => Array.isArray(window.LUMEN_TAROT78) && window.LUMEN_TAROT78.length === 78);
}

async function openProfile(page) {
  await page.locator('#bottom-nav [data-r="profile"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Профіль");
  await expect(page.locator("#lumenSoundSetting")).toBeVisible();
}

async function installTarotMock(page, requests) {
  await page.route("**/api/interpret", async route => {
    const body = route.request().postDataJSON();
    requests.push(body);

    const cards = body.cards.map((card, index) => ({
      card: card.name,
      position: card.position,
      observation: `Mock observation ${index + 1}`,
      symbolism: (card.keywords || []).join(" · "),
      positionMeaning: card.position,
      context: "UI smoke context",
      practice: "UI smoke practice"
    }));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        blocked: false,
        risk: "normal",
        source: "mock",
        title: "UI Mock Reading",
        cards,
        synthesis: "UI smoke synthesis",
        caution: "UI smoke caution"
      })
    });
  });
}

async function openTarotType(page, type) {
  await page.locator('#bottom-nav [data-r="reading"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Таро");
  await page.locator(`[data-type="${type}"]`).click();
  await expect(page.locator("#draw")).toBeVisible();
}

async function drawTarot(page, requests, type, expectedCount, question) {
  await openTarotType(page, type);
  await page.locator("#q").fill(question);
  await page.locator("#draw").click();

  await expect(page.locator(".result-premium")).toBeVisible();
  await expect(page.locator(".result-premium h2")).toHaveText("UI Mock Reading");
  await expect(page.locator(".result-premium .synthesis p")).toHaveText("UI smoke synthesis");
  await expect(page.locator(".reading-card-classic")).toHaveCount(expectedCount);
  await expect.poll(() => requests.length).toBe(1);

  const request = requests[0];
  expect(request.cards).toHaveLength(expectedCount);
  expect(new Set(request.cards.map(card => card.name)).size).toBe(expectedCount);
  expect(request.question).toBe(question);

  return request;
}

test("navigation opens Tarot and Profile", async ({ page }) => {
  await openApp(page);

  await expect(page.locator("#bottom-nav .nav-btn")).toHaveCount(6);

  await page.locator('#bottom-nav [data-r="reading"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Таро");

  await openProfile(page);
  await expect(page.locator("#xName")).toBeVisible();
});

test("Profile preferences persist after reload", async ({ page }) => {
  await openApp(page);
  await openProfile(page);

  await page.locator("#xName").fill("Smoke User");
  await page.locator("#xMode").selectOption("pro");
  await page.locator("#xDensity").selectOption("compact");
  await page.locator("#xSavePrefs").click();

  const stored = await page.evaluate(() => ({
    prefs: JSON.parse(localStorage.getItem("la_profile_prefs") || "{}"),
    mode: localStorage.getItem("la_mode")
  }));

  expect(stored).toEqual({
    prefs: { displayName: "Smoke User", density: "compact" },
    mode: "pro"
  });
  await expect(page.locator("body")).toHaveAttribute("data-density", "compact");

  await page.reload();
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => typeof window.LUMEN_EXT_ROUTES?.profile === "function");
  await openProfile(page);

  await expect(page.locator("#xName")).toHaveValue("Smoke User");
  await expect(page.locator("#xMode")).toHaveValue("pro");
  await expect(page.locator("#xDensity")).toHaveValue("compact");
  await expect(page.locator("body")).toHaveAttribute("data-density", "compact");
});

test("sound toggle and volume persist in localStorage", async ({ page }) => {
  await openApp(page);
  await openProfile(page);

  await page.evaluate(() => {
    window.__soundEvents = [];
    window.addEventListener("lumen:sound-change", event => {
      window.__soundEvents.push(event.detail);
    });
  });

  const toggle = page.locator("#lumenSoundToggle");
  const slider = page.locator("#lumenSoundVolume");

  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await expect(page.locator("#lumenSoundState")).toHaveText("Вимкнено");

  await slider.evaluate(element => {
    element.value = "37";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await expect(slider).toHaveValue("37");
  await expect(page.locator("#lumenSoundVolumeValue")).toHaveText("37%");

  const soundState = await page.evaluate(() => ({
    enabled: localStorage.getItem("la_sound_enabled"),
    volume: localStorage.getItem("la_sound_volume"),
    lastEvent: window.__soundEvents.at(-1)
  }));

  expect(soundState).toEqual({
    enabled: "0",
    volume: "37",
    lastEvent: { enabled: false, volume: 37 }
  });

  await page.reload();
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => typeof window.LUMEN_EXT_ROUTES?.profile === "function");
  await openProfile(page);

  await expect(page.locator("#lumenSoundToggle")).not.toBeChecked();
  await expect(page.locator("#lumenSoundVolume")).toHaveValue("37");
  await expect(page.locator("#lumenSoundVolumeValue")).toHaveText("37%");
});

test("Tarot single draw sends and renders one unique card", async ({ page }) => {
  const requests = [];
  await installTarotMock(page, requests);
  await openApp(page);

  const request = await drawTarot(
    page,
    requests,
    "single",
    1,
    "Що мені важливо побачити сьогодні?"
  );

  expect(request.spread).toBe("single");
});

test("Tarot three-card draw sends and renders three unique cards", async ({ page }) => {
  const requests = [];
  await installTarotMock(page, requests);
  await openApp(page);

  const request = await drawTarot(
    page,
    requests,
    "three",
    3,
    "Який напрямок варто осмислити?"
  );

  expect(request.spread).toBe("three");
  expect(request.cards.map(card => card.position)).toEqual([
    "Минуле",
    "Теперішнє",
    "Напрямок"
  ]);
});

test("Tarot themed draw renders five unique cards and saves journal entry", async ({ page }) => {
  const requests = [];
  await installTarotMock(page, requests);
  await openApp(page);

  const question = "Що допоможе повернути ясність після конфлікту?";
  const request = await drawTarot(page, requests, "themed", 5, question);

  expect(request.spread).toBe("conflict");

  await page.locator("#save78").click();

  const journal = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("la_journal") || "[]")
  );

  expect(journal).toHaveLength(1);
  expect(journal[0]).toMatchObject({
    question,
    title: "UI Mock Reading",
    synthesis: "UI smoke synthesis",
    type: "themed"
  });
  expect(journal[0].cards).toHaveLength(5);
  expect(new Set(journal[0].cards.map(card => card.name)).size).toBe(5);
});
