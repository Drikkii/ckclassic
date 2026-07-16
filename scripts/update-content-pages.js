const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PHOTO_ROOT = path.join(ROOT, "img", "photo-mebeli");
const IMG_RE = /\.(jpe?g|png|webp|gif)$/i;

function p(rel) {
  return `../img/photo-mebeli/${rel.split("/").map(encodeURIComponent).join("/")}`;
}

function imagesFrom(dir, limit = 12) {
  const full = path.join(PHOTO_ROOT, dir);
  if (!fs.existsSync(full)) return [];
  const out = [];
  function walk(d, prefix) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(d, e.name), rel);
      else if (IMG_RE.test(e.name)) out.push(`${dir}/${path.relative(path.join(PHOTO_ROOT, dir), path.join(d, e.name)).replace(/\\/g, "/")}`);
    }
  }
  walk(full, "");
  return out.slice(0, limit);
}

function interiorItems() {
  const base = "Фото, вписанные в интерьер";
  const cols = [
    { dir: `${base}/Ливинг в интерьере`, title: "Гостиная — Ливинг", href: "catalog/living.html" },
    { dir: `${base}/Гермес в интерьере`, title: "Гостиная — Гермес", href: "catalog/hermes.html" },
    { dir: `${base}/Данте в интерьере`, title: "Столовая — Данте", href: "catalog/dante.html" },
    { dir: `${base}/Шантал Милорд в интерьере`, title: "Гостиная — Шантал Милорд", href: "catalog/shantal-milord.html" },
    { dir: `${base}/Ямайка в интерьере`, title: "Спальня — Ямайка", href: "catalog/jamaica.html" },
    { dir: `${base}/Скарлет в интерьере`, title: "Гостиная — Скарлет", href: "catalog/scarlett.html" },
    { dir: `${base}/Турин в интерьере`, title: "Кабинет — Турин", href: "catalog/turin.html" },
    { dir: `${base}/Дионис в интерьере`, title: "Гостиная — Дионис", href: "catalog/dionis.html" },
    { dir: `${base}/Бренди в интерьере`, title: "Гостиная — Бренди", href: "catalog/living.html" },
  ];
  return cols
    .map((c) => {
      const imgs = imagesFrom(c.dir, 1);
      if (!imgs.length) return null;
      return { ...c, img: p(imgs[0]) };
    })
    .filter(Boolean);
}


function renderWorks() {
  const items = interiorItems();
  const cards = items
    .map(
      (w) => `            <article class="work-card">
              <img src="${w.img}" alt="${w.title}" loading="lazy" />
              <div class="work-card__body">
                <h3>${w.title}</h3>
                <p>Реализованный интерьер с мебелью «Ск-классик»</p>
                <a href="${w.href}" class="work-card__link">Смотреть коллекцию</a>
              </div>
            </article>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Наши работы / Отзывы — Ск-классик</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300..700;1,300..700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../style.css" />
  </head>
  <body class="page-stub-body" data-base="../">
    <div id="site-header"></div>

    <main class="main page-works">
      <div class="container">
        <h1 class="section__title">Наши интерьеры</h1>
        <p class="page-works__intro">Реализованные проекты с мебелью фабрики «Ск-кlassic» — фото из производственного архива.</p>
        <div class="works-grid">
${cards}
        </div>
      </div>
    </main>

    <div id="site-consultation"></div>
    <div id="site-footer"></div>

    <script src="../layout.js"></script>
    <script src="../index.js" defer></script>
  </body>
</html>
`;
}

function renderFabrics() {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ткани и декор — Ск-классик</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300..700;1,300..700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../style.css" />
  </head>
  <body class="page-stub-body" data-base="../">
    <div id="site-header"></div>

    <main class="main page-fabrics">
      <div class="container">
        <h1 class="section__title">Ткани и декор</h1>
        <p class="page-fabrics__intro">Каталоги декоративных материалов, бахромы и тесьмы для обивки мебели «Ск-классик». Актуальные образцы и подбор ткани — у менеджера при оформлении заказа или в салоне.</p>
      </div>
    </main>

    <div id="site-consultation"></div>
    <div id="site-footer"></div>

    <script src="../layout.js"></script>
    <script src="../index.js" defer></script>
  </body>
</html>
`;
}

fs.writeFileSync(path.join(ROOT, "pages", "works.html"), renderWorks(), "utf8");
fs.writeFileSync(path.join(ROOT, "pages", "fabrics.html"), renderFabrics(), "utf8");
console.log("works.html and fabrics.html updated");
