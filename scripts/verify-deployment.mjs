import { readFileSync } from "node:fs";

const expectedSha = process.env.GITHUB_SHA;
const baseUrl = (process.env.LUMEN_PRODUCTION_URL || "https://lumen-arcana.kraplenii.workers.dev").replace(/\/$/, "");
const { version: expectedVersion } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

if (!/^[a-f0-9]{40}$/i.test(expectedSha || "")) {
  throw new Error("GITHUB_SHA must be a 40-character commit SHA");
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
let lastError = "not checked";

for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    const options = { cache: "no-store", signal: AbortSignal.timeout(12000) };
    const [metaResponse, healthResponse] = await Promise.all([
      fetch(baseUrl + "/build-meta.json?sha=" + expectedSha + "&attempt=" + attempt, options),
      fetch(baseUrl + "/api/health?sha=" + expectedSha + "&attempt=" + attempt, options)
    ]);
    if (!metaResponse.ok || !healthResponse.ok) {
      throw new Error("Release metadata HTTP " + metaResponse.status + "; API health HTTP " + healthResponse.status);
    }
    const [meta, health] = await Promise.all([metaResponse.json(), healthResponse.json()]);
    if (meta.sha !== expectedSha) throw new Error("Expected commit " + expectedSha + "; live commit " + String(meta.sha));
    if (meta.version !== expectedVersion || health.version !== expectedVersion || health.ok !== true) {
      throw new Error("Worker version/health did not match package.json " + expectedVersion);
    }
    console.log("Verified live commit " + expectedSha + ", version " + expectedVersion + ", attempt " + attempt);
    process.exit(0);
  } catch (error) {
    lastError = String(error?.message || error);
    console.error("Deployment verification attempt " + attempt + "/12: " + lastError);
    if (attempt < 12) await delay(10000);
  }
}
throw new Error("Live Cloudflare release was not verified: " + lastError);
