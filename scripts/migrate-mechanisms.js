const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const catalogPath = path.join(ROOT, "catalog-data.js");

const MECHANISM_FILTER_OLD =
  /              <div class="catalog-filters__group">\s*<span class="catalog-filters__label">Механизм трансформации<\/span>[\s\S]*?<\/div>\s*<\/div>/;

const MECHANISM_FILTER_NEW = `              <div class="catalog-filters__group">
                <span class="catalog-filters__label">Механизм трансформации</span>
                <div class="catalog-filters__options">
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="mechanism_type" value="none" />
                    Без механизма
                  </label>
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="mechanism_type" value="puma" />
                    Пума
                  </label>
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="mechanism_type" value="spartak" />
                    Спартак
                  </label>
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="mechanism_type" value="rollout" />
                    Выкатной
                  </label>
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="mechanism_type" value="high-rollout" />
                    Высоковыкатной
                  </label>
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="mechanism_type" value="gaslift" />
                    Газлифт
                  </label>
                </div>
              </div>`;

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
    if (Array.isArray(item.mechanisms)) {
      continue;
    }

    item.mechanisms = ["none"];
    item.mechanismLabel = "Без механизма";
    delete item.hasMechanism;
    delete item.mechanismType;
    changed += 1;
  }

  const next = `window.CATALOG_PRODUCTS = ${JSON.stringify(items, null, 2)};\n`;
  fs.writeFileSync(catalogPath, next, "utf8");
  console.log(`catalog-data.js: migrated ${changed} products`);
}

function migrateCatalogPages() {
  const dir = path.join(ROOT, "pages", "catalog");
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".html") || file === "product.html") continue;
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, "utf8");
    if (!MECHANISM_FILTER_OLD.test(html)) {
      console.warn("Skip filters:", file);
      continue;
    }
    html = html.replace(MECHANISM_FILTER_OLD, MECHANISM_FILTER_NEW);
    fs.writeFileSync(filePath, html, "utf8");
    console.log("Updated filters:", file);
  }
}

migrateCatalogData();
migrateCatalogPages();
