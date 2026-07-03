(function () {
  "use strict";

  function privacyNote(base) {
    const href = `${base}pages/privacy.html`;
    return `<p class="lead-form__note">Нажимая на кнопку, вы даёте согласие на обработку персональных данных и соглашаетесь с <a href="${href}">политикой конфиденциальности</a>.</p>`;
  }

  function renderHeader(base) {
    const b = base;
    const pages = `${b}pages/`;
    const catalog = `${pages}catalog/`;
    const blank = ' target="_blank" rel="noopener noreferrer"';

    return `<header class="header">
      <div class="head">
        <div class="head-logo">
          <a href="${b}index.html"><img class="logo" src="${b}img/logo/Logo-SVG.svg" alt="Ск-классик" /></a>
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
            <div class="head-messengers">
              <a href="https://wa.me/78888888888" target="_blank" rel="noopener"><img class="call-logo" src="${b}img/logo/whatsapp-svg.svg" alt="WhatsApp" /></a>
              <a href="https://t.me/Drikki" target="_blank" rel="noopener"><img class="call-logo" src="${b}img/logo/telegram-tg.svg" alt="Telegram" /></a>
              <a href="https://max.ru" target="_blank" rel="noopener"><img class="call-logo" src="${b}img/logo/max-messenger-white-on-black-icon.svg" alt="Max" /></a>
            </div>
          </div>
        </div>
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

  function renderConsultation(base) {
    return `<section class="consultation" id="buy">
      <div class="container consultation__inner">
        <div class="consultation__text">
          <h2>Нужна консультация?</h2>
          <p>Оставьте контакты — менеджер свяжется с вами, поможет с подбором модели, ткани и условиями доставки.</p>
        </div>
        <form class="consultation__form lead-form" action="#" method="post">
          <input type="text" name="name" placeholder="Ваше имя" autocomplete="name" required />
          <input type="tel" name="phone" placeholder="Ваш телефон" autocomplete="tel" required />
          <button type="submit">Перезвоните мне</button>
          ${privacyNote(base)}
        </form>
      </div>
    </section>`;
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
        <form class="callback-modal__form lead-form" action="#" method="post">
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
      <div class="container footer__grid">
        <div class="footer__col">
          <img class="footer__logo" src="${b}img/logo/Logo-SVG.svg" alt="Ск-классик" />
          <p class="footer__copy">© Фабрика «Ск-классик», 2026</p>
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
        </div>
      </div>
    </footer>`;
  }

  function mount(id, html) {
    const el = document.getElementById(id);
    if (el) el.outerHTML = html;
  }

  const base = document.body.getAttribute("data-base") || "";

  mount("site-header", renderHeader(base));
  mount("site-consultation", renderConsultation(base));
  mount("site-footer", renderFooter(base));

  const modalMount = document.createElement("div");
  modalMount.id = "site-callback-modal";
  document.body.appendChild(modalMount);
  mount("site-callback-modal", renderCallbackModal(base));

  const modalEl = document.getElementById("callback-modal");
  if (modalEl) document.body.appendChild(modalEl);
})();
