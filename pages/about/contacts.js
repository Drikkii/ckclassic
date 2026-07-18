(function () {
  "use strict";

  function renderMessengers(waDigits, tel, base) {
    const icon = (name) =>
      `<img src="${base}img/logo/messenger-${name}.svg" alt="" width="24" height="24" />`;

    return `<div class="contacts-social__links">
      <a href="https://wa.me/${waDigits}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">${icon("whatsapp")}</a>
      <a href="tel:${tel}" aria-label="Max, позвонить на этот номер">${icon("max")}</a>
    </div>`;
  }

  function run() {
    const phonesRoot = document.getElementById("contacts-phones-list");
    const messengersRoot = document.getElementById("contacts-messengers");
    if (!phonesRoot) return;

    const cfg = window.CK_SITE_CONFIG || {};
    const base = document.body.getAttribute("data-base") || "";
    const phones = [
      { tel: cfg.phoneTel, display: cfg.phoneDisplay },
      { tel: cfg.phone2Tel, display: cfg.phone2Display },
    ].filter((phone) => phone.tel && phone.display);

    const phoneLinks = phones
      .map((phone) => `<a href="tel:${phone.tel}">${phone.display}</a>`)
      .join("");

    phonesRoot.innerHTML = `<div class="site-phones contacts-phones">${phoneLinks}</div><a href="javascript:void(0)" class="contacts-row__link js-callback-popup-btn">Обратный звонок</a>`;

    if (messengersRoot && cfg.phoneWa) {
      const waTel = cfg.phone2Tel || cfg.phoneTel;
      messengersRoot.innerHTML = renderMessengers(cfg.phoneWa, waTel, base);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
