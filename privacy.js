(function () {
  "use strict";

  const container = document.querySelector("[data-privacy-content]");
  if (!container) return;

  function renderContent(html) {
    const value = String(html || "").trim();
    if (!value) {
      container.innerHTML = "<p>Текст политики конфиденциальности временно недоступен.</p>";
      return;
    }

    container.innerHTML = value;
  }

  async function loadPrivacy() {
    try {
      const base = document.body.getAttribute("data-base") || "";
      const response = await fetch(`${base}api/privacy.php`, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        if (typeof payload.content === "string") {
          renderContent(payload.content);
          return;
        }
      }
    } catch (error) {
      console.warn("[privacy] API unavailable", error);
    }

    if (typeof window.PRIVACY_CONTENT === "string") {
      renderContent(window.PRIVACY_CONTENT);
      return;
    }

    renderContent("");
  }

  loadPrivacy();
})();
