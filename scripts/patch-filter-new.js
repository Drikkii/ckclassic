const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "pages", "catalog");
const MARKER = `<input type="checkbox" name="filter_all" data-filter-all />
                  Все
                </label>
              </div>`;
const REPLACEMENT = `<input type="checkbox" name="filter_all" data-filter-all />
                  Все
                </label>
                <label class="catalog-filters__option catalog-filters__option--all">
                  <input type="checkbox" name="filter_new" data-filter-new />
                  Новинки
                </label>
              </div>`;

for (const file of fs.readdirSync(ROOT)) {
  if (!file.endsWith(".html") || file === "product.html") continue;
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes("data-filter-new")) {
    console.log("Already patched:", file);
    continue;
  }
  if (!html.includes(MARKER)) {
    console.warn("Pattern not found:", file);
    continue;
  }
  html = html.replace(MARKER, REPLACEMENT);
  fs.writeFileSync(filePath, html, "utf8");
  console.log("Updated", file);
}
