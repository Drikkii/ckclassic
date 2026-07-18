const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CATALOG_DIR = path.join(ROOT, "pages", "catalog");
const FILTER_LINE =
  '<label class="catalog-filters__option"><input type="checkbox" name="collection" value="dionis" /> Дионис</label>';
const FILTER_REPLACEMENT = `${FILTER_LINE}
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="milton" /> Милтон</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="joker" /> Джокер</label>`;

const COLLECTION_PAGES = {
  milton: {
    title: "Милтон",
    slug: "milton",
    collection: "milton",
    seoTitle: "Коллекция Милтон — диваны-кровати и кресла",
    seoIntro:
      "Милтон — диваны-кровати и кресла с механизмом «Спартак» и классической отделкой для гостиной и спальни.",
    seoHidden:
      "Модели коллекции Милтон представлены на фото производства «Ск-классик». Подберём комплектацию и ткань под ваш интерьер.",
    description:
      "Коллекция Милтон — диваны-кровати и кресла с механизмом «Спартак» и классической отделкой от фабрики «Ск-классик».",
  },
  joker: {
    title: "Джокер",
    slug: "joker",
    collection: "joker",
    seoTitle: "Коллекция Джокер — кресла и пуфы",
    seoIntro:
      "Джокер — каминные кресла для отдыха и акцентные модели с выразительным силуэтом для гостиной и кабинета.",
    seoHidden:
      "Фото реальных изделий фабрики «Ск-классик». Доступны варианты обивки из каталога тканей.",
    description:
      "Коллекция Джокер — каминные кресла для отдыха и акцентные модели с выразительным силуэтом от фабрики «Ск-классик».",
  },
};

function patchCatalogFilters() {
  for (const file of fs.readdirSync(CATALOG_DIR)) {
    if (!file.endsWith(".html") || file === "product.html") continue;
    const filePath = path.join(CATALOG_DIR, file);
    let content = fs.readFileSync(filePath, "utf8");
    if (content.includes('value="milton"')) continue;
    if (!content.includes(FILTER_LINE)) {
      console.warn("SKIP filters (no dionis line):", file);
      continue;
    }
    content = content.replace(FILTER_LINE, FILTER_REPLACEMENT);
    fs.writeFileSync(filePath, content, "utf8");
    console.log("OK filters", file);
  }
}

function createCollectionPage(config) {
  const templatePath = path.join(CATALOG_DIR, "dionis.html");
  const outPath = path.join(CATALOG_DIR, `${config.slug}.html`);
  if (fs.existsSync(outPath)) {
    console.log("EXISTS", config.slug);
    return;
  }

  let html = fs.readFileSync(templatePath, "utf8");
  html = html
    .replace(/Дионис/g, config.title)
    .replace(/dionis/g, config.slug)
    .replace(
      /<h2>Коллекция [^<]+<\/h2>\s*<p>[^<]+<\/p>/,
      `<h2>${config.seoTitle}</h2>\n          <p>${config.seoIntro}</p>`,
    )
    .replace(
      /<div class="catalog-seo__hidden">\s*<p>[^<]+<\/p>\s*<\/div>/,
      `<div class="catalog-seo__hidden">\n            <p>${config.seoHidden}</p>\n          </div>`,
    )
    .replace(
      /data-default-collections="dionis"/,
      `data-default-collections="${config.collection}"`,
    );

  fs.writeFileSync(outPath, html, "utf8");
  console.log("OK page", config.slug);
}

function productHaystack(product) {
  const name = String(product.name || "").toLowerCase();
  const mainAlt = String(product.gallery?.[0]?.alt || "").toLowerCase();
  let image = "";
  try {
    image = decodeURIComponent(String(product.image || "")).toLowerCase();
  } catch {
    image = String(product.image || "").toLowerCase();
  }
  return { name, mainAlt, image };
}

function belongsToJoker(product) {
  const { name, mainAlt, image } = productHaystack(product);
  return /джокер/.test(name) || /джокер/.test(mainAlt) || /джокер/.test(image);
}

function belongsToMilton(product) {
  const { name, mainAlt, image } = productHaystack(product);
  const hay = `${name} ${mainAlt} ${image}`;
  return /милтон/.test(hay) && !/милорд/.test(hay);
}

function assignCollection(product, slug, label) {
  product.collection = slug;
  product.collectionLabel = label;
  product.group = slug;
  if (typeof product.description === "string") {
    product.description = product.description.replace(
      /коллекции «[^»]+»/,
      `коллекции «${label}»`,
    );
  }
}

function patchCatalogData() {
  const catalogPath = path.join(ROOT, "catalog-data.js");
  const raw = fs.readFileSync(catalogPath, "utf8");
  const match = raw.match(/window\.CATALOG_PRODUCTS\s*=\s*(\[[\s\S]*\])\s*;/);
  if (!match) throw new Error("catalog-data.js parse failed");

  const products = JSON.parse(match[1]);
  let milton = 0;
  let joker = 0;

  for (const product of products) {
    if (belongsToMilton(product)) {
      assignCollection(product, "milton", "Милтон");
      milton++;
      continue;
    }
    if (belongsToJoker(product)) {
      assignCollection(product, "joker", "Джокер");
      joker++;
    }
  }

  fs.writeFileSync(
    catalogPath,
    `window.CATALOG_PRODUCTS = ${JSON.stringify(products, null, 2)};\n`,
    "utf8",
  );
  console.log(`OK catalog-data: milton=${milton}, joker=${joker}`);
}

patchCatalogFilters();
createCollectionPage(COLLECTION_PAGES.milton);
createCollectionPage(COLLECTION_PAGES.joker);
patchCatalogData();
