(function () {
  "use strict";

  const container = document.querySelector("[data-products-info-content]");
  if (!container) return;

  const pageKey = container.getAttribute("data-products-info-content") || "";
  if (!pageKey) return;

  const emptyMessages = {
    materials: "Раздел в разработке.",
    usage: "Раздел в разработке.",
    warranty: "Раздел в разработке.",
  };

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
      container.innerHTML = `<p class="page-stub__text">${escapeHtml(emptyMessages[pageKey] || "Раздел в разработке.")}</p>`;
      return;
    }

    container.innerHTML = `<div class="page-stub__text page-products-info__text">${escapeHtml(value).replace(/\n/g, "<br />")}</div>`;
  }

  async function loadContent() {
    try {
      const base = document.body.getAttribute("data-base") || "";
      const response = await fetch(`${base}api/products-info.php?page=${encodeURIComponent(pageKey)}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const payload = await response.json();
        if (typeof payload.content === "string") {
          renderContent(payload.content);
          return;
        }
      }
    } catch (error) {
      console.warn("[products-info] API unavailable", error);
    }

    const fallback = window.PRODUCTS_INFO?.[pageKey];
    if (typeof fallback === "string") {
      renderContent(fallback);
      return;
    }

    renderContent("");
  }

  loadContent();
})();
