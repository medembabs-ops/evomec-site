import puppeteer from "/Users/mac/Downloads/web/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, "temporary screenshots");
fs.mkdirSync(outDir, { recursive: true });

const url = process.argv[2];
const label = process.argv[3];
const width = parseInt(process.argv[4], 10) || 1440;
const height = parseInt(process.argv[5], 10) || 900;

if (!url) {
  console.error("Usage: node screenshot.mjs <url> [label] [width] [height]");
  process.exit(1);
}

function nextIndex() {
  const existing = fs.readdirSync(outDir).filter(f => /^screenshot-\d+/.test(f));
  const nums = existing.map(f => parseInt(f.match(/^screenshot-(\d+)/)[1], 10));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

const n = nextIndex();
const suffix = label ? `-${label}` : "";
const outPath = path.join(outDir, `screenshot-${n}${suffix}.png`);

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width, height });
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise(r => setTimeout(r, 600));

// Gradually scroll to trigger any scroll-linked reveal animations before capture
const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
const step = 400;
for (let y = 0; y < scrollHeight; y += step) {
  await page.evaluate(yy => window.scrollTo(0, yy), y);
  await new Promise(r => setTimeout(r, 180));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 400));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved ${outPath}`);
