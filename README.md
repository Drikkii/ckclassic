# Ск-классик — сайт мебельной фабрики

**Сайт:** [mebel-sk-classic.ru](https://mebel-sk-classic.ru)

Корпоративный сайт мебельной фабрики «Ск-классик» (Пушкино): каталог коллекций, карточки товаров, заявки с форм, админ-панель для управления каталогом и слайдером на главной.

> Репозиторий — исходный код проекта. PHP-часть (админка, API, формы) работает на хостинге с MySQL; на GitHub Pages доступен только статический просмотр HTML/CSS/JS.

---

## Русский

### О проекте

Разработка и доработка полноценного сайта под ключ: от вёрстки и каталога до бэкенда, SEO и подготовки к индексации в Google и Яндексе.

### Что сделано

- **Каталог** — коллекции мебели, карточки товаров с галереей, поиск, избранное, корзина заявок
- **Админ-панель (PHP + MySQL)** — добавление и редактирование товаров, управление слайдером на главной, экспорт данных для фронтенда
- **Формы заявок** — отправка на почту через PHP API, защита от спама (rate limit), цель в Яндекс.Метрике
- **SEO** — мета-теги на всех страницах, `robots.txt`, `sitemap.xml`, страница 404, верификация Google Search Console и Яндекс.Вебмастер
- **Производительность** — отложенная загрузка скриптов, кэш API каталога и слайдера, разделение JS по страницам
- **Мобильная вёрстка** — адаптация сайта и админки от 350 px
- **Безопасность** — принудительный HTTPS, CSRF в админке, ограничение попыток входа, секреты вынесены в `config.php` (не в репозитории)

### Стек

HTML · CSS · JavaScript · PHP · MySQL · Apache (`.htaccess`)


---

## English

### About

End-to-end website for **SK-Classic**, a furniture factory in Pushkino, Russia: product catalog, lead forms, and an admin panel for catalog and homepage slider management.

### Highlights

- **Product catalog** — collections, product pages with galleries, search, favorites, quote cart
- **Admin panel (PHP + MySQL)** — CRUD for products, homepage slider editor, data export to the frontend
- **Lead forms** — PHP mail API with rate limiting; Yandex Metrika conversion goal
- **SEO** — meta tags on all pages, `robots.txt`, `sitemap.xml`, custom 404, Google Search Console & Yandex Webmaster verification
- **Performance** — deferred scripts, API caching for catalog and slider, page-specific JS bundles
- **Responsive design** — site and admin UI down to 350 px viewport width
- **Security** — forced HTTPS, CSRF protection, login rate limiting; secrets kept in `config.php` (gitignored)

### Stack

HTML · CSS · JavaScript · PHP · MySQL · Apache (`.htaccess`)


## Структура / Structure

```
├── index.html, pages/     # Публичные страницы / Public pages
├── api/                   # Каталог, слайдер, заявки / Catalog, slider, leads
├── admin/                 # Админ-панель / Admin panel
├── scripts/               # SEO и сборка / SEO tooling
├── sql/schema.sql         # Схема БД / Database schema
└── site-config.js         # Контакты и настройки сайта / Site config
```

