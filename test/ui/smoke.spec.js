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

async function buildNatalChart(page, calls) {
  await page.locator('[data-go="natal"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Натальна карта");

  await page.locator("#xNDate").fill("2000-01-15");
  await page.locator("#xNTime").fill("12:30");
  await page.locator("#xNPlace").fill("Kyiv Test");
  await page.locator("#xNLat").fill("50.4501");
  await page.locator("#xNLon").fill("30.5234");
  await page.locator("#xNHouseSystem").selectOption("equal");
  await page.locator("#xNCalc").click();

  await expect.poll(() => calls.timezone.length).toBe(1);
  await expect.poll(() => calls.ephemeris.length).toBe(1);
  await expect(page.locator("#xNatalWheel")).toBeVisible();
  await expect(
    page.getByText("Astronomy Engine · true ecliptic of date", { exact: false }).first()
  ).toBeVisible();
}

test("Natal saves profile and renders precise 10-body ephemeris", async ({ page }) => {
  const calls = { timezone: [], ephemeris: [] };
  await installNatalMocks(page, calls);
  await openApp(page);
  await buildNatalChart(page, calls);

  expect(calls.timezone[0]).toEqual({
    date: "2000-01-15",
    time: "12:30",
    lat: 50.4501,
    lon: 30.5234
  });
  expect(calls.ephemeris[0]).toEqual({
    utc: "2000-01-15T10:30:00.000Z"
  });

  const profile = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("la_natal_profile") || "{}")
  );

  expect(profile).toMatchObject({
    date: "2000-01-15",
    time: "12:30",
    place: "Kyiv Test",
    lat: "50.4501",
    lon: "30.5234",
    houseSystem: "equal",
    utcOffset: "2",
    timezone: "Europe/Kyiv",
    utcIso: "2000-01-15T10:30:00.000Z",
    timezoneToken: "2000-01-15|12:30|50.4501|30.5234"
  });

  const exportData = await page.evaluate(() => window.LUMEN_NATAL_EXPORT_DATA);
  expect(Object.keys(exportData.pos).sort()).toEqual(Object.keys(NATAL_POSITIONS).sort());
  for (const [name, expected] of Object.entries(NATAL_POSITIONS)) {
    expect(exportData.pos[name]).toBeCloseTo(expected, 10);
  }

  for (const planet of [
    "СОНЦЕ",
    "МІСЯЦЬ",
    "МЕРКУРІЙ",
    "ВЕНЕРА",
    "МАРС",
    "ЮПІТЕР",
    "САТУРН",
    "УРАН",
    "НЕПТУН",
    "ПЛУТОН"
  ]) {
    await expect(
      page.locator(".settings-grid article small").filter({ hasText: planet })
    ).toHaveCount(1);
  }
});

test("Natal switches between LUMEN and Classic chart views", async ({ page }) => {
  const calls = { timezone: [], ephemeris: [] };
  await installNatalMocks(page, calls);
  await openApp(page);
  await buildNatalChart(page, calls);

  await expect(page.locator("#xNatalLumen")).toHaveClass(/primary/);
  await expect(page.locator("#xNatalWheel")).not.toHaveClass(/classic-natal-svg/);

  await page.locator("#xNatalClassic").click();

  await expect(page.locator("#xNatalClassic")).toHaveClass(/primary/);
  await expect(page.locator(".classic-chart-shell")).toBeVisible();
  await expect(page.locator(".classic-natal-table")).toBeVisible();
  await expect(page.locator(".classic-aspect-matrix")).toBeVisible();
  await expect(page.locator("#xNatalWheel")).toHaveClass(/classic-natal-svg/);
  expect(
    await page.evaluate(() => localStorage.getItem("la_natal_view"))
  ).toBe("classic");

  await page.locator("#xNatalLumen").click();

  await expect(page.locator("#xNatalLumen")).toHaveClass(/primary/);
  await expect(page.locator(".classic-chart-shell")).toHaveCount(0);
  await expect(page.locator("#xNatalWheel")).not.toHaveClass(/classic-natal-svg/);
  expect(
    await page.evaluate(() => localStorage.getItem("la_natal_view"))
  ).toBe("lumen");
});

test("Profile clear removes all local app data including sound keys", async ({ page }) => {
  await openApp(page);

  const seeded = {
    la_journal: '[{"id":"smoke-history"}]',
    la_favorites: '["smoke-history"]',
    la_natal_profile: '{"date":"2000-01-15"}',
    la_profile_prefs: '{"displayName":"Smoke User","density":"compact"}',
    la_compatibility: '{"score":77}',
    la_tarot_type: "three",
    la_mode: "pro",
    la_sound_enabled: "0",
    la_sound_volume: "37",
    la_natal_view: "classic",
    la_personalization_enabled: "1"
  };
  const keys = Object.keys(seeded);

  await page.evaluate(entries => {
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, value);
    }
  }, seeded);

  await openProfile(page);

  const before = await page.evaluate(storageKeys =>
    Object.fromEntries(storageKeys.map(key => [key, localStorage.getItem(key)])),
    keys
  );
  expect(before).toEqual(seeded);

  let dialogMessage = "";
  page.once("dialog", dialog => {
    dialogMessage = dialog.message();
    void dialog.accept();
  });

  await Promise.all([
    page.waitForEvent("load"),
    page.locator("#xClear").click()
  ]);

  expect(dialogMessage).toBe("Очистити локальні дані LUMEN ARCANA?");
  await expect(page.locator("#app .top h1")).toBeVisible();

  const after = await page.evaluate(storageKeys =>
    Object.fromEntries(storageKeys.map(key => [key, localStorage.getItem(key)])),
    keys
  );

  expect(after).toEqual(
    Object.fromEntries(keys.map(key => [key, null]))
  );
});


test("Home quick actions are compact on mobile", async ({ page }) => {
  await openApp(page);

  const buttons = page.locator(".home-quick-grid button");
  await expect(buttons).toHaveCount(6);

  const style = await buttons.first().evaluate(node => {
    const css = getComputedStyle(node);
    return {
      minHeight: css.minHeight,
      paddingTop: css.paddingTop,
      paddingRight: css.paddingRight,
      borderRadius: css.borderRadius
    };
  });

  expect(style.minHeight).toBe("88px");
  expect(style.paddingTop).toBe("12px");
  expect(style.paddingRight).toBe("13px");
  expect(style.borderRadius).toBe("17px");
});


test("Home quick action icons sit beside text with aligned label starts", async ({ page }) => {
  await openApp(page);

  const buttons = page.locator(".home-quick-grid button");
  await expect(buttons).toHaveCount(6);

  const layouts = await buttons.evaluateAll(nodes => nodes.map(node => {
    const css = getComputedStyle(node);
    const box = node.getBoundingClientRect();
    const icon = node.querySelector("b").getBoundingClientRect();
    const text = node.querySelector("span").getBoundingClientRect();
    return {
      display: css.display,
      iconCenterY: icon.top + icon.height / 2,
      textCenterY: text.top + text.height / 2,
      iconRight: icon.right,
      textLeft: text.left,
      textOffset: text.left - box.left
    };
  }));

  for (const layout of layouts) {
    expect(layout.display).toBe("grid");
    expect(layout.textLeft).toBeGreaterThan(layout.iconRight);
    expect(Math.abs(layout.iconCenterY - layout.textCenterY)).toBeLessThan(12);
  }

  const offsets = layouts.map(x => x.textOffset);
  expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThan(1.5);
});

test("Corrupt localStorage does not break core app screens", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("la_profile_prefs", "{");
    localStorage.setItem("la_natal_profile", "{");
    localStorage.setItem("la_compatibility", "{");
    localStorage.setItem("la_journal", "{");
  });

  await openApp(page);
  await expect(page.locator("#app .top h1")).toBeVisible();

  await page.locator('[data-go="daily"]').click();
  await expect(page.locator("#app .top h1")).toBeVisible();

  await page.locator('[data-r="home"]').click();
  await page.locator('[data-go="compatibility"]').click();
  await expect(page.locator("#app .top h1")).toBeVisible();
});


test("Day card artwork is fully visible without cropping", async ({ page }) => {
  await openApp(page);

  const card = page.locator(".day-card .mini-card.day-card-art");
  await expect(card).toBeVisible();

  const image = card.locator("img");
  await expect(image).toHaveCount(1);
  await expect.poll(() =>
    image.evaluate(node => node.complete && node.naturalWidth > 0 && node.naturalHeight > 0)
  ).toBe(true);

  const audit = await card.evaluate(node => {
    const img = node.querySelector("img");
    const cardCss = getComputedStyle(node);
    const imageCss = getComputedStyle(img);
    const rect = node.getBoundingClientRect();
    const host = node.closest(".day-card");
    const hostCss = getComputedStyle(host);
    return {
      objectFit: imageCss.objectFit,
      objectPosition: imageCss.objectPosition,
      cardRatio: rect.width / rect.height,
      naturalRatio: img.naturalWidth / img.naturalHeight,
      overflow: cardCss.overflow,
      enhanced: host.classList.contains("day-card-enhanced"),
      hostDisplay: hostCss.display,
      hasOverlayLabel: !!node.querySelector(".day-card-art-label"),
      rightEdge: rect.right,
      viewportWidth: window.innerWidth
    };
  });

  expect(audit.objectFit).toBe("contain");
  expect(audit.objectPosition).toContain("50%");
  expect(audit.overflow).toBe("hidden");
  expect(audit.naturalRatio).toBeGreaterThan(0);
  expect(Math.abs(audit.cardRatio - 0.58)).toBeLessThan(0.02);
  expect(audit.enhanced).toBe(true);
  expect(audit.hostDisplay).toBe("grid");
  expect(audit.hasOverlayLabel).toBe(false);
  expect(audit.rightEdge).toBeLessThanOrEqual(audit.viewportWidth);
});


test("Optional module failure does not block app startup", async ({ page }) => {
  await page.route("**/background.js*", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: 'throw new Error("optional-module-smoke")'
    })
  );

  await openApp(page);
  await page.waitForFunction(() => window.LUMEN_BOOT_STATUS);

  const status = await page.evaluate(() => structuredClone(window.LUMEN_BOOT_STATUS));
  expect(status.ok).toBe(false);
  expect(status.failed).toContain("background");

  await expect(page.locator(".home-quick-grid button")).toHaveCount(6);
  await expect(page.locator(".day-card").first()).toBeVisible();
  await expect(page.locator("#bottom-nav")).toBeVisible();
});


test("Shared core helpers escape, parse, toast and shell safely", async ({ page }) => {
  await openApp(page);

  const audit = await page.evaluate(async () => {
    const core = await import("/core.js?v=3.0.0-beta.1-a1");

    localStorage.setItem("core_bad_json", "{");
    localStorage.setItem("core_good_json", JSON.stringify({ ok: 1 }));

    const host = document.createElement("div");
    const content = core.pageShell(
      host,
      "<Unsafe title>",
      'Sub & "quote"',
      "<b>SEAL</b>"
    );

    const toast = document.createElement("div");
    core.flashToast(toast, "Core toast", 5000);

    const result = {
      escaped: core.escapeHtml('<>&"\''),
      bad: core.parseLocal("core_bad_json", { fallback: true }),
      good: core.parseLocal("core_good_json", {}),
      title: host.querySelector("h1")?.textContent,
      sub: host.querySelector(".top p")?.textContent,
      sealHtml: host.querySelector(".seal")?.innerHTML,
      contentIsReturned: content === host.querySelector("#content"),
      toastText: toast.textContent,
      toastShown: toast.classList.contains("show")
    };

    localStorage.removeItem("core_bad_json");
    localStorage.removeItem("core_good_json");
    return result;
  });

  expect(audit.escaped).toBe("&lt;&gt;&amp;&quot;&#39;");
  expect(audit.bad).toEqual({ fallback: true });
  expect(audit.good).toEqual({ ok: 1 });
  expect(audit.title).toBe("<Unsafe title>");
  expect(audit.sub).toBe('Sub & "quote"');
  expect(audit.sealHtml).toBe("<b>SEAL</b>");
  expect(audit.contentIsReturned).toBe(true);
  expect(audit.toastText).toBe("Core toast");
  expect(audit.toastShown).toBe(true);
});
