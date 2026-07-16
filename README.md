# Ск-классик — сайт мебельной фабрики

**Продакшн:** [mebel-sk-classic.ru](https://mebel-sk-classic.ru)  
**Локация:** Пушкино, Московская область  
**Тип проекта:** корпоративный сайт + каталог мебели + админ-панель

Корпоративный сайт мебельной фабрики «Ск-классик»: презентация коллекций, онлайн-каталог с карточками товаров, избранное и корзина заявок, формы обратной связи и полноценная PHP-админка для управления контентом без правок кода.

---

## Технологии

| Слой | Стек |
|------|------|
| **Фронтенд** | HTML5, CSS3, Vanilla JavaScript (без React/Vue) |
| **Шрифты** | Google Fonts — Cormorant, Inter (`display=swap`) |
| **Бэкенд** | PHP 8+, PDO, MySQL |
| **Изображения** | WebP, Sharp (Node.js), PHP GD/Imagick (`ImageConverter`) |
| **Сборка и SEO** | Node.js-скрипты (`scripts/`) |
| **Аналитика** | Яндекс.Метрика |
| **Хостинг** | Apache, `.htaccess` (HTTPS, кэш, маршрутизация) |

> PHP-часть (админка, API, почта) работает на хостинге с MySQL. Статические HTML/CSS/JS можно просматривать локально; каталог и слайдер подтягиваются через API или fallback-файлы `*-data.js`.

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                     Публичный сайт                          │
│  index.html · pages/ · layout.js · shop.js · catalog.js     │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   api/catalog.php   api/slider.php    api/lead.php
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
              ┌────────────────────────┐
              │   admin/ + MySQL       │
              │   ProductRepository    │
              │   SliderRepository     │
              │   CatalogExporter      │
              └───────────┬────────────┘
                          │ publish
                          ▼
              catalog-data.js · slider-data.js
              image-thumbs.js · seo-config.js
```

**Принцип работы каталога:** товары хранятся в MySQL, админка публикует JSON/JS-снимки для фронтенда. На продакшене фронт сначала читает `api/catalog.php` / `api/slider.php`, при недоступности API — статические fallback-файлы.

---

## Что сделано

### Каталог и магазин

- Каталог по коллекциям (Ливинг, Гермес, Данте, Шантал Милорд, Ямайка, Скарлет, Тесео, Турин, Дионис и др.)
- Карточки товаров с фильтрами: цена, ширина, тип, механизм, новинки
- Страница товара: галерея, характеристики, похожие модели, форма заявки
- **Избранное** и **корзина заявок** (`localStorage`, `shop.js`)
- Цены в каталоге и на карточке товара с префиксом **«от»**
- Примечание на карточках: *«Вся мебель изготавливается под заказ…»*
- Блок «Наши новинки» на главной — случайный выбор из `isNew`
- Удалена устаревшая категория Baxter из навигации, SEO и каталога

### Админ-панель (`admin/`)

- CRUD товаров: фото, галерея, цены, коллекция, механизм, SEO-поля
- Управление слайдером главной страницы с ресайзом и экспортом
- Редактор вакансий и **политики конфиденциальности**
- Конвертация загружаемых изображений в **WebP**
- Публикация каталога в `catalog-data.js` и API
- CSRF-защита, rate limit входа, конфиг в `config.php` (не в git)

### Изображения и медиа

- **Полная миграция на WebP** — фото товаров, слайдер, about, works
- Папка **`img/thumbs-480/`** — лёгкие превью для карточек каталога
- Карта миниатюр **`image-thumbs.js`** (`window.CK_IMAGE_THUMBS`)
- **Цепочки fallback** для слайдера и карточек: thumb → full → decoded path → `.jpg`
- Бежевый фон (`--color-bg-alt`) вместо белого при ошибке загрузки фото
- Слайдер: загрузка из API в первую очередь, preload hero-слайда, без статичного HTML-слайда

### Производительность (Core Web Vitals)

- **Critical CSS** inline на главной (слайдер, шапка, скелетоны карточек)
- Отложенная загрузка `style.css` и `catalog.css` (`media="print" onload`)
- Синхронные Google Fonts (`display=swap`) — без «мигания» начертания
- Скелетоны карточек «Наши новинки» — снижение CLS
- `fetchpriority="high"` для первого слайда, lazy-load для остальных
- Объединение `shop.css` в `style.css` — убран render-blocking `@import`

### SEO

- Мета-теги, Open Graph, Twitter Card на всех страницах
- `robots.txt`, `sitemap.xml`, кастомная **404**
- Верификация Google Search Console и Яндекс.Вебмастер
- SEO-данные в `scripts/seo-data.js`, синхронизация через `sync-seo-html.js`
- Динамический SEO карточки товара (`seo.js`, `CK_applyProductSeo`)

### Контент и UX

- Единый header/footer через `layout.js`
- Формы заявок с отправкой на почту (`api/lead.php`) и fallback в `localStorage`
- Страницы: О компании, контакты, вакансии, ткани и декор, наши интерьеры
- В футере ссылка **«Кресла»** вместо «Стулья»
- Страница «Ткани и декор» — текстовая, без фото-каталога

### Инфраструктура и скрипты

| Скрипт | Назначение |
|--------|------------|
| `generate-catalog-pages.js` | Генерация HTML-страниц коллекций |
| `generate-catalog-thumbs.js` | Превью 480px + `image-thumbs.js` |
| `migrate-site-to-webp.js` | Массовая конвертация в WebP |
| `sync-seo-html.js` | SEO-блоки, critical CSS, async CSS |
| `sync-shop-css.js` | Inline `shop.css` → `style.css` |
| `build-sitemap.js` | Обновление `sitemap.xml` |
| `optimize-slider-images.js` | Responsive-варианты слайдера (-640w, -1280w, -1920w) |

---

## Структура проекта

```
ckclassic/
├── index.html              # Главная: слайдер, новинки, блоки
├── pages/                  # Каталог, товар, корзина, about, works…
├── api/                    # catalog.php, slider.php, lead.php, privacy.php
├── admin/                  # Админ-панель
│   ├── lib/                # Repository, Exporter, ImageConverter…
│   └── config.example.php  # Шаблон конфигурации (MySQL, site_root)
├── img/
│   ├── photo-mebeli/       # Фото товаров (WebP)
│   ├── slider/             # Слайдер главной
│   └── thumbs-480/         # Миниатюры каталога
├── scripts/                # Node.js: SEO, thumbs, миграции
├── sql/schema.sql          # Схема БД
│
├── layout.js               # Шапка, подвал, меню, формы
├── shop.js                 # Каталог, корзина, избранное, карточки
├── catalog.js              # Фильтры и сетка каталога
├── product.js              # Страница товара
├── index.js                # Карусель главной
├── home-catalog.js         # Блок «Наши новинки»
├── catalog-data.js         # Снимок каталога (генерируется)
├── image-thumbs.js         # Карта миниатюр (генерируется)
├── style.css               # Основные стили (+ shop)
└── catalog.css             # Стили каталога
```

---

## Деплой на хостинг

После изменений в админке или локально:

1. Опубликовать каталог и слайдер из админки
2. При новых фото: `node scripts/generate-catalog-thumbs.js`
3. Залить на сервер:
   - `catalog-data.js`, `image-thumbs.js`, `slider-data.js`
   - `img/thumbs-480/` (при новых превью)
   - изменённые HTML, CSS, JS
   - `admin/` и `api/` при правках бэкенда

**Важно:** `admin/config.php` создаётся на сервере из `config.example.php` и не коммитится.

---

## Локальная разработка

```bash
# Зависимости для скриптов обработки изображений
npm install sharp

# Генерация превью каталога
node scripts/generate-catalog-thumbs.js

# Синхронизация SEO по всем HTML
node scripts/sync-seo-html.js

# Генерация страниц коллекций
node scripts/generate-catalog-pages.js
```

Для PHP-админки нужен локальный сервер (OpenServer, XAMPP, `php -S`) и MySQL с импортом `sql/schema.sql`.

---

## English summary

**SK-Classic** is a furniture factory website with a PHP/MySQL admin panel, product catalog, favorites, quote cart, lead forms, and homepage slider management. The frontend is vanilla HTML/CSS/JS; images are served as WebP with responsive thumbnails and multi-URL fallbacks. SEO, sitemap, and Core Web Vitals optimizations (critical CSS, deferred stylesheets, CLS skeletons) are built in. Admin publishes catalog snapshots to JS/API for the static frontend.

**Stack:** HTML · CSS · JavaScript · PHP · MySQL · Node.js (build) · Sharp · Apache

---

*© Мебельная фабрика «Ск-классик» · [mebel-sk-classic.ru](https://mebel-sk-classic.ru)*
