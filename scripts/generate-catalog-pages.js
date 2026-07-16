const fs = require("fs");
const path = require("path");
const {
  pages: SEO_PAGES,
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  getPageKeywords,
} = require("./seo-data");
const { renderSeoHead, buildCanonical } = require("./seo-meta");

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

function isChairProduct(text) {
  const t = text.toLowerCase();
  if (/диван|углов|модуль|набор|комплект|оттоман/i.test(t)) return false;
  return /кресл|стул|пуф/i.test(t);
}

function detectMechanism(text) {
  const t = text.toLowerCase();
  if (/панел|камин|спинк/i.test(t) || isChairProduct(text)) {
    return { mechanisms: [], mechanismLabel: "" };
  }

  const mechanisms = [];
  if (/пум|puma/i.test(t)) mechanisms.push("puma");
  if (/спартак/i.test(t)) mechanisms.push("spartak");
  if (/высоковыкат|выс\.?\s*выкат/i.test(t)) mechanisms.push("high-rollout");
  else if (/выкат/i.test(t)) mechanisms.push("rollout");
  if (/газлифт|gas/i.test(t)) mechanisms.push("gaslift");

  if (!mechanisms.length && !/диван-кровать|кроват|расклад|раскл/i.test(t)) {
    return { mechanisms: ["none"], mechanismLabel: "Без механизма" };
  }

  if (!mechanisms.length) {
    mechanisms.push("rollout");
  }

  const labels = {
    none: "Без механизма",
    puma: "Пума",
    spartak: "Спартак",
    rollout: "Выкатной",
    "high-rollout": "Высоковыкатной",
    gaslift: "Газлифт",
  };

  return {
    mechanisms,
    mechanismLabel: mechanisms.map((key) => labels[key] || key).join(" / "),
  };
}

function detectType(text) {
  const t = text.toLowerCase();
  if (/пуф/i.test(t)) return "pouf";
  if (/кресл/i.test(t)) return "armchair";
  if (/оттоман/i.test(t) && /угл/i.test(t)) return "corner-ottoman";
  if (/углов|уг\b/i.test(t)) return "corner-classic";
  if (/модуль|набор/i.test(t)) return "modular-set";
  return "straight";
}

function computeWidth(i, text) {
  const t = text.toLowerCase();
  if (isChairProduct(t)) return 58 + (i % 3) * 4;
  if (/уг/i.test(t)) return 240 + (i % 4) * 20;
  if (/модуль|набор/i.test(t)) return 200 + (i % 5) * 16;
  return 170 + (i % 6) * 15;
}

function buildDimensions(widthCm, text, index = 0) {
  if (isChairProduct(text)) return "52 × 58 × 98 см";
  const length = /уг/i.test(text) ? 240 + (index % 4) * 10 : 170 + (index % 6) * 8;
  const width = widthCm;
  const height = /кресл/i.test(text) ? 98 : 88;
  return `${length} × ${width} × ${height} см`;
}

const COLLECTION_INTERIOR = {
  living: "Фото, вписанные в интерьер/Ливинг в интерьере",
  hermes: "Фото, вписанные в интерьер/Гермес в интерьере",
  dante: "Фото, вписанные в интерьер/Данте в интерьере",
  shantal: "Фото, вписанные в интерьер/Шантал Милорд в интерьере",
  jamaica: "Фото, вписанные в интерьер/Ямайка в интерьере",
  scarlett: "Фото, вписанные в интерьер/Скарлет в интерьере",
  teseo: "Фото, вписанные в интерьер/Тесео в интерьере",
  turin: "Фото, вписанные в интерьер/Турин в интерьере",
  dionis: "Фото, вписанные в интерьер/Дионис в интерьере",
};

function buildGallery(mainImg, pool, maxPhotos = 8) {
  const types = [
    "general",
    "detail",
    "interior",
    "mechanism",
    "detail",
    "interior",
    "detail",
    "mechanism",
  ];
  const uniquePool = [...new Set((pool || []).filter(Boolean))];
  const rest = uniquePool.filter((img) => img !== mainImg);
  return [mainImg, ...rest.slice(0, maxPhotos - 1)].map((img, idx) => ({
    src: photoHref(img),
    alt: cleanName(img),
    type: types[idx] || "detail",
  }));
}

function hashSku(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildDescription(name, colLabel, mech, type, style, i, text) {
  const parts = [`${name} — модель коллекции «${colLabel}».`];

  if (isChairProduct(text)) {
    parts.push("Удобная посадка и классический силуэт для столовой или гостиной.");
  } else if (type === "corner-ottoman" || type === "corner-classic") {
    parts.push("Угловая компоновка экономит место и формирует уютную зону отдыха.");
  } else if (type === "modular-set") {
    parts.push("Модульный набор — можно подобрать состав под планировку комнаты.");
  } else if (type === "armchair") {
    parts.push("Классическое кресло с комфортной посадкой для гостиной или кабинета.");
  } else if (type === "pouf") {
    parts.push("Пуфик дополняет композицию и добавляет удобных мест для отдыха.");
  } else {
    parts.push("Сбалансированные пропорции и мягкая посадка для повседневного комфорта.");
  }

  if (mech.mechanismLabel) {
    parts.push(`Механизм трансформации: ${mech.mechanismLabel}.`);
  } else if (!isChairProduct(text)) {
    parts.push("Статичная конструкция рассчитана на ежедневное использование.");
  }

  const tails = [
    "Обивка выбирается из каталога тканей и декора фабрики.",
    "Качественные материалы обеспечивают долгий срок службы.",
    "Менеджер поможет подобрать комплектацию и рассчитать стоимость.",
    style === "modern"
      ? "Современное исполнение сочетается с фабричным контролем качества."
      : style === "art-deco"
        ? "Арт-деко подчёркивает выразительность коллекции «Ск-классик»."
        : style === "loft-scandinavian"
          ? "Лофт-скандинавский стиль сочетает лаконичность и фабричное качество."
          : "Классическая отделка соответствует стилю коллекции «Ск-классик».",
  ];
  parts.push(tails[i % tails.length]);

  return parts.join(" ");
}

function buildProducts(images, collection, prefix, priceBase, group, imagePool) {
  const styles = ["classic", "classic", "modern", "art-deco", "loft-scandinavian", "classic"];
  return images.slice(0, 6).map((img, i) => {
    const label = cleanName(img);
    const col = detectCollection(img, collection.col);
    const name = productDisplayName(label, collection.title);
    const sku = `${prefix}-${String(i + 1).padStart(3, "0")}`;
    const text = `${img} ${label} ${name}`;
    const mech = detectMechanism(text);
    const type = detectType(text);
    const width = computeWidth(i, text);
    const price = priceBase + i * 8500 + (i % 2) * 3200;

    return {
      image: photoHref(img),
      gallery: buildGallery(img, imagePool || images, 8),
      name,
      sku,
      collectionLabel: COLLECTION_LABELS[col] || collection.title,
      collection: col,
      group,
      style: styles[i] || "classic",
      type,
      dims: buildDimensions(width, text, i),
      length: /уг/i.test(text) ? 240 + (i % 4) * 10 : 170 + (i % 6) * 8,
      width,
      height: isChairProduct(text) ? 98 : 88,
      mechanisms: mech.mechanisms,
      mechanismLabel: mech.mechanismLabel,
      price,
      basePrice: price,
      isNew: i === 0 || /новин|bellezza/i.test(text),
      popularity: 40 + (hashSku(sku) % 60),
      description: buildDescription(
        name,
        COLLECTION_LABELS[col] || collection.title,
        mech,
        type,
        styles[i] || "classic",
        i,
        text,
      ),
      frame: isChairProduct(text)
        ? "массив бука, фанера"
        : "массив бука, фанера, берёзовая латофлекс",
      filler: "ППУ высокой плотности, синтепон",
      base:
        type === "corner-ottoman"
          ? "угловой диван с оттоманкой"
          : type === "corner-classic"
            ? "угловая композиция"
            : type === "modular-set"
              ? "модульный набор"
              : type === "armchair"
                ? "кресло"
                : type === "pouf"
                  ? "пуфик"
                  : "прямой диван",
      fabrics: ["standard", "velvet-classic", "chenille", "jacquard", "boucle"],
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
                  <p class="catalog-product__price">от ${p.price.toLocaleString("ru-RU")} ₽</p>
                </div>
              </article>`;
}

function renderPage(page, globalPriceMin, globalPriceMax, globalWidthMin, globalWidthMax, productCount) {
  const defaultCollections =
    page.defaultCollections !== undefined
      ? page.defaultCollections
      : page.collection.col;
  const catalogFocus = page.catalogFocus ? ` data-catalog-focus="${page.catalogFocus}"` : "";
  const pagePath = `/pages/catalog/${page.slug}.html`;
  const seoConfig = SEO_PAGES[pagePath];
  const pageTitle = seoConfig?.title || `${page.title} — Ск-классик`;
  const pageDescription = seoConfig?.description || page.seoIntro;
  const seoBlock = `<!-- ck-seo:start -->
${renderSeoHead({
  title: pageTitle,
  description: pageDescription,
  keywords: getPageKeywords(pagePath, seoConfig),
  canonical: buildCanonical(SITE_URL, pagePath),
  ogImage: DEFAULT_OG_IMAGE,
  siteName: SITE_NAME,
}).trimEnd()}
<!-- ck-seo:end -->`;

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pageTitle}</title>
${seoBlock}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;600&family=Inter:wght@400;500;600&display=swap"
    />
    <link
      rel="stylesheet"
      href="../../style.css"
      media="print"
      onload="this.media='all'"
    />
    <noscript><link rel="stylesheet" href="../../style.css" /></noscript>
    <link
      rel="stylesheet"
      href="../../catalog.css"
      media="print"
      onload="this.media='all'"
    />
    <noscript><link rel="stylesheet" href="../../catalog.css" /></noscript>
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
        </header>

        <button class="catalog-filters-toggle" type="button" data-filters-toggle>Фильтры</button>

        <div class="catalog-layout">
          <aside class="catalog-filters" data-catalog-filters-panel>
            <h2 class="catalog-filters__title">Фильтры</h2>
            <form data-catalog-filters-form>
              <div class="catalog-filters__group catalog-filters__group--all">
                <label class="catalog-filters__option catalog-filters__option--all">
                  <input type="checkbox" name="filter_all" data-filter-all />
                  Все
                </label>
                <label class="catalog-filters__option catalog-filters__option--all">
                  <input type="checkbox" name="filter_new" data-filter-new />
                  Новинки
                </label>
              </div>

              <div class="catalog-filters__group">
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
                  <label class="catalog-filters__option"><input type="checkbox" name="collection" value="dionis" /> Дионис</label>
                </div>
              </div>

              <div class="catalog-filters__group">
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
              </div>

              <div class="catalog-filters__group">
                <span class="catalog-filters__label">Ширина, см</span>
                <div class="catalog-filters__width">
                  <input
                    class="catalog-filters__width-input"
                    type="number"
                    name="width_from"
                    data-width-from
                    placeholder="от"
                    min="${globalWidthMin}"
                    max="${globalWidthMax}"
                  />
                  <span class="catalog-filters__width-sep">—</span>
                  <input
                    class="catalog-filters__width-input"
                    type="number"
                    name="width_to"
                    data-width-to
                    placeholder="до"
                    min="${globalWidthMin}"
                    max="${globalWidthMax}"
                  />
                </div>
              </div>

              <div class="catalog-filters__group">
                <span class="catalog-filters__label">По цене, до</span>
                <div class="catalog-filters__price-control">
                  <input
                    class="catalog-filters__price-input"
                    type="text"
                    name="price_to"
                    data-price-input
                    min="${globalPriceMin}"
                    max="${globalPriceMax}"
                    value="${globalPriceMax}"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="Например, 177 777"
                  />
                  <span class="catalog-filters__price-control-suffix" aria-hidden="true">₽</span>
                </div>
                <input
                  class="catalog-filters__range"
                  type="range"
                  name="price"
                  min="${globalPriceMin}"
                  max="${globalPriceMax}"
                  step="1"
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
              <p class="catalog-main__count" data-catalog-count>Показано: …</p>
              <div class="catalog-main__controls">
                <input
                  class="catalog-main__search"
                  type="search"
                  name="q"
                  data-catalog-search
                  placeholder="Поиск по названию или артикулу"
                  autocomplete="off"
                />
                <label class="catalog-main__sort">
                  Сортировка
                  <select data-catalog-sort>
                    <option value="new">По новизне</option>
                    <option value="popular">По популярности</option>
                    <option value="price-asc">По цене ↑</option>
                    <option value="price-desc">По цене ↓</option>
                    <option value="collection">По коллекции</option>
                  </select>
                </label>
              </div>
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

    <script src="../../site-config.js" defer></script>
    <script src="../../seo-config.js" defer></script>
    <script src="../../seo.js" defer></script>
    <script src="../../layout.js" defer></script>
    <script src="../../api/catalog.js.php" defer></script>
    <script src="../../site.js" defer></script>
    <script src="../../image-thumbs.js" defer></script>
    <script src="../../shop.js" defer></script>
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

const FABRICS = [
  { id: "standard", name: "Стандарт (базовая)", delta: 0 },
  { id: "velvet-classic", name: "Велюр «Классик»", delta: 8500 },
  { id: "chenille", name: "Шенилл «Комфорт»", delta: 12000 },
  { id: "jacquard", name: "Жаккард «Премиум»", delta: 18500 },
  { id: "leather-eco", name: "Экокожа «Soft»", delta: 22000 },
  { id: "boucle", name: "Букле «Тренд»", delta: 15000 },
  { id: "fringe-gold", name: "Бахрома золото", delta: 9500 },
  { id: "fringe-silver", name: "Бахрома серебро", delta: 9500 },
];

const allProducts = [];

for (const page of pages) {
  let images = [];
  let imagePool = [];
  for (const folder of page.folders) {
    const allInFolder = listImages(folder);
    const folderImgs = allInFolder.filter(page.filter);
    imagePool = imagePool.concat(allInFolder);
    images = images.concat(folderImgs);
  }

  const interiorDir = COLLECTION_INTERIOR[page.collection.col];
  if (interiorDir) {
    imagePool = imagePool.concat(listImages(interiorDir));
  }

  images = [...new Set(images)];
  imagePool = [...new Set(imagePool)];
  if (images.length < 6) {
    const extra = listImages(...page.folders).filter((f) => !images.includes(f));
    images = [...new Set([...images, ...extra])].slice(0, 6);
    imagePool = [...new Set([...imagePool, ...extra])];
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
    imagePool,
  );
  allProducts.push(...page.products);

  if (page.slug === "living") {
    page.defaultCollections = "living";
  } else if (["hermes", "dante", "shantal-milord", "jamaica", "scarlett", "teseo", "turin", "dionis"].includes(page.slug)) {
    page.defaultCollections = page.collection.col;
  } else {
    page.catalogFocus = page.slug;
    page.defaultCollections = "";
  }
}

const globalPriceMin = Math.min(...allProducts.map((p) => p.price));
const globalPriceMax = Math.max(500000, ...allProducts.map((p) => p.price));
const globalWidthMin = Math.min(...allProducts.map((p) => p.width));
const globalWidthMax = Math.max(...allProducts.map((p) => p.width));

const dataJs = `window.CATALOG_PRODUCTS = ${JSON.stringify(allProducts, null, 2)};\n`;
fs.writeFileSync(path.join(ROOT, "catalog-data.js"), dataJs, "utf8");
console.log("catalog-data.js:", allProducts.length, "products");

const fabricsJs = `window.FABRICS = ${JSON.stringify(FABRICS, null, 2)};\n`;
fs.writeFileSync(path.join(ROOT, "fabrics-data.js"), fabricsJs, "utf8");
console.log("fabrics-data.js:", FABRICS.length, "fabrics");

for (const page of pages) {
  const html = renderPage(
    page,
    globalPriceMin,
    globalPriceMax,
    globalWidthMin,
    globalWidthMax,
    allProducts.length,
  );
  const outPath = path.join(OUT_DIR, `${page.slug}.html`);
  fs.writeFileSync(outPath, html, "utf8");
  console.log("OK", page.slug);
}
