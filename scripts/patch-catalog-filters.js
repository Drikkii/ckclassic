const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "pages", "catalog");
const STYLE_FILTER_OLD = /              <div class="catalog-filters__group">\s*<span class="catalog-filters__label">По стилям<\/span>\s*<div class="catalog-filters__options">[\s\S]*?<\/div>\s*<\/div>/;

const STYLE_FILTER_NEW = `              <div class="catalog-filters__group">
                <span class="catalog-filters__label">По стилям</span>
                <div class="catalog-filters__options">
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="style" value="classic" />
                    Классика
                  </label>
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="style" value="modern" />
                    Современный
                  </label>
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="style" value="art-deco" />
                    Арт-деко
                  </label>
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="style" value="loft-scandinavian" />
                    Лофт-скандинавский
                  </label>
                </div>
              </div>`;

const TAGS_OLD = /          <div class="catalog-tags">[\s\S]*?<\/div>/;
const COLLECTION_TAG_RE = /data-collection="([^"]+)">Коллекция ([^<]+)<\/button>/;

for (const file of fs.readdirSync(ROOT)) {
  if (!file.endsWith(".html") || file === "product.html") continue;
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, "utf8");
  if (!STYLE_FILTER_OLD.test(html)) {
    console.warn("Skip style block:", file);
    continue;
  }
  html = html.replace(STYLE_FILTER_OLD, STYLE_FILTER_NEW);

  const tagMatch = html.match(COLLECTION_TAG_RE);
  const collectionTag = tagMatch
    ? `            <button class="catalog-tag" type="button" data-catalog-tag data-collection="${tagMatch[1]}">Коллекция ${tagMatch[2]}</button>`
    : "";

  const tagsNew = `          <div class="catalog-tags">
            <button class="catalog-tag" type="button" data-catalog-tag data-style="classic">Классика</button>
            <button class="catalog-tag" type="button" data-catalog-tag data-style="modern">Современные</button>
            <button class="catalog-tag" type="button" data-catalog-tag data-style="art-deco">Арт-деко</button>
            <button class="catalog-tag" type="button" data-catalog-tag data-style="loft-scandinavian">Лофт-скандинавский</button>
${collectionTag ? `            ${collectionTag}\n` : ""}          </div>`;

  if (TAGS_OLD.test(html)) {
    html = html.replace(TAGS_OLD, tagsNew);
  }

  fs.writeFileSync(filePath, html, "utf8");
  console.log("Updated", file);
}
