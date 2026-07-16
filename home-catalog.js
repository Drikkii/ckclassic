(function () {
  "use strict";

  const newGrid = document.querySelector("[data-home-new-grid]");
  if (!newGrid) return;

  function whenShopReady(fn) {
    if (window.CKShop && Array.isArray(window.CATALOG_PRODUCTS)) {
      fn();
      return;
    }
    window.addEventListener("ck-shop-ready", fn, { once: true });
  }

  function pickRandom(items, count) {
    const pool = [...items];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  function normalizeProduct(product) {
    if (window.CKShop?.normalizeProductMechanisms) {
      return window.CKShop.normalizeProductMechanisms({ ...product });
    }
    return { ...product };
  }

  function afterFirstPaint(fn) {
    const run = () => requestAnimationFrame(() => requestAnimationFrame(fn));
    if (document.readyState === "complete") {
      run();
      return;
    }
    window.addEventListener("load", run, { once: true });
  }

  function renderNewProducts() {
    if (!window.CKShop?.createProductCardElement) return;

    const isNew = window.CKShop.isProductNew || ((item) => Boolean(item?.isNew));
    const items = pickRandom(
      (window.CATALOG_PRODUCTS || []).filter((item) => isNew(item)),
      3,
    );

    newGrid.innerHTML = "";
    items.forEach((product) => {
      newGrid.appendChild(
        window.CKShop.createProductCardElement(normalizeProduct(product), {
          fromPagesRoot: true,
          href: `pages/catalog/product.html?sku=${encodeURIComponent(product.sku)}`,
        }),
      );
    });
    window.CKShop.syncAllActions?.();
  }

  whenShopReady(() => afterFirstPaint(renderNewProducts));
})();
