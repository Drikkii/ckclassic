(function () {
  "use strict";

  function getMetrikaId() {
    const fromConfig = Number(window.CK_SITE_CONFIG?.yandexMetrikaId || 0);
    return fromConfig || 110539365;
  }

  function boot() {
    const id = getMetrikaId();
    if (!id) return;

    (function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          (m[i].a = m[i].a || []).push(arguments);
        };
      m[i].l = 1 * new Date();
      for (let j = 0; j < document.scripts.length; j += 1) {
        if (document.scripts[j].src === r) return;
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", `https://mc.yandex.ru/metrika/tag.js?id=${id}`, "ym");

    window.ym(id, "init", {
      defer: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });
  }

  if ("requestIdleCallback" in window) {
    requestIdleCallback(boot, { timeout: 3500 });
  } else {
    window.addEventListener("load", boot, { once: true });
  }
})();
