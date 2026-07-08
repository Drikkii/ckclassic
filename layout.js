(function () {
  "use strict";

  function privacyNote(base) {
    const href = `${base}pages/privacy.html`;
    return `<p class="lead-form__note">Нажимая на кнопку, вы даёте согласие на обработку персональных данных и соглашаетесь с <a href="${href}">политикой конфиденциальности</a>.</p>`;
  }

  function renderShopLinks(b) {
    const pages = `${b}pages/`;
    const heartIcon = `<svg class="head-shop__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    const cartIcon = `<svg class="head-shop__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM7 7h15l-1.5 9h-11L5 3H2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    return `<div class="head-shop">
      <a href="${pages}favorites.html" class="head-shop__item">
        <span class="head-shop__text">Избранное <span class="head-shop__count" data-favorites-count>0</span></span>
        ${heartIcon}
      </a>
      <a href="${pages}cart.html" class="head-shop__item">
        <span class="head-shop__text">Корзина <span class="head-shop__count" data-cart-count>0</span></span>
        ${cartIcon}
      </a>
    </div>`;
  }

  function renderMessengers(b, className = "head-messengers") {
    return `<div class="${className}">
              <a href="https://wa.me/78888888888" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <img class="messenger-icon" src="${b}img/logo/messenger-whatsapp.svg" alt="" width="24" height="24" />
              </a>
              <a href="https://t.me/Drikki" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <img class="messenger-icon" src="${b}img/logo/messenger-telegram.svg" alt="" width="24" height="24" />
              </a>
              <a href="https://max.ru" target="_blank" rel="noopener noreferrer" aria-label="Max">
                <img class="messenger-icon" src="${b}img/logo/messenger-max.svg" alt="" width="24" height="24" />
              </a>
            </div>`;
  }

  function renderHeader(base) {
    const b = base;
    const pages = `${b}pages/`;
    const catalog = `${pages}catalog/`;
    const blank = ' target="_blank" rel="noopener noreferrer"';

    return `<header class="header">
      <div class="head">
        <div class="head-logo">
          <a href="${b}index.html"><img class="logo" src="${b}img/logo/logotipBig.png" alt="Ск-классик" /></a>
        </div>
        <div class="head-tagline">
          <p class="paragraf-tagline">Классическая мягкая мебель от производителя</p>
        </div>
        <div class="head-call">
          <div class="head-call-number">
            <a href="tel:+78888888888" class="phone">8 (888) 888-88-88</a>
          </div>
          <div class="head-callback">
            <a href="javascript:void(0)" class="callback js-callback-popup-btn">Заказать обратный звонок</a>
            ${renderMessengers(b)}
          </div>
        </div>
        ${renderShopLinks(b)}
        <button class="nav-burger" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Открыть меню">
          <span class="nav-burger__line" aria-hidden="true"></span>
          <span class="nav-burger__line" aria-hidden="true"></span>
          <span class="nav-burger__line" aria-hidden="true"></span>
        </button>
      </div>
      <nav class="head-menu" aria-label="Основное меню">
        <ul class="nav-menu-list">
          <li class="nav-menu-el">
            <a class="nav-menu-link" href="${b}index.html">Главная</a>
          </li>
          <li class="nav-menu-el nav-menu-el--dropdown">
            <button class="nav-menu-trigger" type="button" aria-expanded="false" aria-controls="nav-dropdown-factory">О фабрике</button>
            <ul class="nav-dropdown" id="nav-dropdown-factory" hidden>
              <li><a href="${pages}about/business.html">О бизнесе</a></li>
              <li><a href="${pages}about/history.html">История</a></li>
              <li><a href="${pages}about/vacancies.html">Вакансии</a></li>
              <li><a href="${pages}about/contacts.html">Контакты</a></li>
            </ul>
          </li>
          <li class="nav-menu-el nav-menu-el--dropdown">
            <button class="nav-menu-trigger" type="button" aria-expanded="false" aria-controls="nav-dropdown-products">О продукции и материалах</button>
            <ul class="nav-dropdown" id="nav-dropdown-products" hidden>
              <li><a href="${pages}products/materials.html">Используемые материалы и технологии</a></li>
              <li><a href="${pages}products/warranty.html">Гарантии</a></li>
              <li><a href="${pages}products/usage.html">Правила эксплуатации</a></li>
            </ul>
          </li>
          <li class="nav-menu-el nav-menu-el--dropdown">
            <button class="nav-menu-trigger nav-menu-trigger--wide" type="button" aria-expanded="false" aria-controls="nav-dropdown-catalog">Модельный ряд</button>
            <ul class="nav-dropdown nav-dropdown--catalog" id="nav-dropdown-catalog" hidden>
              <li><a href="${catalog}living.html">Ливинг</a></li>
              <li><a href="${catalog}hermes.html">Гермес</a></li>
              <li><a href="${catalog}dante.html">Данте</a></li>
              <li><a href="${catalog}shantal-milord.html">Шантал Милорд</a></li>
              <li><a href="${catalog}jamaica.html">Ямайка</a></li>
              <li><a href="${catalog}scarlett.html">Скарлет</a></li>
              <li><a href="${catalog}teseo.html">Тесео</a></li>
              <li><a href="${catalog}turin.html">Турин</a></li>
              <li><a href="${catalog}baxter.html">Бакстер</a></li>
              <li><a href="${catalog}dionis.html">Дионис</a></li>
              <li><a href="${catalog}custom.html">Проектные изделия</a></li>
              <li><a href="${catalog}beds.html">Кровати</a></li>
              <li><a href="${catalog}panels.html">Мягкие панели</a></li>
              <li><a href="${catalog}chairs.html">Стулья</a></li>
            </ul>
          </li>
          <li class="nav-menu-el">
            <a class="nav-menu-link" href="${pages}fabrics.html"${blank}>Ткани и декор</a>
          </li>
          <li class="nav-menu-el">
            <a class="nav-menu-link" href="${pages}where-to-buy.html"${blank}>Где купить</a>
          </li>
          <li class="nav-menu-el">
            <a class="nav-menu-link" href="${pages}works.html"${blank}>Наши работы / Отзывы</a>
          </li>
        </ul>
      </nav>
    </header>`;
  }

  function renderMobileNav(b, pages, catalog, blank) {
    return `<nav class="mobile-nav" id="mobile-nav" aria-label="Мобильное меню" hidden>
      <div class="mobile-nav__backdrop" data-mobile-nav-close tabindex="-1" aria-hidden="true"></div>
      <div class="mobile-nav__drawer">
        <div class="mobile-nav__top">
          <button class="mobile-nav__back" type="button" hidden aria-label="Назад">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M15.5 4.5 7.5 12l8 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Назад</span>
          </button>
          <p class="mobile-nav__heading">Меню</p>
          <button class="mobile-nav__close" type="button" data-mobile-nav-close aria-label="Закрыть">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="mobile-nav__panels">
          <ul class="mobile-nav__list" data-mobile-panel="root">
            <li><a class="mobile-nav__link" href="${b}index.html">Главная</a></li>
            <li><button class="mobile-nav__submenu" type="button" data-mobile-submenu="factory">О фабрике</button></li>
            <li><button class="mobile-nav__submenu" type="button" data-mobile-submenu="products">О продукции и материалах</button></li>
            <li><button class="mobile-nav__submenu" type="button" data-mobile-submenu="catalog">Модельный ряд</button></li>
            <li><a class="mobile-nav__link" href="${pages}fabrics.html"${blank}>Ткани и декор</a></li>
            <li><a class="mobile-nav__link" href="${pages}favorites.html">Избранное</a></li>
            <li><a class="mobile-nav__link" href="${pages}cart.html">Корзина</a></li>
            <li><a class="mobile-nav__link" href="${pages}where-to-buy.html"${blank}>Где купить</a></li>
            <li><a class="mobile-nav__link" href="${pages}works.html"${blank}>Наши работы / Отзывы</a></li>
          </ul>
          <ul class="mobile-nav__list" data-mobile-panel="factory" hidden>
            <li><a class="mobile-nav__link" href="${pages}about/business.html">О бизнесе</a></li>
            <li><a class="mobile-nav__link" href="${pages}about/history.html">История</a></li>
            <li><a class="mobile-nav__link" href="${pages}about/vacancies.html">Вакансии</a></li>
            <li><a class="mobile-nav__link" href="${pages}about/contacts.html">Контакты</a></li>
          </ul>
          <ul class="mobile-nav__list" data-mobile-panel="products" hidden>
            <li><a class="mobile-nav__link" href="${pages}products/materials.html">Используемые материалы и технологии</a></li>
            <li><a class="mobile-nav__link" href="${pages}products/warranty.html">Гарантии</a></li>
            <li><a class="mobile-nav__link" href="${pages}products/usage.html">Правила эксплуатации</a></li>
          </ul>
          <ul class="mobile-nav__list mobile-nav__list--catalog" data-mobile-panel="catalog" hidden>
            <li><a class="mobile-nav__link" href="${catalog}living.html">Ливинг</a></li>
            <li><a class="mobile-nav__link" href="${catalog}hermes.html">Гермес</a></li>
            <li><a class="mobile-nav__link" href="${catalog}dante.html">Данте</a></li>
            <li><a class="mobile-nav__link" href="${catalog}shantal-milord.html">Шантал Милорд</a></li>
            <li><a class="mobile-nav__link" href="${catalog}jamaica.html">Ямайка</a></li>
            <li><a class="mobile-nav__link" href="${catalog}scarlett.html">Скарлет</a></li>
            <li><a class="mobile-nav__link" href="${catalog}teseo.html">Тесео</a></li>
            <li><a class="mobile-nav__link" href="${catalog}turin.html">Турин</a></li>
            <li><a class="mobile-nav__link" href="${catalog}baxter.html">Бакстер</a></li>
            <li><a class="mobile-nav__link" href="${catalog}dionis.html">Дионис</a></li>
            <li><a class="mobile-nav__link" href="${catalog}custom.html">Проектные изделия</a></li>
            <li><a class="mobile-nav__link" href="${catalog}beds.html">Кровати</a></li>
            <li><a class="mobile-nav__link" href="${catalog}panels.html">Мягкие панели</a></li>
            <li><a class="mobile-nav__link" href="${catalog}chairs.html">Стулья</a></li>
          </ul>
        </div>
      </div>
    </nav>`;
  }

  function renderConsultation(base) {
    return `<section class="consultation" id="buy">
      <div class="container consultation__inner">
        <div class="consultation__text">
          <h2>Нужна консультация?</h2>
          <p>Оставьте контакты — менеджер свяжется с вами, поможет с подбором модели, ткани и условиями доставки.</p>
        </div>
        <form class="consultation__form lead-form" data-lead-form="consultation" action="#" method="post">
          <input type="text" name="name" placeholder="Ваше имя" autocomplete="name" required />
          <input type="tel" name="phone" placeholder="Ваш телефон" autocomplete="tel" required />
          <button type="submit">Перезвоните мне</button>
          ${privacyNote(base)}
        </form>
      </div>
    </section>`;
  }

  function renderThanksModal() {
    return `<div class="callback-modal lead-thanks-modal" id="lead-thanks-modal" hidden>
      <div class="callback-modal__overlay" data-lead-thanks-close tabindex="-1" aria-hidden="true"></div>
      <div class="callback-modal__dialog lead-thanks-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="lead-thanks-title">
        <button class="callback-modal__close" type="button" data-lead-thanks-close aria-label="Закрыть">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <h2 class="callback-modal__title" id="lead-thanks-title">Спасибо!</h2>
        <p class="callback-modal__text" data-lead-thanks-text>Менеджер скоро свяжется с вами и ответит на все вопросы.</p>
        <button type="button" class="lead-thanks-modal__btn" data-lead-thanks-close>Закрыть</button>
      </div>
    </div>`;
  }

  function renderCallbackModal(base) {
    return `<div class="callback-modal" id="callback-modal" hidden>
      <div class="callback-modal__overlay" data-callback-close tabindex="-1" aria-hidden="true"></div>
      <div class="callback-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="callback-modal-title">
        <button class="callback-modal__close" type="button" data-callback-close aria-label="Закрыть">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <h2 class="callback-modal__title" id="callback-modal-title">Обратный звонок</h2>
        <p class="callback-modal__text">Оставьте имя и номер телефона — наш менеджер свяжется с вами и ответит на все вопросы.</p>
        <form class="callback-modal__form lead-form" data-lead-form="callback" action="#" method="post">
          <input type="text" name="name" placeholder="Ваше имя" autocomplete="name" required />
          <input type="tel" name="phone" placeholder="Ваш телефон" autocomplete="tel" required />
          <button type="submit">Заказать звонок</button>
          ${privacyNote(base)}
        </form>
      </div>
    </div>`;
  }

  function renderFooter(base) {
    const b = base;
    const pages = `${b}pages/`;

    return `<footer class="footer">
      <div class="container">
        <div class="footer__grid">
        <div class="footer__col">
          <img class="footer__logo" src="${b}img/logo/logotipBig.png" alt="Ск-классик" />
        </div>
        <div class="footer__col">
          <h4>Каталог</h4>
          <ul>
            <li><a href="${b}index.html#rooms">По комнатам</a></li>
            <li><a href="${pages}catalog/chairs.html">Стулья</a></li>
            <li><a href="${pages}fabrics.html">Ткани и декор</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h4>Информация</h4>
          <ul>
            <li><a href="${b}index.html#about">О фабрике</a></li>
            <li><a href="${pages}works.html">Наши работы</a></li>
            <li><a href="${pages}where-to-buy.html">Где купить</a></li>
            <li><a href="${pages}privacy.html">Политика конфиденциальности</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h4>Контакты</h4>
          <a href="tel:+78888888888">8 (888) 888-88-88</a>
          <a href="javascript:void(0)" class="js-callback-popup-btn">Обратный звонок</a>
          ${renderMessengers(b, "footer__messengers")}
        </div>
        </div>
        <div class="footer__bar">
          <p class="footer__copy">© Фабрика «Ск-классик» 2026</p>
          <p class="footer__credit">
            Made by <a href="https://github.com/drikkii" target="_blank" rel="noopener noreferrer">Drikki</a>
          </p>
        </div>
      </div>
    </footer>`;
  }

  function mount(id, html) {
    const el = document.getElementById(id);
    if (el) el.outerHTML = html;
  }

  const base = document.body.getAttribute("data-base") || "";
  const pages = `${base}pages/`;
  const catalog = `${pages}catalog/`;
  const blank = ' target="_blank" rel="noopener noreferrer"';

  mount("site-header", renderHeader(base));
  mount("site-consultation", renderConsultation(base));
  mount("site-footer", renderFooter(base));

  document.body.insertAdjacentHTML(
    "beforeend",
    renderMobileNav(base, pages, catalog, blank),
  );

  const modalMount = document.createElement("div");
  modalMount.id = "site-callback-modal";
  document.body.appendChild(modalMount);
  mount("site-callback-modal", renderCallbackModal(base));

  const thanksMount = document.createElement("div");
  thanksMount.id = "site-thanks-modal";
  document.body.appendChild(thanksMount);
  mount("site-thanks-modal", renderThanksModal());

  const modalEl = document.getElementById("callback-modal");
  if (modalEl) document.body.appendChild(modalEl);

  const thanksEl = document.getElementById("lead-thanks-modal");
  if (thanksEl) document.body.appendChild(thanksEl);

  const basePath = document.body.getAttribute("data-base") || "";
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${basePath}${src}`;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

  loadScript("shop.js")
    .then(() => loadScript("forms-config.js"))
    .then(() => loadScript("forms.js"))
    .catch(() => {
      console.warn("[CK] Не удалось загрузить shop.js или forms");
    });
})();
