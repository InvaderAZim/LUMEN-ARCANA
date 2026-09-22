import { test, expect } from "@playwright/test";

async function openApp(page, requests) {
  await page.route("https://telegram.org/js/telegram-web-app.js", route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" })
  );

  await page.route("**/api/interpret", async route => {
    const body = route.request().postDataJSON();
    requests.push(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source: "mock",
        title: "Spread Regression",
        cards: body.cards.map(card => ({
          card: card.name,
          symbolism: (card.keywords || []).join(" · "),
          practice: "Regression practice"
        })),
        synthesis: "Spread regression synthesis"
      })
    });
  });

  await page.goto("/");
  await expect(page.locator("#app .top h1")).toBeVisible();
  await page.waitForFunction(
    () => Array.isArray(window.LUMEN_TAROT78) && window.LUMEN_TAROT78.length === 78
  );
}

async function draw(page, requests, type, question, spread = null, mode = null) {
  const before = requests.length;
  await page.evaluate(() => window.LUMEN_NAVIGATE?.("reading"));
  await expect(page.locator("#app .top h1")).toHaveText("Таро");
  await page.locator(`[data-type="${type}"]`).click();
  if (spread) await page.locator(`[data-s="${spread}"]`).click();
  if (mode) await page.locator("#mode").selectOption(mode);
  await page.locator("#q").fill(question);
  await page.locator("#draw").click();
  await expect(page.locator(".result-premium")).toBeVisible();
  await expect.poll(() => requests.length).toBe(before + 1);
  return requests.at(-1);
}

function expectCards(request, expectedCount, expectedPositions) {
  expect(request.cards).toHaveLength(expectedCount);
  expect(new Set(request.cards.map(card => card.name)).size).toBe(expectedCount);
  expect(request.cards.map(card => card.position)).toEqual(expectedPositions);
  for (const card of request.cards) {
    expect(["upright", "reversed"]).toContain(card.orientation);
  }
}

test("Tarot yes/no, love and work keep correct counts and positions", async ({ page }) => {
  const requests = [];
  await openApp(page, requests);

  const cases = [
    {
      type: "yesno",
      count: 1,
      positions: ["Тенденція відповіді"]
    },
    {
      type: "love",
      count: 3,
      positions: ["Почуття", "Зв’язок", "Наступний крок"]
    },
    {
      type: "work",
      count: 3,
      positions: ["Ситуація", "Ресурс", "Дія"]
    }
  ];

  for (const item of cases) {
    const request = await draw(
      page,
      requests,
      item.type,
      `Regression ${item.type}`
    );
    expect(request.spread).toBe(item.type);
    expectCards(request, item.count, item.positions);
  }
});

const THEMED_CASES = [
  ["conflict", 5, ["Суть напруги", "Що приховано", "Твоя реакція", "Що повертає контроль", "Наступний крок"]],
  ["closure", 4, ["Що завершилось", "Що варто відпустити", "Що забрати із собою", "Наступний крок"]],
  ["new_relationship", 4, ["Твоя готовність", "Межі", "Очікування", "Як відкритися без втрати себе"]],
  ["distance", 4, ["Стан контакту", "Що підтримує довіру", "Що створює дистанцію", "Реалістичний крок"]],
  ["career_choice", 5, ["Перший напрям", "Другий напрям", "Твій ресурс", "Головний ризик", "Наступний крок"]],
  ["work_resources", 4, ["Поточна ситуація", "Твоя сильна сторона", "Що виснажує", "Практичний крок"]],
  ["month", 5, ["Головна тема", "Робота / розвиток", "Стосунки", "Ресурс", "Фокус місяця"]],
  ["week", 3, ["Що завершити", "Що помітити", "Куди рухатись"]]
];

for (const [spread, count, positions] of THEMED_CASES) {
  test(`themed Tarot spread ${spread} keeps semantic positions`, async ({ page }) => {
    const requests = [];
    await openApp(page, requests);

    const request = await draw(
      page,
      requests,
      "themed",
      `Regression themed ${spread}`,
      spread
    );

    expect(request.spread).toBe(spread);
    expectCards(request, count, positions);
  });
}

test("themed Tarot journal keeps spread mode positions and orientation", async ({ page }) => {
  const requests = [];
  await openApp(page, requests);

  const request = await draw(
    page,
    requests,
    "themed",
    "Regression themed journal",
    "career_choice",
    "pro"
  );

  expect(request.spread).toBe("career_choice");
  expect(request.mode).toBe("pro");

  await page.locator("#save78").click();

  const journal = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("la_journal") || "[]")
  );

  expect(journal).toHaveLength(1);
  expect(journal[0]).toMatchObject({
    question: "Regression themed journal",
    title: "Spread Regression",
    synthesis: "Spread regression synthesis",
    type: "themed",
    spread: "career_choice",
    mode: "pro"
  });
  expect(journal[0].cards.map(card => card.position)).toEqual([
    "Перший напрям",
    "Другий напрям",
    "Твій ресурс",
    "Головний ризик",
    "Наступний крок"
  ]);
  expect(journal[0].cards.every(card =>
    ["upright", "reversed"].includes(card.orientation)
  )).toBe(true);
  expect(journal[0].cards.every(card =>
    typeof card.group === "string" && card.group.length > 0
  )).toBe(true);
});
