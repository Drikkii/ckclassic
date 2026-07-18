(function () {
  "use strict";

  const container = document.querySelector("[data-where-to-buy-content]");
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
      container.innerHTML = '<p class="page-stub__text">Раздел в разработке.</p>';
      return;
    }

    container.innerHTML = `<div class="page-stub__text page-where-to-buy__text">${escapeHtml(value).replace(/\n/g, "<br />")}</div>`;
  }

  async function loadContent() {
    try {
      const base = document.body.getAttribute("data-base") || "";
      const response = await fetch(`${base}api/where-to-buy.php`, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        if (typeof payload.content === "string") {
          renderContent(payload.content);
          return;
        }
      }
    } catch (error) {
      console.warn("[where-to-buy] API unavailable", error);
    }

    if (typeof window.WHERE_TO_BUY_CONTENT === "string") {
      renderContent(window.WHERE_TO_BUY_CONTENT);
      return;
    }

    renderContent("");
  }

  loadContent();
})();
