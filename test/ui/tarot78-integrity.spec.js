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
  await page.waitForFunction(
    () => Array.isArray(window.LUMEN_TAROT78) && window.LUMEN_TAROT78.length === 78
  );
}

test("Tarot 78 deck integrity stays complete and unique", async ({ page }) => {
  await openApp(page);

  const audit = await page.evaluate(async () => {
    const cards = window.LUMEN_TAROT78 || [];
    const duplicateValues = values => {
      const seen = new Set();
      const duplicates = new Set();
      for (const value of values) {
        if (seen.has(value)) duplicates.add(value);
        seen.add(value);
      }
      return [...duplicates];
    };

    const ids = cards.map(card => card.id);
    const names = cards.map(card => card.name);
    const images = cards.map(card => card.image);
    const groupCounts = cards.reduce((acc, card) => {
      acc[card.group] = (acc[card.group] || 0) + 1;
      return acc;
    }, {});

    const assetChecks = await Promise.all(
      cards.map(async card => {
        const response = await fetch(card.image, {
          method: "HEAD",
          cache: "no-store"
        });
        return {
          id: card.id,
          name: card.name,
          image: card.image,
          ok: response.ok,
          status: response.status,
          contentType: response.headers.get("content-type") || ""
        };
      })
    );

    window.LUMEN_RENDER_DECK78?.("all");

    return {
      total: cards.length,
      uniqueIds: new Set(ids).size,
      uniqueNames: new Set(names).size,
      uniqueImages: new Set(images).size,
      duplicateIds: duplicateValues(ids),
      duplicateNames: duplicateValues(names),
      duplicateImages: duplicateValues(images),
      groupCounts,
      badAssets: assetChecks.filter(item => !item.ok),
      badContentTypes: assetChecks.filter(
        item => !/^image\/jpe?g(?:;|$)/i.test(item.contentType)
      ),
      renderedArticles: document.querySelectorAll(".classic-deck article").length,
      renderedImages: document.querySelectorAll(".classic-deck .rws-card-img").length
    };
  });

  expect(audit.total).toBe(78);
  expect(audit.uniqueIds).toBe(78);
  expect(audit.uniqueNames).toBe(78);
  expect(audit.uniqueImages).toBe(78);
  expect(audit.duplicateIds).toEqual([]);
  expect(audit.duplicateNames).toEqual([]);
  expect(audit.duplicateImages).toEqual([]);

  expect(audit.groupCounts).toEqual({
    major: 22,
    wands: 14,
    cups: 14,
    swords: 14,
    pentacles: 14
  });

  expect(audit.badAssets).toEqual([]);
  expect(audit.badContentTypes).toEqual([]);
  expect(audit.renderedArticles).toBe(78);
  expect(audit.renderedImages).toBe(78);
});
