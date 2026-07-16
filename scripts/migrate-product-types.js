const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const catalogPath = path.join(ROOT, "catalog-data.js");
const catalogDir = path.join(ROOT, "pages", "catalog");

const SORT_OPTION =
  '                    <option value="collection">По коллекции</option>\n                  </select>';
const SORT_OLD = '                    <option value="price-desc">По цене ↓</option>\n                  </select>';

function migrateCatalogData() {
  if (!fs.existsSync(catalogPath)) {
    console.warn("Skip catalog-data.js: file not found");
    return;
  }

  const content = fs.readFileSync(catalogPath, "utf8");
  const match = content.match(/window\.CATALOG_PRODUCTS\s*=\s*(\[[\s\S]*\])\s*;/);
  if (!match) {
    console.warn("Skip catalog-data.js: products block not found");
    return;
  }

  const items = JSON.parse(match[1]);
  let changed = 0;

  for (const item of items) {
    if (item.type !== "custom-config") {
      continue;
    }

    item.type = "armchair";
    item.typeLabel = "Кресло";
    if (
      !item.base ||
      item.base === "нестандартная конфигурация" ||
      /нестандарт/i.test(String(item.base))
    ) {
      item.base = "кресло";
    }
    changed += 1;
  }

  const next = `window.CATALOG_PRODUCTS = ${JSON.stringify(items, null, 2)};\n`;
  fs.writeFileSync(catalogPath, next, "utf8");
  console.log(`catalog-data.js: migrated ${changed} products from custom-config to armchair`);
}

function patchCatalogSortOptions() {
  for (const file of fs.readdirSync(catalogDir)) {
    if (!file.endsWith(".html") || file === "product.html") continue;
    const filePath = path.join(catalogDir, file);
    let html = fs.readFileSync(filePath, "utf8");
    if (html.includes('value="collection"')) {
      continue;
    }
    if (!html.includes(SORT_OLD)) {
      console.warn("Skip sort option:", file);
      continue;
    }
    html = html.replace(
      SORT_OLD,
      '                    <option value="price-desc">По цене ↓</option>\n' + SORT_OPTION,
    );
    fs.writeFileSync(filePath, html, "utf8");
    console.log("Updated sort options:", file);
  }
}

migrateCatalogData();
patchCatalogSortOptions();
