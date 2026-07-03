const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PHOTO_ROOT = path.join(ROOT, "img", "photo-mebeli");
const OUT_DIR = path.join(ROOT, "pages", "catalog");
const IMG_RE = /\.(jpe?g|png|webp|gif)$/i;

function photoHref(relPath) {
  return (
    "../../img/photo-mebeli/" +
    relPath.split("/").map(encodeURIComponent).join("/")
  );
}

function listImages(...relativeDirs) {
  const files = [];
  for (const dir of relativeDirs) {
    const full = path.join(PHOTO_ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full)) {
      if (IMG_RE.test(name)) files.push(`${dir}/${name}`);
    }
  }
  return files;
}

function cleanName(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/\s+/g, " ")
    .trim();
}

const COLLECTION_LABELS = {
  living: "Ливинг",
  hermes: "Гермес",
  dante: "Данте",
  shantal: "Шантал Милорд",
  jamaica: "Ямайка",
  scarlett: "Скарлет",
  teseo: "Тесео",
  turin: "Турин",
  baxter: "Бакстер",
  dionis: "Дионис",
};

function detectCollection(filePath, fallback) {
  const text = filePath.toLowerCase();
  const rules = [
    ["living", /ливинг|living/],
    ["hermes", /гермес/],
    ["dante", /данте|dante/],
    ["shantal", /шантал|милорд/],
    ["jamaica", /ямайка/],
    ["scarlett", /скарлет/],
    ["teseo", /тесео/],
    ["turin", /турин/],
    ["baxter", /бакстер/],
    ["dionis", /дионис/],
  ];
  for (const [col, re] of rules) {
    if (re.test(text)) return col;
  }
  return fallback;
}

function productDisplayName(label, pageTitle) {
  const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const l = norm(label);
  const t = norm(pageTitle);
  const root = t.split(" ")[0];
  if (l.includes(t) || l.startsWith(root) || (root.length >= 4 && l.startsWith(root.slice(0, -1)))) {
    return label;
  }
  return `${pageTitle} ${label}`;
}

function buildProducts(images, collection, prefix, priceBase, group) {
  const styles = ["classic", "classic", "modern", "classic", "modern", "classic"];
  return images.slice(0, 6).map((img, i) => {
    const label = cleanName(img);
    const col = detectCollection(img, collection.col);
    return {
      image: photoHref(img),
      name: productDisplayName(label, collection.title),
      sku: `${prefix}-${String(i + 1).padStart(3, "0")}`,
      collectionLabel: COLLECTION_LABELS[col] || collection.title,
      collection: col,
      group,
      style: styles[i] || "classic",
      dims: collection.dims || "по запросу",
      price: priceBase + i * 8500 + (i % 2) * 3200,
    };
  });
}

function renderProduct(p) {
  return `              <article
                class="catalog-product"
                data-style="${p.style}"
                data-collection="${p.collection}"
                data-price="${p.price}"
              >
                <a class="catalog-product__image" href="#">
                  <img src="${p.image}" alt="${p.name}" loading="lazy" />
                </a>
                <div class="catalog-product__body">
                  <h3 class="catalog-product__title">
                    <a href="#">${p.name}</a>
                  </h3>
                  <ul class="catalog-product__meta">
                    <li><span>Артикул:</span> ${p.sku}</li>
                    <li><span>Коллекция:</span> ${p.collectionLabel}</li>
                    <li><span>Габариты:</span> ${p.dims}</li>
                  </ul>
                  <p class="catalog-product__price">${p.price.toLocaleString("ru-RU")} ₽</p>
                </div>
              </article>`;
}

function renderTags(collection) {
  const tags = [
    `<button class="catalog-tag" type="button" data-catalog-tag data-style="classic">Классические</button>`,
    `<button class="catalog-tag" type="button" data-catalog-tag data-style="modern">Современные</button>`,
    `<button class="catalog-tag" type="button" data-catalog-tag data-collection="${collection.col}">Коллекция ${collection.title}</button>`,
  ];
  if (collection.extraTag) {
    tags.push(
      `<button class="catalog-tag" type="button" data-catalog-tag data-collection="${collection.extraTag.col}">Коллекция ${collection.extraTag.title}</button>`,
    );
  }
  return tags.join("\n            ");
}

function renderPage(page, globalPriceMin, globalPriceMax, productCount) {
  const defaultCollections =
    page.defaultCollections !== undefined
      ? page.defaultCollections
      : page.collection.col;
  const catalogFocus = page.catalogFocus ? ` data-catalog-focus="${page.catalogFocus}"` : "";

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${page.title} — Ск-классик</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300..700;1,300..700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../../style.css" />
    <link rel="stylesheet" href="../../catalog.css" />
    <link rel="icon" type="image/svg+xml" href="../../favicon/favicon.svg" />
  </head>
  <body class="page-catalog" data-base="../../" data-default-collections="${defaultCollections}"${catalogFocus}>
    <div id="site-header"></div>

    <main class="main catalog-page">
      <div class="container">
        <nav class="catalog-breadcrumbs" aria-label="Хлебные крошки">
          <a href="../../index.html">Главная</a><span>/</span>
          <a href="../../index.html#materials">Каталог</a><span>/</span>
          <span>${page.title}</span>
        </nav>

        <header class="catalog-header">
          <h1 class="catalog-header__title">${page.title}</h1>
          <div class="catalog-tags">
            ${renderTags(page.collection)}
          </div>
        </header>

        <button class="catalog-filters-toggle" type="button" data-filters-toggle>Фильтры</button>

        <div class="catalog-layout">
          <aside class="catalog-filters" data-catalog-filters-panel>
            <h2 class="catalog-filters__title">Фильтры</h2>
            <form data-catalog-filters-form>
              <div class="catalog-filters__group">
                <span class="catalog-filters__label">По стилям</span>
                <div class="catalog-filters__options">
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="style" value="classic" />
                    Классический
                  </label>
                  <label class="catalog-filters__option">
                    <input type="checkbox" name="style" value="modern" />
                    Современный
                  </label>
                </div>
              </div>

              <div class="catalog-filters__group">
                <span class="catalog-filters__label">По коллекции</span>
                <div class="catalog-filters__options">
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="living" /> Ливинг</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="hermes" /> Гермес</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="dante" /> Данте</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="shantal" /> Шантал Милорд</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="jamaica" /> Ямайка</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="scarlett" /> Скарлет</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="teseo" /> Тесео</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="turin" /> Турин</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="baxter" /> Бакстер</label>
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="dionis" /> Дионис</label>
                </div>
              </div>

              <div class="catalog-filters__group">
                <span class="catalog-filters__label">По цене, до</span>
                <input
                  class="catalog-filters__range"
                  type="range"
                  name="price"
                  min="${globalPriceMin}"
                  max="${globalPriceMax}"
                  step="1000"
                  value="${globalPriceMax}"
                  data-price-range
                />
                <div class="catalog-filters__range-values">
                  <span>${globalPriceMin.toLocaleString("ru-RU")} ₽</span>
                  <span data-price-max>${globalPriceMax.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>

              <div class="catalog-filters__actions">
                <button class="catalog-filters__apply" type="submit">Применить</button>
                <button class="catalog-filters__reset" type="button" data-filter-reset>
                  Очистить все фильтры
                </button>
              </div>
            </form>
          </aside>

          <div class="catalog-main">
            <div class="catalog-main__toolbar">
              <p class="catalog-main__count" data-catalog-count>Показано: 0 из ${productCount}</p>
              <label class="catalog-main__sort">
                Сортировка
                <select data-catalog-sort>
                  <option value="name-asc">По алфавиту ↑</option>
                  <option value="name-desc">По алфавиту ↓</option>
                  <option value="price-asc">По возрастанию цены</option>
                  <option value="price-desc">По убыванию цены</option>
                </select>
              </label>
            </div>

            <div class="catalog-products-grid" data-catalog-grid></div>
          </div>
        </div>

        <section class="catalog-seo" data-readmore>
          <h2>${page.seoTitle}</h2>
          <p>${page.seoIntro}</p>
          <div class="catalog-seo__hidden">
            ${page.seoHidden.map((p) => `<p>${p}</p>`).join("\n            ")}
          </div>
          <button class="catalog-seo__toggle" type="button" data-readmore-btn>Читать подробнее</button>
        </section>
      </div>
    </main>

    <div id="site-consultation"></div>
    <div id="site-footer"></div>

    <script src="../../layout.js"></script>
    <script src="../../catalog-data.js"></script>
    <script src="../../index.js" defer></script>
    <script src="../../catalog.js" defer></script>
  </body>
</html>
`;
}

const pages = [
  {
    slug: "living",
    title: "Ливинг",
    collection: { title: "Ливинг", col: "living", dims: "модульная система" },
    folders: ["фото на белом/Ливинг линейка", "Оффер 26"],
    prefix: "SK-LV",
    priceMin: 120000,
    priceMax: 520000,
    filter: (f) => /ливинг/i.test(f),
    seoTitle: "Коллекция Ливинг — модульные диваны и кресла",
    seoIntro:
      "Линейка Ливинг — модульные и угловые решения для гостиной: диваны, кресла, оттоманки и комплекты в классическом стиле.",
    seoHidden: [
      "Модели представлены на фото производителя из каталога фабрики «Ск-классик». Доступны различные конфигурации модулей, механизмы трансформации и обивка из каталога тканей.",
      "Менеджер поможет подобрать размер, комплектацию и рассчитает стоимость с доставкой в ваш регион.",
    ],
  },
  {
    slug: "hermes",
    title: "Гермес",
    collection: { title: "Гермес", col: "hermes", dims: "диван / угловой" },
    folders: ["фото на белом/Гермес линейка", "Оффер 26"],
    prefix: "SK-HM",
    priceMin: 95000,
    priceMax: 380000,
    filter: (f) => /гермес/i.test(f),
    seoTitle: "Коллекция Гермес — классические диваны и угловые модели",
    seoIntro:
      "Гермес — коллекция с выразительной классической формой: диваны, угловые композиции и кресла с мягкой посадкой.",
    seoHidden: [
      "На странице — фотографии из производственного каталога «Ск-классик». Возможны варианты с механизмом «Пума», декоративной каретной стяжкой и подбором ткани.",
    ],
  },
  {
    slug: "dante",
    title: "Данте",
    collection: { title: "Данте", col: "dante", dims: "диван / кресло" },
    folders: ["фото на белом/Данте линейка", "Оффер 26"],
    prefix: "SK-DT",
    priceMin: 88000,
    priceMax: 340000,
    filter: (f) => /данте/i.test(f),
    seoTitle: "Коллекция Данте — диваны и кресла",
    seoIntro:
      "Данте сочетает классический силуэт и современный комфорт. В линейке — диваны-кровати, кресла и пуфы.",
    seoHidden: [
      "Все изображения взяты из фотоархива фабрики. Поможем подобрать комплектацию, ткань и механизм трансформации.",
    ],
  },
  {
    slug: "shantal-milord",
    title: "Шантал Милорд",
    collection: {
      title: "Шантал Милорд",
      col: "shantal",
      dims: "диван / кресло",
      extraTag: { title: "Дионис", col: "dionis" },
    },
    folders: ["фото на белом/Шантал Милорд линейка", "Фото и видео живые  СК-классик"],
    prefix: "SK-SM",
    priceMin: 110000,
    priceMax: 420000,
    filter: (f) => /шантал|милорд/i.test(f),
    seoTitle: "Коллекция Шантал Милорд",
    seoIntro:
      "Изысканная классика с каретной стяжкой, декоративными подлокотниками и богатой отделкой.",
    seoHidden: [
      "Модели Шантал Милорд представлены на фото производства «Ск-классик». Доступны диваны-кровати и кресла в различных тканях.",
    ],
  },
  {
    slug: "jamaica",
    title: "Ямайка",
    collection: { title: "Ямайка", col: "jamaica", dims: "модульный диван" },
    folders: ["фото на белом/Ямайка линейка", "Оффер 26"],
    prefix: "SK-JM",
    priceMin: 100000,
    priceMax: 390000,
    filter: (f) => /ямайка/i.test(f),
    seoTitle: "Коллекция Ямайка — модульные диваны",
    seoIntro:
      "Ямайка — современная модульная система с мягкими формами и возможностью собрать композицию под ваш интерьер.",
    seoHidden: [
      "Фото из каталога фабрики. Подберём модули, обивку и комплектацию под размер комнаты.",
    ],
  },
  {
    slug: "scarlett",
    title: "Скарлет",
    collection: { title: "Скарлет", col: "scarlett", dims: "диван / кресло" },
    folders: ["фото на белом/Скарлет линейка", "Оффер 26", "Фото и видео живые  СК-классик"],
    prefix: "SK-SC",
    priceMin: 90000,
    priceMax: 310000,
    filter: (f) => /скарлет/i.test(f),
    seoTitle: "Коллекция Скарлет",
    seoIntro: "Скарлет — элегантные диваны и кресла с акцентом на комфорт и классический стиль.",
    seoHidden: [
      "Изображения из фотоархива «Ск-классик». Уточняйте наличие механизмов и вариантов обивки у менеджера.",
    ],
  },
  {
    slug: "teseo",
    title: "Тесео",
    collection: { title: "Тесео", col: "teseo", dims: "диван-кровать" },
    folders: ["фото на белом/Тесео линейка", "Оффер 26", "Фото, вписанные в интерьер/Тесео в интерьере"],
    prefix: "SK-TS",
    priceMin: 85000,
    priceMax: 280000,
    filter: (f) => /тесео/i.test(f),
    seoTitle: "Коллекция Тесео",
    seoIntro: "Тесео — лаконичные диваны-кровати и угловые модели для гостиной и кабинета.",
    seoHidden: ["Фото производителя. Доступны классические и современные варианты обивки."],
  },
  {
    slug: "turin",
    title: "Турин",
    collection: { title: "Турин", col: "turin", dims: "диван / кресло" },
    folders: ["фото на белом/Турин линейка", "Фото и видео живые  СК-классик", "Фото, вписанные в интерьер/Турин в интерьере"],
    prefix: "SK-TR",
    priceMin: 92000,
    priceMax: 320000,
    filter: (f) => /турин/i.test(f),
    seoTitle: "Коллекция Турин",
    seoIntro: "Турин — угловые диваны, кресла и композиции с оттоманкой в классическом стиле.",
    seoHidden: ["Все фото — из каталога фабрики «Ск-классик»."],
  },
  {
    slug: "baxter",
    title: "Бакстер",
    collection: { title: "Бакстер", col: "baxter", dims: "диван-кровать" },
    folders: ["фото на белом/Бакстер линейка", "Оффер 26", "Фото, вписанные в интерьер/Бакстер в интерьере"],
    prefix: "SK-BX",
    priceMin: 78000,
    priceMax: 260000,
    filter: (f) => /бакстер/i.test(f),
    seoTitle: "Коллекция Бакстер",
    seoIntro: "Бакстер — мягкие диваны-кровати с комфортной посадкой и современной классикой.",
    seoHidden: ["Фото из производственного архива. Подберём ткань и размер под ваш заказ."],
  },
  {
    slug: "dionis",
    title: "Дионис",
    collection: { title: "Дионис", col: "dionis", dims: "диван-кровать" },
    folders: ["фото на белом/Дионис диван-кровать (НПБ, выкатной)", "Оффер 26", "Фото, вписанные в интерьер/Дионис в интерьере"],
    prefix: "SK-DN",
    priceMin: 105000,
    priceMax: 410000,
    filter: (f) => /дионис/i.test(f),
    seoTitle: "Коллекция Дионис — диваны-кровати",
    seoIntro:
      "Дионис — классические диваны-кровати с выкатным или Пума-механизмом, богатой отделкой и декором.",
    seoHidden: [
      "На фото — реальные модели фабрики «Ск-классик». Возможны нестандартные размеры и индивидуальная комплектация.",
    ],
  },
  {
    slug: "custom",
    title: "Проектные изделия",
    collection: { title: "Проектные", col: "living", dims: "индивидуально" },
    folders: ["Фото, вписанные в интерьер", "фото на белом/Ливинг линейка", "фото на белом/Ямайка линейка"],
    prefix: "SK-PR",
    priceMin: 150000,
    priceMax: 650000,
    filter: (f) => /нестандарт|bellezza|проект|нест/i.test(f),
    seoTitle: "Проектные и нестандартные изделия",
    seoIntro:
      "Изготовим мебель по вашим размерам и эскизам — нестандартные конфигурации, авторские решения и новинки коллекции.",
    seoHidden: [
      "Примеры проектных работ и нестандартных моделей из фотоархива фабрики. Обсудим задачу и подготовим расчёт.",
    ],
  },
  {
    slug: "beds",
    title: "Кровати",
    collection: { title: "Кровати", col: "dante", dims: "диван-кровать / спальня" },
    folders: ["Оффер 26", "фото на белом/Данте линейка", "фото на белом/Тесео линейка"],
    prefix: "SK-BD",
    priceMin: 75000,
    priceMax: 350000,
    filter: (f) => /кроват|спартак|пума/i.test(f),
    seoTitle: "Мягкие кровати и диваны-кровати",
    seoIntro:
      "Диваны-кровати и спальные решения с качественным механизмом трансформации — для гостиной и спальни.",
    seoHidden: [
      "Фото моделей с механизмами Пума, «Спартак» и другими из каталога «Ск-классик».",
    ],
  },
  {
    slug: "panels",
    title: "Мягкие панели",
    collection: { title: "Мягкие панели", col: "living", dims: "на заказ" },
    folders: ["Бахрома и тесьма", "фото на белом/Ямайка линейка", "Фото и видео живые  СК-классик"],
    prefix: "SK-PN",
    priceMin: 15000,
    priceMax: 120000,
    filter: (f) => /спинк|капитон|бахром|тесьм|драпир/i.test(f),
    seoTitle: "Мягкие панели и декоративная отделка",
    seoIntro:
      "Мягкие стеновые панели, декоративные спинки, бахрома и тесьма — элементы отделки в стиле классического интерьера.",
    seoHidden: [
      "Фото декоративных элементов и отделки из производства «Ск-классик». Изготовление по размерам.",
    ],
  },
  {
    slug: "chairs",
    title: "Стулья",
    collection: {
      title: "Стулья",
      col: "living",
      dims: "520 × 580 × 980 мм",
      extraTag: { title: "Гермес", col: "hermes" },
    },
    folders: [
      "фото на белом/Шантал Милорд линейка",
      "фото на белом/Гермес линейка",
      "фото на белом/Данте линейка",
      "Оффер 26",
    ],
    prefix: "SK-CH",
    priceMin: 20000,
    priceMax: 80000,
    filter: (f) => /кресл|стул|камин/i.test(f),
    seoTitle: "Как выбрать стул для столовой или гостиной",
    seoIntro:
      "Стул — важная часть обеденной группы: от него зависит комфорт за столом и общий вид интерьера. При выборе учитывайте высоту сиденья относительно столешницы (оптимальный зазор — 25–30 см), ширину посадочного места и тип обивки.",
    seoHidden: [
      "Фабрика «Ск-классик» предлагает стулья и кресла в классическом и современном исполнении. Каркас из массива и фанеры, наполнитель из ППУ, обивка на выбор из каталога тканей.",
      "Для кухни и столовой рекомендуем ткани с пропиткой Easy Clean; для гостиной — более декоративные материалы. Менеджер поможет подобрать комплект под ваш стол и интерьер.",
    ],
  },
];

const allProducts = [];

for (const page of pages) {
  let images = [];
  for (const folder of page.folders) {
    images = images.concat(listImages(folder).filter(page.filter));
  }
  images = [...new Set(images)];
  if (images.length < 6) {
    const extra = listImages(...page.folders).filter((f) => !images.includes(f));
    images = [...new Set([...images, ...extra])].slice(0, 6);
  } else {
    images = images.slice(0, 6);
  }

  const colMeta = page.collection;
  page.products = buildProducts(
    images,
    colMeta,
    page.prefix,
    page.priceMin + 12000,
    page.slug,
  );
  allProducts.push(...page.products);

  if (page.slug === "living") {
    page.defaultCollections = "living";
  } else if (["hermes", "dante", "shantal-milord", "jamaica", "scarlett", "teseo", "turin", "baxter", "dionis"].includes(page.slug)) {
    page.defaultCollections = page.collection.col;
  } else {
    page.catalogFocus = page.slug;
    page.defaultCollections = "";
  }
}

const globalPriceMin = Math.min(...allProducts.map((p) => p.price));
const globalPriceMax = Math.max(...allProducts.map((p) => p.price));

const dataJs = `window.CATALOG_PRODUCTS = ${JSON.stringify(allProducts, null, 2)};\n`;
fs.writeFileSync(path.join(ROOT, "catalog-data.js"), dataJs, "utf8");
console.log("catalog-data.js:", allProducts.length, "products");

for (const page of pages) {
  const html = renderPage(page, globalPriceMin, globalPriceMax, allProducts.length);
  const outPath = path.join(OUT_DIR, `${page.slug}.html`);
  fs.writeFileSync(outPath, html, "utf8");
  console.log("OK", page.slug);
}
