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
