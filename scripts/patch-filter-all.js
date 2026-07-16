const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "pages", "catalog");
const INSERT = `              <div class="catalog-filters__group catalog-filters__group--all">
                <label class="catalog-filters__option catalog-filters__option--all">
                  <input type="checkbox" name="filter_all" data-filter-all />
                  Все
                </label>
              </div>

`;
const MARKER = '<form data-catalog-filters-form>';
const AFTER =
  `${MARKER}\n              <div class="catalog-filters__group">\n                <span class="catalog-filters__label">По стилям</span>`;
const REPLACEMENT =
  `${MARKER}\n${INSERT}              <div class="catalog-filters__group">\n                <span class="catalog-filters__label">По стилям</span>`;

for (const file of fs.readdirSync(ROOT)) {
  if (!file.endsWith(".html") || file === "product.html") continue;
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes("data-filter-all")) {
    console.log("Already patched:", file);
    continue;
  }
  if (!html.includes(AFTER)) {
    console.warn("Pattern not found:", file);
    continue;
  }
  html = html.replace(AFTER, REPLACEMENT);
  fs.writeFileSync(filePath, html, "utf8");
  console.log("Updated", file);
}
