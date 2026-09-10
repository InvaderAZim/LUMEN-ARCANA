import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";

const root = process.cwd();
const encodedPath = path.join(root, "deploy", "LUMEN_ARCANA_v2.zip.b64");
const outDir = path.join(root, ".cloudflare-app");

if (!fs.existsSync(encodedPath)) {
  throw new Error(`Missing deployment artifact: ${encodedPath}`);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const base64 = fs.readFileSync(encodedPath, "utf8").trim();
const zip = new AdmZip(Buffer.from(base64, "base64"));
zip.extractAllTo(outDir, true);

const indexPath = path.join(outDir, "public", "index.html");
if (!fs.existsSync(indexPath)) {
  throw new Error("Cloudflare preparation failed: public/index.html was not extracted");
}

console.log("LUMEN ARCANA assets prepared for Cloudflare Workers.");
