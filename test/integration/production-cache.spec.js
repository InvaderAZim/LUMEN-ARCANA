import { test, expect } from "@playwright/test";

test("production assets use query-less references with revalidation headers", async ({ request }) => {
  const root = await request.get("/?cacheAudit=1", {
    headers: { "cache-control": "no-cache" }
  });
  expect(root.status()).toBe(200);

  const html = await root.text();
  expect(html).not.toContain("?v=");
  expect(html).toContain('src="/bootstrap.js"');
  expect(html).toContain('href="/styles.css"');

  const bootstrap = await request.get("/bootstrap.js", {
    headers: { "cache-control": "no-cache" }
  });
  expect(bootstrap.status()).toBe(200);
  const bootstrapText = await bootstrap.text();
  expect(bootstrapText).not.toContain("?v=");
  expect(bootstrapText).toContain("import('/app.js')");
  expect(bootstrapText).toContain("'/extensions.js'");
  expect(bootstrapText).toContain("'/tarot78.js'");

  const styles = await request.get("/styles.css", {
    headers: { "cache-control": "no-cache" }
  });
  expect(styles.status()).toBe(200);

  for (const [name, response] of [
    ["bootstrap.js", bootstrap],
    ["styles.css", styles]
  ]) {
    const headers = response.headers();
    const etag = headers.etag || "";
    const cacheControl = headers["cache-control"] || "";

    console.log("CACHE_AUDIT " + JSON.stringify({
      name,
      etag,
      cacheControl
    }));

    expect(etag.length).toBeGreaterThan(0);
    expect(cacheControl).toContain("max-age=0");
    expect(cacheControl).toContain("must-revalidate");
  }
});
