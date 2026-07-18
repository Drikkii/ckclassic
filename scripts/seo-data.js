"use strict";

/**
 * Единый источник SEO-данных для сайта.
 *
 * После изменений запустите:
 *   node scripts/build-seo-config.js
 *   node scripts/sync-seo-html.js
 *   node scripts/build-sitemap.js
 *
 * Для новой страницы добавьте запись в `pages` ниже.
 * Для заглушек используйте stubDescription("Название раздела").
 */

const SITE_URL = "https://mebel-sk-classic.ru";
const SITE_NAME = "Ск-классик";
const DEFAULT_OG_IMAGE = `${SITE_URL}/img/logo/logotipBig.webp`;
const GOOGLE_SITE_VERIFICATION = "aC1OKwHt4c6vbcrNyF9bvpZF3bJ5yqFuS44k3OWYSiU";
const YANDEX_SITE_VERIFICATION = "49336e53ef37abcf";
const YANDEX_METRIKA_ID = "110539365";

const DEFAULT_DESCRIPTION =
  "Фабрика «Ск-классик» — производитель классической мягкой мебели с 2002 года. Диваны, кресла, кровати и мебель на заказ. Доставка по России.";

/** @type {Array<{ slug: string, label: string, filter: string }>} */
const CATALOG_COLLECTIONS = [
  { slug: "living", label: "Ливинг", filter: "living" },
  { slug: "hermes", label: "Гермес", filter: "hermes" },
  { slug: "dante", label: "Данте", filter: "dante" },
  { slug: "shantal-milord", label: "Шантал Милорд", filter: "shantal" },
  { slug: "jamaica", label: "Ямайка", filter: "jamaica" },
  { slug: "scarlett", label: "Скарлет", filter: "scarlett" },
  { slug: "teseo", label: "Тесео", filter: "teseo" },
  { slug: "turin", label: "Турин", filter: "turin" },
  { slug: "dionis", label: "Дионис", filter: "dionis" },
  { slug: "milton", label: "Милтон", filter: "milton" },
  { slug: "joker", label: "Джокер", filter: "joker" },
];

/** @type {Array<{ slug: string, label: string, keywords?: string[] }>} */
const CATALOG_CATEGORY_PAGES = [
  { slug: "beds", label: "Кровати", keywords: ["кровати", "диваны-кровати", "мягкие кровати"] },
  { slug: "chairs", label: "Стулья", keywords: ["стулья", "кресла", "стулья на заказ"] },
  { slug: "panels", label: "Мягкие панели", keywords: ["мягкие панели", "стеновые панели"] },
  {
    slug: "custom",
    label: "Проектные изделия",
    keywords: ["мебель на заказ", "проектная мебель", "индивидуальный заказ мебели"],
  },
];

const FURNITURE_TOPIC_TAGS = [
  "Элитная мебель",
  "Мебель на заказ",
  "Элитная мебель на заказ",
  "Мягкая мебель",
  "Классическая мебель",
  "Премиальная мебель",
  "Мебель от производителя",
  "Диваны на заказ",
  "Кресла на заказ",
  "Кровати на заказ",
  "Доставка по России",
  "Доставка по всей стране",
  "Индивидуальный заказ",
];

const FURNITURE_META_KEYWORDS = [
  "мебельная фабрика",
  "мебель от производителя",
  "классическая мебель",
  "мягкая мебель",
  "элитная мебель",
  "премиальная мебель",
  "мебель на заказ",
  "элитная мебель на заказ",
  "диваны",
  "диваны на заказ",
  "угловые диваны",
  "диваны-кровати",
  "кресла",
  "кресла на заказ",
  "кровати",
  "кровати на заказ",
  "стулья",
  "мягкие панели",
  "проектная мебель",
  "индивидуальный заказ мебели",
  "мебель на заказ по всей России",
  "доставка мебели по России",
  "доставка по всей стране",
  "мебель с доставкой",
  "купить мебель",
  "мебель для гостиной",
  "мебель для спальни",
  "классические диваны",
  "современная мягкая мебель",
];

function uniqueKeywords(parts) {
  const seen = new Set();
  const result = [];

  for (const part of parts) {
    const value = String(part ?? "").replace(/\s+/g, " ").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function buildMetaKeywords(extra = []) {
  return uniqueKeywords([
    SITE_NAME,
    "Ск-классик",
    ...FURNITURE_META_KEYWORDS,
    ...CATALOG_COLLECTIONS.flatMap((item) => [
      item.label,
      `коллекция ${item.label}`,
      `${item.label} диваны`,
      `${item.label} кресла`,
    ]),
    ...CATALOG_CATEGORY_PAGES.flatMap((item) => [item.label, ...(item.keywords || [])]),
    ...extra,
  ]).join(", ");
}

function getPageKeywords(pagePath, pageConfig = {}) {
  if (pageConfig.keywords) {
    return pageConfig.keywords;
  }

  const catalogMatch = String(pagePath).match(/\/pages\/catalog\/([^.]+)\.html$/);
  if (catalogMatch) {
    const slug = catalogMatch[1];
    const collection = CATALOG_COLLECTIONS.find((item) => item.slug === slug);
    if (collection) {
      return buildMetaKeywords([
        `коллекция ${collection.label}`,
        collection.label,
        `${collection.label} диваны`,
        `${collection.label} кресла`,
        `${collection.label} мебель на заказ`,
      ]);
    }

    const category = CATALOG_CATEGORY_PAGES.find((item) => item.slug === slug);
    if (category) {
      return buildMetaKeywords([category.label, ...(category.keywords || [])]);
    }
  }

  return buildMetaKeywords();
}

function buildProductKeywords(product) {
  const name = String(product?.name ?? "").trim();
  const collectionLabel = String(product?.collectionLabel ?? "").trim();
  const sku = String(product?.sku ?? "").trim();

  return buildMetaKeywords(
    uniqueKeywords([
      name,
      sku,
      collectionLabel ? `коллекция ${collectionLabel}` : "",
      collectionLabel,
      name ? `${name} на заказ` : "",
      name ? `${name} купить` : "",
    ]),
  );
}

function stubDescription(title) {
  return `Раздел «${title}» на сайте мебельной фабрики «Ск-классик». Производитель классической мягкой мебели с 2002 года. Консультация и заказ по телефонам +7 (964) 510-67-47, +7 (964) 525-44-58.`;
}

const pages = {
  "/index.html": {
    title: "Ск-классик — фабрика классической мягкой мебели",
    description:
      "Мебельная фабрика «Ск-классик» — классические и современные диваны, кресла, кровати от производителя. Собственное производство с 2002 года, доставка по России.",
  },
  "/pages/about/business.html": {
    title: "О бизнесе — Ск-классик",
    description:
      "Мебельная фабрика «СК-классик» с 2002 года — премиальная мягкая мебель в классическом и современном стиле, на заказ и из модельного ряда.",
  },
  "/pages/about/history.html": {
    title: "История — Ск-классик",
    description:
      "История мебельной фабрики «СК-классик» — от мастерской талантливого конструктора до современного производства премиальной мягкой мебели.",
  },
  "/pages/about/contacts.html": {
    title: "Контакты — Ск-классик",
    description:
      "Контакты мебельной фабрики «СК-классик»: телефоны, режим работы, e-mail и реквизиты.",
  },
  "/pages/about/vacancies.html": {
    title: "Вакансии — Ск-классик",
    description: stubDescription("Вакансии"),
  },
  "/pages/products/materials.html": {
    title: "Используемые материалы и технологии — Ск-классик",
    description: stubDescription("Материалы и технологии"),
  },
  "/pages/products/warranty.html": {
    title: "Гарантии — Ск-классик",
    description: stubDescription("Гарантии"),
  },
  "/pages/products/usage.html": {
    title: "Правила эксплуатации — Ск-классик",
    description: stubDescription("Правила эксплуатации"),
  },
  "/pages/where-to-buy.html": {
    title: "Где купить — Ск-классик",
    description: stubDescription("Где купить"),
  },
  "/pages/works.html": {
    title: "Наши интерьеры — Ск-классик",
    description:
      "Реализованные интерьеры с мебелью «Ск-классик»: гостиные, спальни и кабинеты. Примеры расстановки диванов и кресел от производителя.",
  },
  "/pages/privacy.html": {
    title: "Политика конфиденциальности — Ск-классик",
    description:
      "Политика обработки персональных данных на сайте мебельной фабрики «Ск-классик».",
  },
  "/pages/cart.html": {
    title: "Оформление заказа — Ск-классик",
    description: "Корзина и оформление заказа мебели «Ск-классик».",
    robots: "noindex, follow",
  },
  "/pages/favorites.html": {
    title: "Избранное — Ск-классик",
    description: "Избранные модели мебели «Ск-классик».",
    robots: "noindex, follow",
  },
  "/pages/catalog/product.html": {
    title: "Модель — Ск-классик",
    description:
      "Карточка модели мягкой мебели «Ск-классик»: фото, размеры, цена и заказ от производителя.",
    dynamic: true,
  },
  "/pages/catalog/living.html": {
    title: "Ливинг — Ск-классик",
    description:
      "Линейка Ливинг — модульные и угловые решения для гостиной: диваны, кресла, оттоманки и комплекты в классическом стиле от фабрики «Ск-классик».",
  },
  "/pages/catalog/hermes.html": {
    title: "Гермес — Ск-классик",
    description:
      "Гермес — коллекция с выразительной классической формой: диваны, угловые композиции и кресла с мягкой посадкой от производителя «Ск-классик».",
  },
  "/pages/catalog/dante.html": {
    title: "Данте — Ск-классик",
    description:
      "Данте сочетает классический силуэт и современный комфорт. Диваны-кровати, кресла и пуфы в каталоге фабрики «Ск-классик».",
  },
  "/pages/catalog/shantal-milord.html": {
    title: "Шантал Милорд — Ск-классик",
    description:
      "Коллекция Шантал Милорд — изысканная классика с каретной стяжкой, декоративными подлокотниками и богатой отделкой.",
  },
  "/pages/catalog/jamaica.html": {
    title: "Ямайка — Ск-классик",
    description:
      "Ямайка — современная модульная система с мягкими формами. Соберите композицию под ваш интерьер от фабрики «Ск-классик».",
  },
  "/pages/catalog/scarlett.html": {
    title: "Скарлет — Ск-классик",
    description:
      "Скарлет — элегантные диваны и кресла с акцентом на комфорт и классический стиль от производителя «Ск-классик».",
  },
  "/pages/catalog/teseo.html": {
    title: "Тесео — Ск-классик",
    description:
      "Тесео — лаконичные диваны-кровати и угловые модели для гостиной и кабинета в каталоге «Ск-классик».",
  },
  "/pages/catalog/turin.html": {
    title: "Турин — Ск-классик",
    description:
      "Турин — угловые диваны, кресла и композиции с оттоманкой в классическом стиле от фабрики «Ск-классик».",
  },
  "/pages/catalog/dionis.html": {
    title: "Дионис — Ск-классик",
    description:
      "Дионис — классические диваны-кровати с выкатным или Пума-механизмом, богатой отделкой и декором от фабрики «Ск-классик».",
  },
  "/pages/catalog/milton.html": {
    title: "Милтон — Ск-классик",
    description:
      "Коллекция Милтон — диваны-кровати и кресла с механизмом «Спартак» и классической отделкой от фабрики «Ск-классик».",
  },
  "/pages/catalog/joker.html": {
    title: "Джокер — Ск-классик",
    description:
      "Коллекция Джокер — каминные кресла для отдыха и акцентные модели с выразительным силуэтом от фабрики «Ск-классик».",
  },
  "/pages/catalog/custom.html": {
    title: "Проектные изделия — Ск-классик",
    description:
      "Проектные и нестандартные изделия «Ск-классик»: мебель по вашим размерам, авторские решения и индивидуальная комплектация.",
  },
  "/pages/catalog/beds.html": {
    title: "Кровати — Ск-классик",
    description:
      "Мягкие кровати и диваны-кровати с качественным механизмом трансформации для гостиной и спальни от фабрики «Ск-классик».",
  },
  "/pages/catalog/panels.html": {
    title: "Мягкие панели — Ск-классик",
    description:
      "Мягкие стеновые панели, декоративные спинки, бахрома и тесьма — элементы отделки в стиле классического интерьера от «Ск-классик».",
  },
  "/pages/catalog/chairs.html": {
    title: "Стулья — Ск-классик",
    description:
      "Стулья и кресла «Ск-классик» для столовой и гостиной: классическое и современное исполнение, каркас из массива, обивка на выбор.",
  },
  "/404.html": {
    title: "Страница не найдена — Ск-классик",
    description:
      "Запрашиваемая страница не найдена. Перейдите на главную или в каталог мебели «Ск-классик».",
    robots: "noindex, follow",
  },
};

module.exports = {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  DEFAULT_DESCRIPTION,
  GOOGLE_SITE_VERIFICATION,
  YANDEX_SITE_VERIFICATION,
  YANDEX_METRIKA_ID,
  CATALOG_COLLECTIONS,
  CATALOG_CATEGORY_PAGES,
  FURNITURE_TOPIC_TAGS,
  FURNITURE_META_KEYWORDS,
  buildMetaKeywords,
  getPageKeywords,
  buildProductKeywords,
  stubDescription,
  pages,
};
