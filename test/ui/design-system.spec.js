import { test, expect } from "@playwright/test";

async function openApp(page) {
  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
  );
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => {};
  });
  await page.goto("/");
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(() => typeof window.LUMEN_NAVIGATE === "function");
}

function panelStyle(locator) {
  return locator.evaluate(node => {
    const css = getComputedStyle(node);
    return {
      borderRadius: css.borderRadius,
      borderColor: css.borderColor,
      backgroundImage: css.backgroundImage,
      boxShadow: css.boxShadow
    };
  });
}

test("design system stylesheet is final and tokens are active", async ({ page }) => {
  await openApp(page);

  const audit = await page.evaluate(() => {
    const styles = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map(link => new URL(link.href).pathname);
    const root = getComputedStyle(document.documentElement);
    return {
      lastStylesheet: styles.at(-1),
      panelRadius: root.getPropertyValue("--ui-radius-panel").trim(),
      cardRadius: root.getPropertyValue("--ui-radius-card").trim(),
      controlRadius: root.getPropertyValue("--ui-radius-control").trim(),
      controlHeight: root.getPropertyValue("--ui-control-height").trim()
    };
  });

  expect(audit).toEqual({
    lastStylesheet: "/design-system.css",
    panelRadius: "22px",
    cardRadius: "18px",
    controlRadius: "14px",
    controlHeight: "48px"
  });
});

test("primary panels share one visual system across routes", async ({ page }) => {
  await openApp(page);

  const home = await panelStyle(page.locator(".hero-premium").first());

  await page.evaluate(() => window.LUMEN_NAVIGATE("reading"));
  await expect(page.locator("#app .top h1")).toHaveText("Таро");
  const tarot = await panelStyle(page.locator(".premium-panel").first());

  await page.evaluate(() => window.LUMEN_NAVIGATE("profile"));
  await expect(page.locator("#app .top h1")).toHaveText("Профіль");
  const profile = await panelStyle(page.locator(".profile-card").first());

  expect(tarot).toEqual(home);
  expect(profile).toEqual(home);
  expect(home.borderRadius).toBe("22px");
});

test("headings controls and fields use consistent sizing", async ({ page }) => {
  await openApp(page);

  const homeTitle = await page.locator(".top h1").evaluate(node => {
    const css = getComputedStyle(node);
    return { fontSize: css.fontSize, fontFamily: css.fontFamily, lineHeight: css.lineHeight };
  });

  const homeButtons = await page.locator(".hero-actions button").evaluateAll(nodes =>
    nodes.map(node => {
      const css = getComputedStyle(node);
      return { minHeight: css.minHeight, borderRadius: css.borderRadius, fontSize: css.fontSize };
    })
  );
  expect(new Set(homeButtons.map(x => JSON.stringify(x))).size).toBe(1);

  await page.evaluate(() => window.LUMEN_NAVIGATE("reading"));
  await expect(page.locator("#app .top h1")).toHaveText("Таро");

  const tarotTitle = await page.locator(".top h1").evaluate(node => {
    const css = getComputedStyle(node);
    return { fontSize: css.fontSize, fontFamily: css.fontFamily, lineHeight: css.lineHeight };
  });
  expect(tarotTitle).toEqual(homeTitle);

  const fieldStyle = await page.locator("#mode").evaluate(node => {
    const css = getComputedStyle(node);
    return {
      borderRadius: css.borderRadius,
      background: css.backgroundColor,
      borderColor: css.borderColor,
      paddingTop: css.paddingTop
    };
  });

  await page.evaluate(() => window.LUMEN_NAVIGATE("profile"));
  await expect(page.locator("#xName")).toBeVisible();
  const profileFieldStyle = await page.locator("#xName").evaluate(node => {
    const css = getComputedStyle(node);
    return {
      borderRadius: css.borderRadius,
      background: css.backgroundColor,
      borderColor: css.borderColor,
      paddingTop: css.paddingTop
    };
  });

  expect(profileFieldStyle).toEqual(fieldStyle);
  expect(fieldStyle.borderRadius).toBe("14px");
  expect(fieldStyle.background).toBe("rgb(9, 9, 9)");
  expect(fieldStyle.paddingTop).toBe("13px");
});

test("deck filters and standard actions use the same control radius", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.LUMEN_RENDER_DECK78?.("all"));
  await expect(page.locator(".deck-filter-grid [data-deck-filter]")).toHaveCount(6);

  const filterStyle = await page.locator(".deck-filter-grid [data-deck-filter]").first().evaluate(node => {
    const css = getComputedStyle(node);
    return { borderRadius: css.borderRadius, minHeight: css.minHeight, fontSize: css.fontSize };
  });

  expect(filterStyle.borderRadius).toBe("14px");
  expect(["46px", "48px"]).toContain(filterStyle.minHeight);
});


test("profile summary cards are equal height and avatar is proportionate", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.LUMEN_NAVIGATE("profile"));
  await expect(page.locator("#app .top h1")).toHaveText("Профіль");

  const cards = page.locator(".profile-stats-grid > article");
  await expect(cards).toHaveCount(4);

  const heights = await cards.evaluateAll(nodes =>
    nodes.map(node => Math.round(node.getBoundingClientRect().height))
  );
  expect(new Set(heights).size).toBe(1);

  const avatar = await page.locator(".profile-card .avatar").evaluate(node => {
    const css = getComputedStyle(node);
    return {
      width: parseFloat(css.width),
      height: parseFloat(css.height),
      minWidth: parseFloat(css.minWidth),
      fontSize: parseFloat(css.fontSize)
    };
  });

  expect(avatar.width).toBe(avatar.height);
  expect(avatar.width).toBeGreaterThanOrEqual(68);
  expect(avatar.minWidth).toBeGreaterThanOrEqual(68);
  expect(avatar.fontSize).toBeGreaterThanOrEqual(30);
});


test("natal form labels and select affordance are readable", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.LUMEN_NAVIGATE("natal"));
  await expect(page.locator("#app .top h1")).toHaveText("Натальна карта");

  const grid = page.locator(".natal-input-grid");
  await expect(grid).toHaveCount(1);

  const labelStyle = await grid.locator("article > small").first().evaluate(node => {
    const css = getComputedStyle(node);
    return {
      fontSize: parseFloat(css.fontSize),
      fontWeight: Number(css.fontWeight),
      letterSpacing: css.letterSpacing,
      color: css.color,
      marginBottom: parseFloat(css.marginBottom)
    };
  });

  expect(labelStyle.fontSize).toBeGreaterThanOrEqual(12);
  expect(labelStyle.fontWeight).toBeGreaterThanOrEqual(800);
  expect(labelStyle.marginBottom).toBeGreaterThanOrEqual(6);
  expect(labelStyle.color).not.toBe("rgb(159, 173, 185)");

  const select = grid.locator("select.lumen-field");
  await expect(select).toHaveCount(1);
  const selectStyle = await select.evaluate(node => {
    const css = getComputedStyle(node);
    return {
      appearance: css.appearance,
      webkitAppearance: css.webkitAppearance,
      backgroundImage: css.backgroundImage,
      paddingRight: parseFloat(css.paddingRight)
    };
  });

  expect(["none", ""]).toContain(selectStyle.appearance);
  expect(selectStyle.backgroundImage).not.toBe("none");
  expect(selectStyle.paddingRight).toBeGreaterThanOrEqual(40);
});


test("beta premium branding uses one canonical badge order", async ({ page }) => {
  await page.route("**/api/interpret", route =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "branding_regression" })
    })
  );
  await openApp(page);

  await expect(page.locator(".home-hero .badge")).toHaveText("БЕТА · ПРЕМІУМ");

  await page.evaluate(() => window.LUMEN_NAVIGATE("profile"));
  await expect(page.locator(".profile-card .premium-chip")).toHaveText("БЕТА · ПРЕМІУМ");

  await page.evaluate(() => window.LUMEN_NAVIGATE("natal"));
  await expect(page.locator(".premium-panel .badge").first()).toHaveText(
    /(?:FULL )?NATAL · BETA · PREMIUM/
  );

  await page.evaluate(() => window.LUMEN_NAVIGATE("daily"));
  await expect(page.locator(".hero-premium .badge").first()).toHaveText(
    "DAILY · BETA · PREMIUM"
  );

  await page.evaluate(() => window.LUMEN_NAVIGATE("compatibility"));
  await expect(page.locator(".premium-panel .badge").first()).toHaveText(
    "COMPATIBILITY · BETA · PREMIUM"
  );

  await page.evaluate(() => window.LUMEN_NAVIGATE("moon"));
  await expect(page.locator(".hero-premium .badge").first()).toHaveText(
    /LUNAR · BETA · PREMIUM/
  );

  await page.evaluate(() => window.LUMEN_NAVIGATE("library"));
  await expect(page.locator(".premium-strip small")).toHaveText("BETA · PREMIUM");
  await page.locator("[data-topic]").first().click();
  await expect(page.locator(".premium-panel .badge").first()).toHaveText(
    "LIBRARY · BETA · PREMIUM"
  );

  await page.evaluate(() => window.LUMEN_NAVIGATE("reading"));
  await page.locator('[data-type="single"]').click();
  await page.locator("#q").fill("Branding regression");
  await page.locator("#draw").click();
  await expect(page.locator(".result-premium")).toBeVisible();
  await expect(page.locator(".result-premium .badge").first()).toHaveText(
    "TAROT · BETA · PREMIUM · 78"
  );
});


test("quick-grid buttons safely wrap very long localized labels", async ({ page }) => {
  await openApp(page);

  const buttons = page.locator(".home-quick-grid button");
  await expect(buttons).toHaveCount(6);

  await buttons.first().evaluate(button => {
    const span = button.querySelector("span");
    const small = button.querySelector("small");
    if (span) {
      span.firstChild.textContent =
        "Надзвичайнодовгалокалізовананазварозділуякамаєкоректнопереноситися";
    }
    if (small) {
      small.textContent =
        "Дуже довгий локалізований опис функції без обрізання та горизонтального виходу за межі кнопки";
    }
  });

  const audit = await buttons.evaluateAll(nodes => nodes.slice(0, 2).map(node => {
    const span = node.querySelector("span");
    const css = getComputedStyle(node);
    const spanCss = getComputedStyle(span);
    const rect = node.getBoundingClientRect();
    return {
      buttonWidth: Math.round(rect.width),
      buttonHeight: Math.round(rect.height),
      buttonClientWidth: node.clientWidth,
      buttonScrollWidth: node.scrollWidth,
      spanClientWidth: span.clientWidth,
      spanScrollWidth: span.scrollWidth,
      minWidth: css.minWidth,
      whiteSpace: spanCss.whiteSpace,
      overflowWrap: spanCss.overflowWrap
    };
  }));

  expect(audit[0].minWidth).toBe("0px");
  expect(audit[0].whiteSpace).toBe("normal");
  expect(audit[0].overflowWrap).toBe("anywhere");
  expect(audit[0].buttonScrollWidth).toBeLessThanOrEqual(audit[0].buttonClientWidth);
  expect(audit[0].spanScrollWidth).toBeLessThanOrEqual(audit[0].spanClientWidth);
  expect(audit[0].buttonHeight).toBeGreaterThanOrEqual(88);
  expect(Math.abs(audit[0].buttonHeight - audit[1].buttonHeight)).toBeLessThanOrEqual(1);
});


test("keyboard navigation exposes a visible focus indicator", async ({ page }) => {
  await openApp(page);
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
  const style = await focused.evaluate(node => {
    const css = getComputedStyle(node);
    return { outlineStyle: css.outlineStyle, outlineWidth: parseFloat(css.outlineWidth), outlineOffset: parseFloat(css.outlineOffset) };
  });
  expect(style.outlineStyle).not.toBe("none");
  expect(style.outlineWidth).toBeGreaterThanOrEqual(3);
  expect(style.outlineOffset).toBeGreaterThanOrEqual(3);
});
