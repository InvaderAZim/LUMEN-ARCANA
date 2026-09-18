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
}

async function openProfile(page) {
  await page.locator('#bottom-nav [data-r="profile"]').click();
  await expect(page.locator("#app .top h1")).toHaveText("Профіль");
  await expect(page.locator("#lumenSoundSetting")).toBeVisible();
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
