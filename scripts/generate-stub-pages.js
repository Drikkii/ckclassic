const fs = require("fs");
const path = require("path");
const { pages: SEO_PAGES, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, stubDescription } = require("./seo-data");
const { renderSeoHead, buildCanonical } = require("./seo-meta");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "pages");

const SEO_BLOCK_START = "<!-- ck-seo:start -->";
const SEO_BLOCK_END = "<!-- ck-seo:end -->";

const pages = [
  { file: "about/vacancies.html", title: "Вакансии" },
  { file: "products/materials.html", title: "Используемые материалы и технологии" },
  { file: "products/warranty.html", title: "Гарантии" },
  { file: "products/usage.html", title: "Правила эксплуатации" },
];

function seoBlockFor(file) {
  const key = `/pages/${file}`;
  const config = SEO_PAGES[key];
  if (!config) {
    return `${SEO_BLOCK_START}\n    <meta name="description" content="${stubDescription(pages.find((p) => p.file === file)?.title || "")}" />\n${SEO_BLOCK_END}`;
  }

  return `${SEO_BLOCK_START}
${renderSeoHead({
  title: config.title,
  description: config.description,
  canonical: buildCanonical(SITE_URL, key),
  ogImage: DEFAULT_OG_IMAGE,
  siteName: SITE_NAME,
}).trimEnd()}
${SEO_BLOCK_END}`;
}

function renderStub(title, file) {
  const fullTitle = `${title} — Ск-классик`;
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${fullTitle}</title>
${seoBlockFor(file)}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;600&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../../style.css" />
    <link rel="stylesheet" href="../../about.css" />
  </head>
  <body class="page-stub-body" data-base="../../">
    <div id="site-header"></div>

    <main class="main page-stub">
      <div class="container">
        <h1 class="page-stub__title">${title}</h1>
        <p class="page-stub__text">Раздел в разработке.</p>
        <a class="page-stub__back" href="../../index.html">← На главную</a>
      </div>
    </main>

    <div id="site-consultation"></div>
    <div id="site-footer"></div>

    <script src="../../site-config.js" defer></script>
    <script src="../../seo-config.js" defer></script>
    <script src="../../seo.js" defer></script>
    <script src="../../layout.js" defer></script>
    <script src="../../site.js" defer></script>
  </body>
</html>
`;
}

for (const page of pages) {
  const outPath = path.join(OUT, page.file);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, renderStub(page.title, page.file), "utf8");
  console.log("OK", page.file);
}
