const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "pages");

const pages = [
  { file: "about/business.html", title: "О бизнесе" },
  { file: "about/history.html", title: "История" },
  { file: "about/vacancies.html", title: "Вакансии" },
  { file: "about/contacts.html", title: "Контакты" },
  { file: "products/materials.html", title: "Используемые материалы и технологии" },
  { file: "products/warranty.html", title: "Гарантии" },
  { file: "products/usage.html", title: "Правила эксплуатации" },
];

function renderStub(title) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Ск-классик</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300..700;1,300..700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../../style.css" />
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

    <script src="../../layout.js"></script>
    <script src="../../index.js" defer></script>
  </body>
</html>
`;
}

for (const page of pages) {
  const outPath = path.join(OUT, page.file);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, renderStub(page.title), "utf8");
  console.log("OK", page.file);
}
