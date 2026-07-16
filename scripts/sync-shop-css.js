/**
 * Inlines shop.css into style.css (avoids render-blocking @import chain).
 * Run after editing shop.css: node scripts/sync-shop-css.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const stylePath = path.join(root, "style.css");
const shopPath = path.join(root, "shop.css");

const marker = "/* SHOP — избранное, корзина, иконки на карточках (см. shop.css) */";
const shopBody = fs
  .readFileSync(shopPath, "utf8")
  .replace(/^\/\*[\s\S]*?\*\/\s*/, "")
  .trim();

let style = fs.readFileSync(stylePath, "utf8");
const markerIndex = style.indexOf(marker);

if (markerIndex === -1) {
  console.error("Marker not found in style.css — append shop block manually first.");
  process.exit(1);
}

style = style.slice(0, markerIndex).trimEnd() + "\n\n" + marker + "\n\n" + shopBody + "\n";
fs.writeFileSync(stylePath, style);
console.log("Synced shop.css → style.css");
