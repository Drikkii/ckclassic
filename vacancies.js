(function () {
  "use strict";

  const container = document.querySelector("[data-vacancies-content]");
  if (!container) return;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderContent(text) {
    const value = String(text || "").trim();
    if (!value) {
      container.innerHTML =
        '<p class="page-stub__text">Сейчас открытых вакансий нет. Вы можете отправить резюме через форму на сайте или позвонить нам.</p>';
      return;
    }

    container.innerHTML = `<div class="page-stub__text page-vacancies__text">${escapeHtml(value).replace(/\n/g, "<br />")}</div>`;
  }

  async function loadVacancies() {
    try {
      const base = document.body.getAttribute("data-base") || "";
      const response = await fetch(`${base}api/vacancies.php`, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        if (typeof payload.content === "string") {
          renderContent(payload.content);
          return;
        }
      }
    } catch (error) {
      console.warn("[vacancies] API unavailable", error);
    }

    if (typeof window.VACANCIES_CONTENT === "string") {
      renderContent(window.VACANCIES_CONTENT);
      return;
    }

    renderContent("");
  }

  loadVacancies();
})();
