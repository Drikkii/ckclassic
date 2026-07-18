/**
 * Контакты фабрики и приём заявок с сайта.
 *
 * email — куда приходят заявки.
 * mailFrom — с какого адреса отправляется (ящик на домене сайта в Beget).
 * mailFromName — имя отправителя в списке писем («Ск-классик»).
 * siteUrl — адрес сайта (для favicon/иконки в почте).
 * yandexMetrikaId — номер счётчика Яндекс.Метрики (metrika.yandex.ru).
 *
 * Иконка письма в Mail.ru/Gmail берётся с домена отправителя (favicon.ico в корне сайта),
 * а не из картинки внутри письма.
 */
window.CK_SITE_CONFIG = {
  phoneDisplay: "+7 (964) 510-67-47",
  phoneTel: "+79645106747",
  phone2Display: "+7 (964) 525-44-58",
  phone2Tel: "+79645254458",
  phoneWa: "79645254458",
  email: "sk-classic@mail.ru",
  mailFrom: "noreply@mebel-sk-classic.ru",
  mailFromName: "Ск-классик",
  siteUrl: "https://mebel-sk-classic.ru",
  yandexMetrikaId: "110539365",
};

window.CK_FORMS_CONFIG = {
  email: window.CK_SITE_CONFIG.email,
};

window.CK_SITE_CONFIG.phonesLine = [
  window.CK_SITE_CONFIG.phoneDisplay,
  window.CK_SITE_CONFIG.phone2Display,
].join(", ");
