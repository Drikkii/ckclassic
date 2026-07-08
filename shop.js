(function () {
  "use strict";

  const FAVORITES_KEY = "ck_favorites";
  const CART_KEY = "ck_cart";

  const HEART_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path class="product-action__shape" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  const CART_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path class="product-action__shape" d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM7 7h15l-1.5 9h-11L5 3H2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getProducts() {
    return Array.isArray(window.CATALOG_PRODUCTS) ? window.CATALOG_PRODUCTS : [];
  }

  function getProduct(sku) {
    return getProducts().find((p) => p.sku === sku) || null;
  }

  function resolveImage(src) {
    if (!src) return "";
    const base = document.body.getAttribute("data-base") || "";
    const relative = src.replace(/^\.\.\/\.\.\//, "");
    return `${base}${relative}`;
  }

  function formatPrice(value) {
    return `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
  }

  function getFabricById(id) {
    return (window.FABRICS || []).find((f) => f.id === id) || null;
  }

  function getDefaultFabric(product) {
    const fabricId = product.fabrics?.[0] || "standard";
    const fabric = getFabricById(fabricId);
    return {
      fabricId,
      fabricLabel: fabric?.name || fabricId,
      price: (product.basePrice || product.price || 0) + (fabric?.delta || 0),
    };
  }

  function getFavorites() {
    return readJson(FAVORITES_KEY, []);
  }

  function saveFavorites(list) {
    writeJson(FAVORITES_KEY, list);
  }

  function isFavorite(sku) {
    return getFavorites().includes(sku);
  }

  function toggleFavorite(sku) {
    const list = getFavorites();
    const index = list.indexOf(sku);
    if (index >= 0) list.splice(index, 1);
    else list.push(sku);
    saveFavorites(list);
    syncAllActions();
    return index < 0;
  }

  function getCart() {
    return readJson(CART_KEY, []);
  }

  function saveCart(list) {
    writeJson(CART_KEY, list);
  }

  function cartItemKey(item) {
    return `${item.sku}::${item.fabricId}`;
  }

  function findCartItem(sku, fabricId) {
    return getCart().find((item) => item.sku === sku && item.fabricId === fabricId);
  }

  function isInCart(sku, fabricId) {
    if (fabricId) return Boolean(findCartItem(sku, fabricId));
    return getCart().some((item) => item.sku === sku);
  }

  function addToCart(sku, options) {
    const product = getProduct(sku);
    if (!product) return false;

    const fabricId = options?.fabricId || product.fabrics?.[0] || "standard";
    const fabric = getFabricById(fabricId);
    const price =
      options?.price ??
      (product.basePrice || product.price || 0) + (fabric?.delta || 0);

    const cart = getCart();
    const existing = findCartItem(sku, fabricId);
    if (existing) return false;

    cart.push({
      sku,
      fabricId,
      fabricLabel: options?.fabricLabel || fabric?.name || fabricId,
      price,
      qty: 1,
      addedAt: Date.now(),
    });
    saveCart(cart);
    syncAllActions();
    return true;
  }

  function removeFromCart(sku, fabricId) {
    const cart = getCart().filter(
      (item) => !(item.sku === sku && item.fabricId === fabricId),
    );
    saveCart(cart);
    syncAllActions();
  }

  function toggleCart(sku, options) {
    const product = getProduct(sku);
    if (!product) return false;

    const fabricId = options?.fabricId || product.fabrics?.[0] || "standard";
    if (findCartItem(sku, fabricId)) {
      removeFromCart(sku, fabricId);
      return false;
    }
    addToCart(sku, options);
    return true;
  }

  function updateCartQty(sku, fabricId, qty) {
    const cart = getCart();
    const item = cart.find((i) => i.sku === sku && i.fabricId === fabricId);
    if (!item) return;
    item.qty = Math.max(1, Math.min(99, qty));
    saveCart(cart);
    syncAllActions();
  }

  function clearCart() {
    saveCart([]);
    syncAllActions();
  }

  function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function productUrl(sku, fromPagesRoot) {
    const base = document.body.getAttribute("data-base") || "";
    if (fromPagesRoot) {
      return `${base}pages/catalog/product.html?sku=${encodeURIComponent(sku)}`;
    }
    return `product.html?sku=${encodeURIComponent(sku)}`;
  }

  function renderActionsHtml(sku, options) {
    const favActive = isFavorite(sku) ? " is-active" : "";
    const cartActive = isInCart(sku, options?.fabricId) ? " is-active" : "";
    const fabricAttr = options?.fabricId
      ? ` data-fabric-id="${options.fabricId}"`
      : "";

    return `<div class="catalog-product__actions">
      <button type="button" class="product-action product-action--favorite${favActive}" data-favorite-btn data-sku="${sku}" aria-label="В избранное" aria-pressed="${isFavorite(sku)}">${HEART_ICON}</button>
      <button type="button" class="product-action product-action--cart${cartActive}" data-cart-btn data-sku="${sku}"${fabricAttr} aria-label="В корзину" aria-pressed="${isInCart(sku, options?.fabricId)}">${CART_ICON}</button>
    </div>`;
  }

  function renderProductCardHtml(p, options) {
    const href = options?.href || productUrl(p.sku, options?.fromPagesRoot);
    const image = resolveImage(p.image);
    const meta = options?.compact
      ? `<li><span>Артикул:</span> ${p.sku}</li><li><span>Коллекция:</span> ${p.collectionLabel}</li>`
      : `<li><span>Артикул:</span> ${p.sku}</li>
          <li><span>Коллекция:</span> ${p.collectionLabel}</li>
          <li><span>Габариты:</span> ${p.dims}</li>
          ${p.hasMechanism ? `<li><span>Механизм:</span> ${p.mechanismLabel}</li>` : ""}`;

    return `<article class="catalog-product">
      <div class="catalog-product__image-wrap">
        <a class="catalog-product__image" href="${href}">
          <img src="${image}" alt="${p.name}" loading="lazy" />
        </a>
      </div>
      <div class="catalog-product__body">
        <h3 class="catalog-product__title"><a href="${href}">${p.name}</a></h3>
        <ul class="catalog-product__meta">${meta}</ul>
        <div class="catalog-product__footer">
          <p class="catalog-product__price">${formatPrice(p.basePrice || p.price)}</p>
          ${renderActionsHtml(p.sku, options?.actions)}
        </div>
      </div>
    </article>`;
  }

  function createProductCardElement(p, options) {
    const wrap = document.createElement("div");
    wrap.innerHTML = renderProductCardHtml(p, options);
    return wrap.firstElementChild;
  }

  function syncFavoriteBtn(btn) {
    const sku = btn.dataset.sku;
    const active = isFavorite(sku);
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  }

  function syncCartBtn(btn) {
    const sku = btn.dataset.sku;
    const fabricId = btn.dataset.fabricId || getProduct(sku)?.fabrics?.[0] || "standard";
    const active = isInCart(sku, fabricId);
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  }

  function updateBadges() {
    const favCount = getFavorites().length;
    const cartCount = getCart().reduce((sum, item) => sum + item.qty, 0);

    document.querySelectorAll("[data-favorites-count]").forEach((el) => {
      el.textContent = String(favCount);
    });

    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(cartCount);
    });
  }

  function syncAllActions() {
    document.querySelectorAll("[data-favorite-btn]").forEach(syncFavoriteBtn);
    document.querySelectorAll("[data-cart-btn]").forEach(syncCartBtn);
    updateBadges();
    window.dispatchEvent(new CustomEvent("ck-shop-change"));
  }

  function getCartOptionsFromBtn(btn) {
    const sku = btn.dataset.sku;
    const product = getProduct(sku);
    if (!product) return null;

    if (btn.dataset.fabricId) {
      const fabric = getFabricById(btn.dataset.fabricId);
      return {
        fabricId: btn.dataset.fabricId,
        fabricLabel: fabric?.name || btn.dataset.fabricId,
        price:
          (product.basePrice || product.price || 0) + (fabric?.delta || 0),
      };
    }

    return getDefaultFabric(product);
  }

  document.addEventListener("click", (event) => {
    const favBtn = event.target.closest("[data-favorite-btn]");
    if (favBtn) {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(favBtn.dataset.sku);
      return;
    }

    const cartBtn = event.target.closest("[data-cart-btn]");
    if (cartBtn) {
      event.preventDefault();
      event.stopPropagation();
      const options = getCartOptionsFromBtn(cartBtn);
      if (options) toggleCart(cartBtn.dataset.sku, options);
    }
  });

  window.CKShop = {
    getProduct,
    getProducts,
    resolveImage,
    formatPrice,
    getFavorites,
    getCart,
    isFavorite,
    isInCart,
    toggleFavorite,
    toggleCart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    getCartTotal,
    getDefaultFabric,
    productUrl,
    renderActionsHtml,
    renderProductCardHtml,
    createProductCardElement,
    syncAllActions,
    updateBadges,
  };

  syncAllActions();
  window.dispatchEvent(new Event("ck-shop-ready"));
})();
