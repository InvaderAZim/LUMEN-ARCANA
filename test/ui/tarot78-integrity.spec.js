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


test("Tarot deck keeps four cards per row on mobile", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.LUMEN_RENDER_DECK78?.("all"));
  await expect(page.locator(".classic-deck article")).toHaveCount(78);

  const layout = await page.locator(".classic-deck").evaluate(grid => {
    const articles = [...grid.querySelectorAll("article")];
    const rects = articles.slice(0, 5).map(article => article.getBoundingClientRect());
    const columns = getComputedStyle(grid).gridTemplateColumns
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return {
      columnCount: columns.length,
      firstRowTops: rects.slice(0, 4).map(rect => Math.round(rect.top)),
      fifthTop: Math.round(rects[4].top),
      firstRowRights: rects.slice(0, 4).map(rect => Math.round(rect.right)),
      viewportWidth: window.innerWidth
    };
  });

  expect(layout.columnCount).toBe(4);
  expect(new Set(layout.firstRowTops).size).toBe(1);
  expect(layout.fifthTop).toBeGreaterThan(layout.firstRowTops[0]);
  expect(Math.max(...layout.firstRowRights)).toBeLessThanOrEqual(layout.viewportWidth);
});


test("Tarot deck filters are equal 3 by 2 grid", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.LUMEN_RENDER_DECK78?.("all"));

  const filters = page.locator(".deck-filter-grid [data-deck-filter]");
  await expect(filters).toHaveCount(6);

  const layout = await page.locator(".deck-filter-grid").evaluate(grid => {
    const buttons = [...grid.querySelectorAll("[data-deck-filter]")];
    const rects = buttons.map(button => button.getBoundingClientRect());
    const columns = getComputedStyle(grid).gridTemplateColumns
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return {
      columnCount: columns.length,
      widths: rects.map(rect => Math.round(rect.width)),
      heights: rects.map(rect => Math.round(rect.height)),
      tops: rects.map(rect => Math.round(rect.top))
    };
  });

  expect(layout.columnCount).toBe(3);
  expect(new Set(layout.widths).size).toBe(1);
  expect(new Set(layout.heights).size).toBe(1);
  expect(new Set(layout.tops.slice(0, 3)).size).toBe(1);
  expect(new Set(layout.tops.slice(3, 6)).size).toBe(1);
  expect(layout.tops[3]).toBeGreaterThan(layout.tops[0]);
});
