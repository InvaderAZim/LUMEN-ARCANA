import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

const env = {
  BETA_CODES: "LUMEN-BETA,TEST-2026",
  ASSETS: { fetch: async () => new Response("asset-ok", { status: 200 }) }
};

test("health reports Cloudflare runtime and canonical app version", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/health"), env);
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.ok, true);
  assert.equal(b.runtime, "cloudflare-worker");
  assert.equal(b.version, "3.0.0-beta.1");
});

test("beta verify accepts configured code", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/beta/verify", {
    method: "POST",
    body: JSON.stringify({ code: "test-2026" })
  }), env);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { accepted: true });
});

test("invalid JSON returns a client error", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/beta/verify", {
    method: "POST",
    body: "{"
  }), env);
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: "invalid_json" });
});

test("local interpretation works without OpenAI", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/interpret", {
    method: "POST",
    body: JSON.stringify({ language: "uk", question: "Що варто осмислити сьогодні?", spread: "single", cards: [{ name: "Маг", position: "Фокус", orientation: "upright", keywords: ["воля", "дія"] }] })
  }), env);
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.source, "local");
  assert.equal(b.cards.length, 1);
});

test("crisis Tarot request is blocked before interpretation", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/interpret", {
    method: "POST",
    body: JSON.stringify({ language: "uk", question: "Я хочу вчинити самогубство", spread: "single", cards: [] })
  }), env);
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.blocked, true);
  assert.equal(b.risk, "crisis");
  assert.equal(b.source, "safety");
});

test("interpretation requires at least one card", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/interpret", {
    method: "POST",
    body: JSON.stringify({ language: "uk", question: "Що варто осмислити сьогодні?", spread: "single", cards: [] })
  }), env);
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: "cards_required" });
});

test("anonymous interpretation is rejected when protected services are configured", async () => {
  const protectedEnv = { ...env, OPENAI_API_KEY: "test-key", TELEGRAM_BOT_TOKEN: "test-bot-token" };
  const r = await worker.fetch(new Request("https://example.workers.dev/api/interpret", {
    method: "POST",
    body: JSON.stringify({ language: "uk", question: "Що варто осмислити сьогодні?", spread: "single", cards: [{ name: "Маг", position: "Фокус", orientation: "upright", keywords: ["воля", "дія"] }] })
  }), protectedEnv);
  assert.equal(r.status, 401);
  assert.deepEqual(await r.json(), { error: "telegram_auth_required" });
});

test("natal timezone resolves a valid historical local datetime", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/natal/timezone", {
    method: "POST",
    body: JSON.stringify({ date: "2026-01-15", time: "12:00", lat: 50.4501, lon: 30.5234 })
  }), env);
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.ok, true);
  assert.equal(b.source, "tz-lookup+Intl");
  assert.equal(b.utc, "2026-01-15T10:00:00.000Z");
  assert.equal(b.offsetHours, 2);
  assert.equal(typeof b.timeZone, "string");
  assert.ok(b.timeZone.length > 0);
});

test("natal timezone rejects invalid coordinates", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/natal/timezone", {
    method: "POST",
    body: JSON.stringify({ date: "2026-01-15", time: "12:00", lat: 91, lon: 30.5234 })
  }), env);
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: "valid_coordinates_required" });
});

test("natal ephemeris returns finite positions for all supported bodies", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/natal/ephemeris", {
    method: "POST",
    body: JSON.stringify({ utc: "2026-09-18T00:00:00.000Z" })
  }), env);
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.ok, true);
  assert.equal(b.source, "astronomy-engine");
  assert.equal(b.frame, "true-ecliptic-of-date");
  assert.equal(b.utc, "2026-09-18T00:00:00.000Z");

  const names = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  assert.deepEqual(Object.keys(b.positions).sort(), [...names].sort());
  for (const name of names) {
    assert.equal(Number.isFinite(b.positions[name]), true, `${name} position must be finite`);
    assert.ok(b.positions[name] >= 0 && b.positions[name] < 360, `${name} longitude must be normalized`);
  }
});

test("natal ephemeris rejects an invalid UTC value", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/natal/ephemeris", {
    method: "POST",
    body: JSON.stringify({ utc: "not-a-date" })
  }), env);
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: "valid_utc_required" });
});

test("Telegram webhook requires secret configuration", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/telegram/webhook", { method: "POST", body: "{}" }), env);
  assert.equal(r.status, 503);
});

test("static request is delegated to Cloudflare assets", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/"), env);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), "asset-ok");
});


test("natal timezone resolves offsets on both sides of Kyiv DST transitions", async () => {
  const beforeSpring = await worker.fetch(new Request("https://example.workers.dev/api/natal/timezone", {
    method: "POST",
    body: JSON.stringify({ date: "2026-03-29", time: "02:30", lat: 50.4501, lon: 30.5234 })
  }), env);
  assert.equal(beforeSpring.status, 200);
  const a = await beforeSpring.json();
  assert.equal(a.timeZone, "Europe/Kyiv");
  assert.equal(a.offsetHours, 2);
  assert.equal(a.utc, "2026-03-29T00:30:00.000Z");

  const afterSpring = await worker.fetch(new Request("https://example.workers.dev/api/natal/timezone", {
    method: "POST",
    body: JSON.stringify({ date: "2026-03-29", time: "04:30", lat: 50.4501, lon: 30.5234 })
  }), env);
  assert.equal(afterSpring.status, 200);
  const b = await afterSpring.json();
  assert.equal(b.timeZone, "Europe/Kyiv");
  assert.equal(b.offsetHours, 3);
  assert.equal(b.utc, "2026-03-29T01:30:00.000Z");

  const afterAutumn = await worker.fetch(new Request("https://example.workers.dev/api/natal/timezone", {
    method: "POST",
    body: JSON.stringify({ date: "2026-10-25", time: "04:30", lat: 50.4501, lon: 30.5234 })
  }), env);
  assert.equal(afterAutumn.status, 200);
  const c = await afterAutumn.json();
  assert.equal(c.timeZone, "Europe/Kyiv");
  assert.equal(c.offsetHours, 2);
  assert.equal(c.utc, "2026-10-25T02:30:00.000Z");
});

test("natal timezone rejects a nonexistent Kyiv local time during the spring DST gap", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/natal/timezone", {
    method: "POST",
    body: JSON.stringify({ date: "2026-03-29", time: "03:30", lat: 50.4501, lon: 30.5234 })
  }), env);
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: "local_time_ambiguous_or_invalid" });
});

test.todo("natal timezone must explicitly disambiguate the repeated 03:30 local time in Kyiv during the autumn DST overlap");
