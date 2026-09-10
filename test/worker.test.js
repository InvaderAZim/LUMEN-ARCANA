import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.js";

const env = {
  BETA_CODES: "LUMEN-BETA,TEST-2026",
  ASSETS: { fetch: async () => new Response("asset-ok", { status: 200 }) }
};

test("health reports Cloudflare runtime", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/health"), env);
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.ok, true);
  assert.equal(b.runtime, "cloudflare-worker");
});

test("beta verify accepts configured code", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/api/beta/verify", {
    method: "POST",
    body: JSON.stringify({ code: "test-2026" })
  }), env);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { accepted: true });
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

test("Telegram webhook requires secret configuration", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/telegram/webhook", { method: "POST", body: "{}" }), env);
  assert.equal(r.status, 503);
});

test("static request is delegated to Cloudflare assets", async () => {
  const r = await worker.fetch(new Request("https://example.workers.dev/"), env);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), "asset-ok");
});
