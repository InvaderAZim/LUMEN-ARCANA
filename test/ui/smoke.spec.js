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
  await expect(page.locator(".tarot-source-badge")).toHaveCount(0);
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

test("Tarot image failure uses CSP-safe fallback classes", async ({ page }) => {
  let releaseInterpret;
  const interpretGate = new Promise(resolve => {
    releaseInterpret = resolve;
  });

  await page.route("**/api/interpret", async route => {
    const body = route.request().postDataJSON();
    await interpretGate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        blocked: false,
        risk: "normal",
        source: "mock",
        title: "Image fallback test",
        cards: body.cards.map(card => ({
          card: card.name,
          symbolism: (card.keywords || []).join(" · "),
          practice: "Fallback image test"
        })),
        synthesis: "Image fallback test"
      })
    });
  });

  await page.route("**/cards/rws/**", route => route.abort());
  await openApp(page);

  await openTarotType(page, "single");
  await page.locator("#q").fill("Тест помилки зображення");
  await page.locator("#draw").click();

  const failed = page.locator(".drawing .rws-card-img.image-failed").first();
  const fallback = page.locator(".drawing .tarot-art-fallback").first();

  await expect(failed).toHaveCount(1);
  await expect(fallback).toHaveClass(/tarot-art-fallback-visible/);
  await expect(fallback).not.toHaveClass(/tarot-art-fallback-hidden/);

  const state = await fallback.evaluate(node => ({
    styleAttr: node.getAttribute("style"),
    display: getComputedStyle(node).display
  }));

  expect(state.styleAttr).toBeNull();
  expect(state.display).toBe("grid");

  releaseInterpret();
  await expect(page.locator(".result-premium")).toBeVisible();
});

test("Tarot marks server local interpretation transparently", async ({ page }) => {
  await page.route("**/api/interpret", async route => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        blocked: false,
        risk: "normal",
        source: "local",
        title: "Локальний розклад",
        cards: body.cards.map(card => ({
          card: card.name,
          symbolism: (card.keywords || []).join(" · "),
          practice: "Одна практична дія."
        })),
        synthesis: "Локальне резервне тлумачення."
      })
    });
  });

  await openApp(page);
  await openTarotType(page, "single");
  await page.locator("#q").fill("Тест локального тлумачення");
  await page.locator("#draw").click();

  await expect(page.locator(".result-premium")).toBeVisible();
  await expect(page.locator(".tarot-source-badge")).toHaveText("Локальне тлумачення");
});

test("Tarot marks client fallback when interpretation server fails", async ({ page }) => {
  await page.route("**/api/interpret", route =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "temporary_unavailable" })
    })
  );

  await openApp(page);
  await openTarotType(page, "single");
  await page.locator("#q").fill("Тест резервного режиму");
  await page.locator("#draw").click();

  await expect(page.locator(".result-premium")).toBeVisible();
  await expect(page.locator(".tarot-source-badge")).toHaveText(
    "Локальне тлумачення · сервер недоступний"
  );
  await expect(page.locator(".result-premium h2")).toHaveText("Твій розклад");
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
    const imgRect = img.getBoundingClientRect();
    const host = node.closest(".day-card");
    const hostCss = getComputedStyle(host);
    return {
      objectFit: imageCss.objectFit,
      objectPosition: imageCss.objectPosition,
      naturalRatio: img.naturalWidth / img.naturalHeight,
      renderedRatio: imgRect.width / imgRect.height,
      frameWidthDelta: rect.width - imgRect.width,
      frameHeightDelta: rect.height - imgRect.height,
      borderWidth: parseFloat(cardCss.borderLeftWidth) || 0,
      borderRadius: cardCss.borderRadius,
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
  expect(Math.abs(audit.renderedRatio - audit.naturalRatio)).toBeLessThan(0.01);
  expect(Math.abs(audit.frameWidthDelta - audit.borderWidth * 2)).toBeLessThan(1.5);
  expect(Math.abs(audit.frameHeightDelta - audit.borderWidth * 2)).toBeLessThan(1.5);
  expect(audit.borderRadius).toBe("6px");
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


test("Moon falls back when extensions module fails", async ({ page }) => {
  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );

  await page.route("**/extensions.js*", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: 'throw new Error("extensions-fallback-smoke")'
    })
  );

  await page.goto("/");
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => window.LUMEN_BOOT_STATUS);

  const status = await page.evaluate(() => structuredClone(window.LUMEN_BOOT_STATUS));
  expect(status.ok).toBe(false);
  expect(status.failed).toContain("extensions");

  await page.locator('[data-go="moon"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Місячний календар");
  await expect(page.locator(".badge")).toContainText("LUNAR · FALLBACK");
  await expect(page.locator(".settings-grid article")).toHaveCount(4);
  await expect(page.locator(".day-card")).toContainText("Базове астрономічне наближення");
});


test("Library section labels are semantic and clean", async ({ page }) => {
  await openApp(page);

  await page.locator('[data-go="library"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Бібліотека знань");

  const labels = await page.locator(".library-section-label").allTextContents();
  expect(labels).toEqual([
    "ОСНОВИ",
    "СТАРШІ АРКАНИ",
    "ПИТАННЯ",
    "РОЗКЛАДИ",
    "СИМВОЛИ",
    "БЕЗПЕКА"
  ]);

  const libraryText = await page.locator(".library-grid").innerText();
  expect(libraryText).not.toContain("? РОЗДІЛ");
  expect(libraryText).not.toContain("◇ РОЗДІЛ");
  expect(libraryText).not.toContain("◌ РОЗДІЛ");
});


test("Academy lessons have distinct relevant practices", async ({ page }) => {
  await openApp(page);

  await page.locator('[data-go="library"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Бібліотека знань");
  await page.locator("#openAcademy").click();
  await expect(page.locator("#app .top h1")).toHaveText("Академія");

  const lessons = page.locator(".lesson");
  await expect(lessons).toHaveCount(6);

  const practices = await page.locator(".academy-practice").allTextContents();
  expect(practices).toHaveLength(6);
  expect(new Set(practices).size).toBe(6);

  const expectedFragments = [
    "що станеться",
    "три конкретні деталі",
    "ресурс",
    "повторюваний мотив",
    "Через три дні",
    "профільного фахівця"
  ];

  expectedFragments.forEach((fragment, index) => {
    expect(practices[index]).toContain(fragment);
  });

  for (let i = 0; i < 6; i++) {
    const button = lessons.nth(i).locator("[data-academy-practice]");
    const panel = lessons.nth(i).locator(".extra");

    await expect(button).not.toHaveAttribute("onclick");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    const controls = await button.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    await expect(panel).toHaveAttribute("id", controls);
    await expect(panel).toHaveAttribute("aria-hidden", "true");

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toHaveAttribute("aria-hidden", "false");
    await expect(panel).toHaveClass(/open/);
    await expect(lessons.nth(i).locator(".academy-practice")).toBeVisible();
  }

  const firstButton = lessons.first().locator("[data-academy-practice]");
  const firstPanel = lessons.first().locator(".extra");
  await firstButton.click();
  await expect(firstButton).toHaveAttribute("aria-expanded", "false");
  await expect(firstPanel).toHaveAttribute("aria-hidden", "true");
  await expect(firstPanel).not.toHaveClass(/open/);
});


test("Startup uses external scripts with no inline JavaScript", async ({ page }) => {
  await openApp(page);

  const audit = await page.evaluate(() => {
    const scripts = [...document.scripts].map(script => ({
      src: script.getAttribute("src") || "",
      type: script.getAttribute("type") || "",
      inlineText: script.textContent?.trim() || ""
    }));

    return {
      inlineScripts: scripts.filter(script => !script.src && script.inlineText),
      hasTelegramInit: scripts.some(script =>
        script.src.includes("/telegram-init.js?v=3.0.0-beta.1-a1")
      ),
      hasBootstrap: scripts.some(script =>
        script.src.includes("/bootstrap.js?v=3.0.0-beta.1-a9") &&
        script.type === "module"
      ),
      fullscreenFunction: typeof window.__lumenFullscreen,
      bootStatus: window.LUMEN_BOOT_STATUS
        ? structuredClone(window.LUMEN_BOOT_STATUS)
        : null
    };
  });

  expect(audit.inlineScripts).toEqual([]);
  expect(audit.hasTelegramInit).toBe(true);
  expect(audit.hasBootstrap).toBe(true);
  expect(audit.fullscreenFunction).toBe("function");
  expect(audit.bootStatus).toEqual({ ok: true, failed: [] });
});


test("Critical splash CSS is external with no inline style block", async ({ page }) => {
  await openApp(page);

  const audit = await page.evaluate(async () => {
    const indexHtml = await fetch("/", { cache: "no-store" }).then(r => r.text());
    const criticalCss = await fetch("/critical-splash.css?v=3.0.0-beta.1-a1", {
      cache: "no-store"
    }).then(r => r.text());

    return {
      hasInlineStyleTag: /<style\b/i.test(indexHtml),
      hasCriticalLink: indexHtml.includes(
        '/critical-splash.css?v=3.0.0-beta.1-a1'
      ),
      fixed: criticalCss.includes("position:fixed"),
      inset: criticalCss.includes("inset:0"),
      zIndex: criticalCss.includes("z-index:9999"),
      grid: criticalCss.includes("display:grid"),
      centered: criticalCss.includes("place-items:center"),
      noPointerEvents: criticalCss.includes("pointer-events:none")
    };
  });

  expect(audit.hasInlineStyleTag).toBe(false);
  expect(audit.hasCriticalLink).toBe(true);
  expect(audit.fixed).toBe(true);
  expect(audit.inset).toBe(true);
  expect(audit.zIndex).toBe(true);
  expect(audit.grid).toBe(true);
  expect(audit.centered).toBe(true);
  expect(audit.noPointerEvents).toBe(true);
});


test("app.js has no inline style attributes and fallback UI keeps styling", async ({ page }) => {
  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );

  await page.route("**/extensions.js*", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: 'throw new Error("extensions-csp-style-smoke")'
    })
  );

  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => {};
  });

  await page.goto("/");
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => window.LUMEN_BOOT_STATUS);

  const sourceHasInlineStyle = await page.evaluate(async () => {
    const source = await fetch("/app.js?v=3.0.0-beta.1-a10", {
      cache: "no-store"
    }).then(r => r.text());
    return /style\s*=/i.test(source);
  });
  expect(sourceHasInlineStyle).toBe(false);

  await page.evaluate(() => window.LUMEN_NAVIGATE("reading"));
  await expect(page.locator("#app .top h1")).toHaveText("Таро");
  const selectedType = page.locator(".tarot-type-selected");
  await expect(selectedType).toHaveCount(1);
  expect(await selectedType.getAttribute("style")).toBeNull();

  await page.evaluate(() => window.LUMEN_NAVIGATE("home"));
  await page.locator('[data-go="natal"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Натальна карта");

  const fields = page.locator(".lumen-field");
  await expect(fields).toHaveCount(3);

  const fieldAudit = await fields.first().evaluate(node => {
    const css = getComputedStyle(node);
    return {
      styleAttr: node.getAttribute("style"),
      background: css.backgroundColor,
      color: css.color,
      borderRadius: css.borderRadius,
      paddingTop: css.paddingTop,
      outlineStyle: css.outlineStyle
    };
  });

  expect(fieldAudit.styleAttr).toBeNull();
  expect(fieldAudit.background).toBe("rgb(9, 9, 9)");
  expect(fieldAudit.color).toBe("rgb(255, 255, 255)");
  expect(fieldAudit.borderRadius).toBe("14px");
  expect(fieldAudit.paddingTop).toBe("13px");
  expect(fieldAudit.outlineStyle).toBe("none");

  await expect(page.locator(".lumen-muted-copy")).toBeVisible();

  await page.evaluate(() => window.LUMEN_NAVIGATE("daily"));
  await expect(page.locator(".settings-grid.lumen-mt-14")).toBeVisible();

  await page.evaluate(() => window.LUMEN_NAVIGATE("moon"));
  await expect(page.locator(".settings-grid.lumen-mt-14")).toBeVisible();
});


test("extensions.js has no inline style attributes and keeps computed styling", async ({ page }) => {
  await openApp(page);

  const sourceAudit = await page.evaluate(async () => {
    const source = await fetch("/extensions.js?v=3.0.0-beta.1-a7", {
      cache: "no-store"
    }).then(r => r.text());
    return {
      hasInlineStyleAttr: /\sstyle\s*=\s*["']/i.test(source),
      hasHistoryClass: source.includes("x-history-head"),
      hasFieldClass: source.includes("lumen-field"),
      hasHelpClass: source.includes("lumen-help-copy"),
      hasSvgHaloClass: source.includes("classic-svg-halo")
    };
  });

  expect(sourceAudit.hasInlineStyleAttr).toBe(false);
  expect(sourceAudit.hasHistoryClass).toBe(true);
  expect(sourceAudit.hasFieldClass).toBe(true);
  expect(sourceAudit.hasHelpClass).toBe(true);
  expect(sourceAudit.hasSvgHaloClass).toBe(true);

  await page.locator('#bottom-nav [data-r="profile"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Профіль");

  const profileField = page.locator("#xName");
  await expect(profileField).toHaveClass(/lumen-field/);
  const profileCss = await profileField.evaluate(node => {
    const css = getComputedStyle(node);
    return {
      styleAttr: node.getAttribute("style"),
      background: css.backgroundColor,
      color: css.color,
      borderRadius: css.borderRadius,
      paddingTop: css.paddingTop
    };
  });
  expect(profileCss.styleAttr).toBeNull();
  expect(profileCss.background).toBe("rgb(9, 9, 9)");
  expect(profileCss.color).toBe("rgb(255, 255, 255)");
  expect(profileCss.borderRadius).toBe("14px");
  expect(profileCss.paddingTop).toBe("13px");

  await page.evaluate(() => {
    localStorage.setItem("la_natal_profile", JSON.stringify({
      date: "2000-01-15",
      time: "12:30",
      place: "Kyiv",
      lat: "50.4501",
      lon: "30.5234",
      utcOffset: "2",
      timezone: "Europe/Kyiv",
      utcIso: "2000-01-15T10:30:00.000Z",
      timezoneToken: "2000-01-15|12:30|50.4501|30.5234",
      houseSystem: "equal"
    }));
    localStorage.setItem("la_natal_view", "classic");
    window.LUMEN_NAVIGATE("natal");
  });

  await expect(page.locator("#app .top h1")).toHaveText("Натальна карта");
  await expect(page.locator("#xNDate")).toHaveClass(/lumen-field/);
  await expect(page.locator("#xNOffset")).toHaveClass(/lumen-field-dim/);

  const dimOpacity = await page.locator("#xNOffset").evaluate(node => getComputedStyle(node).opacity);
  expect(dimOpacity).toBe("0.82");

  const classicSvg = page.locator(".classic-natal-svg");
  await expect(classicSvg).toBeVisible();
  const halo = classicSvg.locator(".classic-svg-halo").first();
  await expect(halo).toBeVisible();
  const haloCss = await halo.evaluate(node => {
    const css = getComputedStyle(node);
    return {
      paintOrder: css.paintOrder,
      stroke: css.stroke,
      strokeWidth: css.strokeWidth,
      styleAttr: node.getAttribute("style")
    };
  });
  expect(haloCss.styleAttr).toBeNull();
  expect(haloCss.paintOrder).toContain("stroke");
  expect(haloCss.stroke).not.toBe("none");
  expect(["3px","4px","5px"]).toContain(haloCss.strokeWidth);
});


test("Tarot and sound settings have no inline style attributes", async ({ page }) => {
  await openApp(page);

  const sourceAudit = await page.evaluate(async () => {
    const [tarotSource, soundSource] = await Promise.all([
      fetch("/tarot78.js?v=3.0.0-beta.1-a5", { cache: "no-store" }).then(r => r.text()),
      fetch("/sound-settings.js?v=3.0.0-beta.1-a2", { cache: "no-store" }).then(r => r.text())
    ]);
    return {
      tarotHasInlineStyle: /\sstyle\s*=\s*["']/i.test(tarotSource),
      soundHasInlineStyle: /\sstyle\s*=\s*["']/i.test(soundSource),
      tarotHasHiddenClass: tarotSource.includes("tarot-art-fallback-hidden"),
      tarotHasMarginClass: tarotSource.includes("classic-deck lumen-mt-14"),
      soundHasToggleRow: soundSource.includes("sound-toggle-row"),
      soundHasToggleControl: soundSource.includes("sound-toggle-control"),
      soundHasVolumeBlock: soundSource.includes("sound-volume-block"),
      soundHasVolumeHead: soundSource.includes("sound-volume-head"),
      soundHasVolumeRange: soundSource.includes("sound-volume-range")
    };
  });

  expect(sourceAudit.tarotHasInlineStyle).toBe(false);
  expect(sourceAudit.soundHasInlineStyle).toBe(false);
  expect(sourceAudit.tarotHasHiddenClass).toBe(true);
  expect(sourceAudit.tarotHasMarginClass).toBe(true);
  expect(sourceAudit.soundHasToggleRow).toBe(true);
  expect(sourceAudit.soundHasToggleControl).toBe(true);
  expect(sourceAudit.soundHasVolumeBlock).toBe(true);
  expect(sourceAudit.soundHasVolumeHead).toBe(true);
  expect(sourceAudit.soundHasVolumeRange).toBe(true);

  await openProfile(page);

  const soundAudit = await page.evaluate(() => {
    const row = document.querySelector(".sound-toggle-row");
    const toggle = document.querySelector(".sound-toggle-control");
    const block = document.querySelector(".sound-volume-block");
    const head = document.querySelector(".sound-volume-head");
    const range = document.querySelector(".sound-volume-range");

    const rowCss = getComputedStyle(row);
    const toggleCss = getComputedStyle(toggle);
    const blockCss = getComputedStyle(block);
    const headCss = getComputedStyle(head);
    const rangeCss = getComputedStyle(range);

    return {
      styleAttrs: [row,toggle,block,head,range].map(node => node?.getAttribute("style")),
      rowDisplay: rowCss.display,
      rowGap: rowCss.gap,
      rowMarginTop: rowCss.marginTop,
      rowCursor: rowCss.cursor,
      toggleWidth: toggleCss.width,
      toggleHeight: toggleCss.height,
      blockMarginTop: blockCss.marginTop,
      headDisplay: headCss.display,
      headGap: headCss.gap,
      rangeWidth: rangeCss.width,
      rangeMarginTop: rangeCss.marginTop
    };
  });

  expect(soundAudit.styleAttrs).toEqual([null,null,null,null,null]);
  expect(soundAudit.rowDisplay).toBe("flex");
  expect(soundAudit.rowGap).toBe("10px");
  expect(soundAudit.rowMarginTop).toBe("10px");
  expect(soundAudit.rowCursor).toBe("pointer");
  expect(soundAudit.toggleWidth).toBe("20px");
  expect(soundAudit.toggleHeight).toBe("20px");
  expect(soundAudit.blockMarginTop).toBe("14px");
  expect(soundAudit.headDisplay).toBe("flex");
  expect(soundAudit.headGap).toBe("12px");
  expect(soundAudit.rangeMarginTop).toBe("8px");

  await page.locator('#bottom-nav [data-r="deck"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Колода");
  await expect(page.locator(".classic-deck.lumen-mt-14")).toBeVisible();
});
