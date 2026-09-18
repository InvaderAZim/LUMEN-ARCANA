import assert from "node:assert/strict";

const url = process.env.LUMEN_PRODUCTION_URL || "https://lumen-arcana.kraplenii.workers.dev";
const endpoint = new URL("/api/natal/timezone", url).href;
const payload = {
  date: "2026-10-25",
  time: "03:30",
  lat: 50.4501,
  lon: 30.5234
};

const attempts = Math.max(1, Number(process.env.LUMEN_SMOKE_ATTEMPTS || 18));
const delayMs = Math.max(0, Number(process.env.LUMEN_SMOKE_DELAY_MS || 10000));

let last = null;

for (let attempt = 1; attempt <= attempts; attempt++) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "LUMEN-ARCANA-production-smoke"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }

    last = { status: response.status, body };

    if (
      response.status === 400 &&
      body &&
      body.error === "local_time_ambiguous"
    ) {
      console.log(
        `Production DST smoke passed on attempt ${attempt}: ${response.status} ${JSON.stringify(body)}`
      );
      process.exit(0);
    }

    console.warn(
      `Attempt ${attempt}/${attempts}: expected HTTP 400 + local_time_ambiguous, got ${response.status} ${JSON.stringify(body)}`
    );
  } catch (error) {
    last = { error: String(error?.message || error) };
    console.warn(
      `Attempt ${attempt}/${attempts}: production request failed: ${last.error}`
    );
  }

  if (attempt < attempts && delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

assert.fail(
  `Production DST smoke failed after ${attempts} attempts. Last result: ${JSON.stringify(last)}`
);
