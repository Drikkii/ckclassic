const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const PHOTO = "img/photo-mebeli";

function p(rel) {
  return `${PHOTO}/${rel.split("/").map(encodeURIComponent).join("/")}`;
}

const carousel = [
  {
    src: p("Фото, вписанные в интерьер/Ливинг в интерьере/Ливинг в интерьере (2).jpeg"),
    alt: "Мягкая мебель Ск-классик — коллекция Ливинг",
    h1: "Мягкая мебель Ск-классик",
    sub: "Собственное производство · доставка по России",
    useH1: true,
  },
  {
    src: p("Фото, вписанные в интерьер/Гермес в интерьере/Гермес в интерьере (2).jpeg"),
    alt: "Коллекция Гермес",
    title: "Коллекция Гермес",
    sub: "Классические диваны и угловые модели",
  },
  {
    src: p("фото на белом/Данте линейка/Данте (диван-кровать).jpeg"),
    alt: "Коллекция Данте",
    title: "Коллекция Данте",
    sub: "Диваны, кресла и пуфы",
  },
  {
    src: p("Фото, вписанные в интерьер/Шантал Милорд в интерьере/Шантал Милорд в интерьере (2).jpeg"),
    alt: "Модельный ряд",
    title: "Модельный ряд",
    sub: "Диваны, кресла, угловые и модульные системы",
  },
  {
    src: p("Фото, вписанные в интерьер/новинка Bellezza.JPG"),
    alt: "Наши работы",
    title: "Наши работы",
    sub: "Реализованные проекты и отзывы клиентов",
  },
];

// verify files exist, fallback scan
function exists(rel) {
  return fs.existsSync(path.join(ROOT, PHOTO, ...rel.split("/")));
}

function pickExisting(candidates) {
  for (const c of candidates) if (exists(c)) return p(c);
  return null;
}

// Fix carousel paths with fallbacks
carousel[0].src =
  pickExisting([
    "Фото, вписанные в интерьер/Ливинг в интерьере/Ливинг в интерьере (2).jpeg",
    "Оффер 26/Ливинг МФ СК классик.jpeg",
    "фото на белом/Ливинг линейка/Ливинг   диван.jpeg",
  ]) || carousel[0].src;

carousel[1].src =
  pickExisting([
    "Фото, вписанные в интерьер/Гермес в интерьере/Гермес в интерьере (2).jpeg",
    "фото на белом/Гермес линейка/Гермес диван-кровать (пума).JPG",
    "Оффер 26/Гермес угловой диван МФ СК классик.jpeg",
  ]) || carousel[1].src;

carousel[2].src =
  pickExisting([
    "фото на белом/Данте линейка/Данте (диван-кровать).jpeg",
    "Оффер 26/Данте диван-кровать МФ СК классик.jpeg",
  ]) || carousel[2].src;

carousel[3].src =
  pickExisting([
    "Фото, вписанные в интерьер/Шантал Милорд в интерьере/Шантал Милорд в интерьере (2).jpeg",
    "фото на белом/Шантал Милорд линейка/Шантал  Милорд.jpeg",
  ]) || carousel[3].src;

carousel[4].src =
  pickExisting([
    "Фото, вписанные в интерьер/новинка Bellezza.JPG",
    "Оффер 26/новинка Bellezza МФ СК классик.JPG",
    "Фото, вписанные в интерьер/СК -классик МФ.jpg",
  ]) || carousel[4].src;

const rooms = {
  living: [
    { href: "pages/catalog/living.html", img: pickExisting(["фото на белом/Ливинг линейка/Ливинг   диван.jpeg"]), label: "Диваны" },
    { href: "pages/catalog/living.html", img: pickExisting(["фото на белом/Ливинг линейка/Ливин набор диван и кресло.jpg"]), label: "Кресла" },
    { href: "pages/catalog/living.html", img: pickExisting(["фото на белом/Ливинг линейка/Ливин уг.jpeg"]), label: "Угловые модели" },
  ],
  bedroom: [
    { href: "pages/catalog/beds.html", img: pickExisting(["Оффер 26/Данте диван-кровать МФ СК классик.jpeg"]), label: "Кровати" },
    { href: "pages/catalog/living.html", img: pickExisting(["фото на белом/Ямайка линейка/Ямайка диван-кровать.jpeg"]), label: "Банкетки" },
    { href: "pages/catalog/living.html", img: pickExisting(["Фото и видео живые  СК-классик/Данте  пуф.jpg"]), label: "Пуфы" },
  ],
  office: [
    { href: "pages/catalog/hermes.html", img: pickExisting(["Фото и видео живые  СК-классик/Гермес кресло.jpg"]), label: "Кресла руководителя" },
    { href: "pages/catalog/dante.html", img: pickExisting(["фото на белом/Данте линейка/Данте (3).jpeg"]), label: "Диваны" },
    { href: "pages/catalog/turin.html", img: pickExisting(["фото на белом/Турин линейка/Турин кресло.jpg"]), label: "Кресла" },
  ],
  hall: [
    { href: "pages/catalog/chairs.html", img: pickExisting(["фото на белом/Шантал Милорд линейка/Шантал Милорд кресло.jpeg"]), label: "Банкетки" },
    { href: "pages/catalog/chairs.html", img: pickExisting(["Фото и видео живые  СК-классик/Джокер  пуф.jpg"]), label: "Пуфы" },
    { href: "pages/catalog/scarlett.html", img: pickExisting(["фото на белом/Скарлет линейка/Скарлет кресло.jpeg"]), label: "Кресла" },
  ],
};

const catalogCards = [
  { href: "pages/catalog/living.html", img: pickExisting(["фото на белом/Ливинг линейка/Ливинг   диван.jpeg"]), label: "Диваны" },
  { href: "pages/catalog/living.html", img: pickExisting(["фото на белом/Ливинг линейка/Ливин уг.jpeg"]), label: "Угловые диваны" },
  { href: "pages/catalog/hermes.html", img: pickExisting(["фото на белом/Гермес линейка/Гермес (3).jpeg"]), label: "Кресла" },
  { href: "pages/catalog/jamaica.html", img: pickExisting(["фото на белом/Ямайка линейка/Ямайка диван модульный.JPG"]), label: "Модульные системы" },
  { href: "pages/catalog/beds.html", img: pickExisting(["Оффер 26/Тесео диван-кровать МФ СК классик.jpeg"]), label: "Кушетки" },
  { href: "pages/catalog/chairs.html", img: pickExisting(["фото на белом/Шантал Милорд линейка/шантал милорд кресло с кареткой на подлокотниках.jpeg"]), label: "Банкетки" },
  { href: "pages/catalog/chairs.html", img: pickExisting(["Фото и видео живые  СК-классик/Джокер  пуф.jpg"]), label: "Пуфы" },
  { href: "pages/catalog/dionis.html", img: pickExisting(["фото на белом/Дионис диван-кровать (НПБ, выкатной)/Дионис (пума).jpeg"]), label: "Канапе" },
];

const works = [
  {
    img: pickExisting(["Фото, вписанные в интерьер/Ливинг в интерьере/Ливинг в интерьере (2).jpeg", "Оффер 26/Ливинг МФ СК классик.jpeg"]),
    title: "Гостиная Classic",
    text: "Диван и два кресла в ткани бежевого оттенка",
    href: "pages/catalog/living.html",
  },
  {
    img: pickExisting(["Фото, вписанные в интерьер/Ямайка в интерьере/Ямайка в интерьере (2).jpeg", "фото на белом/Ямайка линейка/Ямайка диван-кровать.jpeg"]),
    title: "Спальня Comfort",
    text: "Кровать с мягким изголовьем и банкетка",
    href: "pages/catalog/beds.html",
  },
  {
    img: pickExisting(["Фото, вписанные в интерьер/Гермес в интерьере/Гермес в интерьере (2).jpeg"]),
    title: "Кабинет Prestige",
    text: "Кресло руководителя и диван для переговоров",
    href: "pages/catalog/hermes.html",
  },
  {
    img: pickExisting(["Фото, вписанные in интерьер/новинка Bellezza.JPG", "Фото, вписанные в интерьер/новинка Bellezza.JPG"]),
    title: "Гостиная Modern",
    text: "Угловой диван и журнальная зона",
    href: "pages/catalog/custom.html",
  },
];

let html = fs.readFileSync(INDEX, "utf8");

function slideHtml(s, clone) {
  const cap = s.useH1
    ? `<h1>${s.h1 || s.title}</h1><p>${s.sub}</p>`
    : `<h2>${s.title}</h2><p>${s.sub}</p>`;
  const aria = clone ? ' aria-hidden="true"' : "";
  const cls = clone ? ' class="carousel__slide carousel__slide--clone"' : ' class="carousel__slide"';
  return `          <li${cls}${aria}>
            <img src="${s.src}" alt="${s.alt}" />
            <div class="carousel__caption">${cap}</div>
          </li>`;
}

const last = carousel[carousel.length - 1];
const first = carousel[0];
const trackInner = [
  slideHtml(last, true),
  ...carousel.map((s) => slideHtml(s, false)),
  slideHtml(first, true),
].join("\n");

html = html.replace(
  /<ul class="carousel__track">[\s\S]*?<\/ul>/,
  `<ul class="carousel__track">\n${trackInner}\n        </ul>`,
);

function roomCard(item, more) {
  if (more) {
    return `                  <a class="room-card room-card--more" href="pages/catalog/living.html"
                    >Все предметы раздела →</a
                  >`;
  }
  return `                  <a class="room-card" href="${item.href}"
                    ><img src="${item.img}" alt="${item.label}" loading="lazy" /><span>${item.label}</span></a
                  >`;
}

for (const [panel, items] of Object.entries(rooms)) {
  const grid = items.map((i) => roomCard(i)).join("\n") + "\n" + roomCard(null, true);
  html = html.replace(
    new RegExp(
      `(data-panel="${panel}"[\\s\\S]*?<div class="room-grid">)[\\s\\S]*?(</div>\\s*</div>)`,
    ),
    `$1\n${grid}\n                $2`,
  );
}

const catGrid = catalogCards
  .map(
    (c) =>
      `            <a class="catalog-card" href="${c.href}"
              ><img src="${c.img}" alt="${c.label}" loading="lazy" /><span>${c.label}</span></a
            >`,
  )
  .join("\n");

html = html.replace(
  /<div class="catalog-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<section class="section" id="works">/,
  `<div class="catalog-grid">\n${catGrid}\n          </div>\n        </div>\n      </section>\n\n      <section class="section" id="works">`,
);

const worksGrid = works
  .map(
    (w) => `            <article class="work-card">
              <img src="${w.img}" alt="${w.title}" loading="lazy" />
              <div class="work-card__body">
                <h3>${w.title}</h3>
                <p>${w.text}</p>
                <a href="${w.href}" class="work-card__link">Подробнее</a>
              </div>
            </article>`,
  )
  .join("\n");

html = html.replace(
  /<div class="works-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<section class="section section--alt" id="about">/,
  `<div class="works-grid">\n${worksGrid}\n          </div>\n        </div>\n      </section>\n\n      <section class="section section--alt" id="about">`,
);

fs.writeFileSync(INDEX, html, "utf8");
console.log("index.html updated");
