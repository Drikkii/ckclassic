(function () {
  "use strict";

  if (window.CKShop) return;

  const FAVORITES_KEY = "ck_favorites";
  const CART_KEY = "ck_cart";

  const HEART_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path class="product-action__shape" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  const CART_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path class="product-action__shape" d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM7 7h15l-1.5 9h-11L5 3H2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const CATALOG_ORDER_NOTICE =
    "* Вся мебель изготавливается под заказ. Для уточнения деталей оставьте заявку.";

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

  function isProductNew(product) {
    const value = product?.isNew;
    return value === true || value === 1 || value === "1";
  }

  function getProducts() {
    if (!Array.isArray(window.CATALOG_PRODUCTS)) return [];
    return window.CATALOG_PRODUCTS.map((product) => normalizeProductMechanisms({ ...product }));
  }

  const MECHANISM_LABELS = {
    none: "Без механизма",
    puma: "Пума",
    spartak: "Спартак",
    rollout: "Выкатной",
    "high-rollout": "Высоковыкатной",
    gaslift: "Газлифт",
  };

  function formatMechanismLabel(mechanisms) {
    if (!Array.isArray(mechanisms) || !mechanisms.length) return "";
    return mechanisms
      .map((key) => MECHANISM_LABELS[key] || "")
      .filter(Boolean)
      .join(" / ");
  }

  function normalizeProductMechanisms(product) {
    if (!product || typeof product !== "object") return product;

    if (Array.isArray(product.mechanisms)) {
      product.mechanismLabel = formatMechanismLabel(product.mechanisms);
      delete product.hasMechanism;
      delete product.mechanismType;
      return product;
    }

    product.mechanisms = ["none"];
    product.mechanismLabel = MECHANISM_LABELS.none;
    delete product.hasMechanism;
    delete product.mechanismType;
    return product;
  }

  function renderMechanismMeta(product) {
    const label = product?.mechanismLabel;
    if (!label || label === "—") return "";
    return `<li><span>Механизм:</span> ${label}</li>`;
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

  function normalizeImageKey(src) {
    const relative = String(src || "").replace(/^\.\.\/\.\.\//, "");
    try {
      return decodeURIComponent(relative).replace(/\\/g, "/");
    } catch {
      return relative.replace(/\\/g, "/");
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function encodeImageSrc(src) {
    const value = String(src || "").trim();
    if (!value) return "";
    if (/%[0-9A-Fa-f]{2}/.test(value)) return value;
    return value.split("/").map(encodeURIComponent).join("/");
  }

  function collectCatalogImageCandidates(src) {
    const seen = new Set();
    const list = [];

    function add(raw) {
      const url = String(raw || "").trim();
      if (!url || seen.has(url)) return;
      seen.add(url);
      list.push(url);
    }

    const base = document.body.getAttribute("data-base") || "";
    const relativeRaw = String(src || "").replace(/^\.\.\/\.\.\//, "");
    const key = normalizeImageKey(src);
    const full = resolveImage(src);
    const thumbPath =
      window.CK_IMAGE_THUMBS?.[key] ||
      window.CK_IMAGE_THUMBS?.[relativeRaw];

    if (thumbPath) add(`${base}${thumbPath}`);
    add(full);

    try {
      const decodedRelative = decodeURIComponent(relativeRaw).replace(/\\/g, "/");
      if (decodedRelative !== relativeRaw) {
        add(`${base}${decodedRelative}`);
      }
    } catch {
      /* ignore malformed URI */
    }

    if (/\.webp$/i.test(full)) {
      add(full.replace(/\.webp$/i, ".jpg"));
      add(full.replace(/\.webp$/i, ".jpeg"));
      add(full.replace(/\.webp$/i, ".WEBP"));
    }

    return list;
  }

  window.__ckCatalogImgError = function (img) {
    if (!img) return;

    let candidates = [];
    try {
      candidates = JSON.parse(img.dataset.candidates || "[]");
    } catch {
      candidates = [];
    }

    const attempt = Number(img.dataset.attempt || "0") + 1;
    img.dataset.attempt = String(attempt);

    if (attempt < candidates.length) {
      img.src = encodeImageSrc(candidates[attempt]);
      return;
    }

    img.closest(".catalog-product__image")?.classList.add("catalog-product__image--empty");
  };

  function catalogCardImageSrc(src) {
    const candidates = collectCatalogImageCandidates(src);
    return {
      src: candidates[0] || "",
      fallback: candidates[1] || candidates[0] || "",
      candidates,
    };
  }

  function renderCatalogImageTag(src, alt, options) {
    const { candidates } = catalogCardImageSrc(src);
    const primary = candidates[0] || "";
    const candidatesAttr = escapeHtml(JSON.stringify(candidates));
    const attrs = options?.attrs || 'loading="lazy" decoding="async" width="480" height="360"';

    return `<img src="${encodeImageSrc(primary)}" alt="${alt}" ${attrs} data-candidates="${candidatesAttr}" data-attempt="0" onerror="window.__ckCatalogImgError&&window.__ckCatalogImgError(this)" />`;
  }

  function formatPrice(value) {
    return `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
  }

  function formatProductPrice(product) {
    return `от ${formatPrice(product?.basePrice ?? product?.price ?? 0)}`;
  }

  function getFabricById(id) {
    return (window.FABRICS || []).find((f) => f.id === id) || null;
  }

  function getDefaultFabric(product) {
    const base = Number(product.basePrice || product.price || 0);
    return {
      fabricId: "",
      fabricLabel: "",
      price: base,
    };
  }

  function getFavorites() {
    return readJson(FAVORITES_KEY, []);
  }

  function getCart() {
    return readJson(CART_KEY, []);
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

  function getScopeProductSkus() {
    return new Set(getProducts().map((p) => p.sku));
  }

  function syncWithCatalog() {
    if (!Array.isArray(window.CATALOG_PRODUCTS)) return false;

    const validSkus = getScopeProductSkus();
    let changed = false;

    const favorites = getFavorites();
    const nextFavorites = favorites.filter((sku) => validSkus.has(sku));
    if (nextFavorites.length !== favorites.length) {
      saveFavorites(nextFavorites);
      changed = true;
    }

    const cart = getCart();
    const nextCart = cart.filter((item) => validSkus.has(item.sku));
    if (nextCart.length !== cart.length) {
      saveCart(nextCart);
      changed = true;
    }

    return changed;
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

    const fabricId = options?.fabricId ?? "";
    const price = options?.price ?? (product.basePrice || product.price || 0);

    const cart = getCart();
    const existing = findCartItem(sku, fabricId);
    if (existing) return false;

    cart.push({
      sku,
      fabricId,
      fabricLabel: "",
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

    const fabricId = options?.fabricId ?? "";
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
    const cartActive = isInCart(sku) ? " is-active" : "";

    return `<div class="catalog-product__actions">
      <button type="button" class="product-action product-action--favorite${favActive}" data-favorite-btn data-sku="${sku}" aria-label="В избранное" aria-pressed="${isFavorite(sku)}">${HEART_ICON}</button>
      <button type="button" class="product-action product-action--cart${cartActive}" data-cart-btn data-sku="${sku}" aria-label="В корзину" aria-pressed="${isInCart(sku)}">${CART_ICON}</button>
    </div>`;
  }

  function renderProductActionsRow(sku, options) {
    const noticeClass = options?.noticeClass || "catalog-product__notice";
    const rowClass = options?.rowClass || "catalog-product__footer-row";
    return `<div class="${rowClass}">
      <p class="${noticeClass}">${CATALOG_ORDER_NOTICE}</p>
      ${renderActionsHtml(sku, options?.actions)}
    </div>`;
  }

  function renderProductCardHtml(p, options) {
    const product = p;
    const href = options?.href || productUrl(product.sku, options?.fromPagesRoot);
    const meta = options?.compact
      ? `<li><span>Артикул:</span> ${product.sku}</li><li><span>Коллекция:</span> ${product.collectionLabel}</li>`
      : `<li><span>Артикул:</span> ${product.sku}</li>
          <li><span>Коллекция:</span> ${product.collectionLabel}</li>
          <li><span>Габариты:</span> ${product.dims}</li>
          ${renderMechanismMeta(product)}`;

    return `<article class="catalog-product">
      <div class="catalog-product__image-wrap">
        <a class="catalog-product__image" href="${href}">
          ${renderCatalogImageTag(product.image, product.name)}
        </a>
      </div>
      <div class="catalog-product__body">
        <h3 class="catalog-product__title"><a href="${href}">${product.name}</a></h3>
        <ul class="catalog-product__meta">${meta}</ul>
        <div class="catalog-product__footer">
          <p class="catalog-product__price">${formatProductPrice(product)}</p>
          ${renderProductActionsRow(product.sku, options?.actions ? { actions: options.actions } : undefined)}
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
    const active = isInCart(sku);
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

    return {
      fabricId: "",
      fabricLabel: "",
      price: product.basePrice || product.price || 0,
    };
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
    isProductNew,
    resolveImage,
    catalogCardImageSrc,
    renderCatalogImageTag,
    formatPrice,
    formatProductPrice,
    formatMechanismLabel,
    normalizeProductMechanisms,
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
    renderProductActionsRow,
    CATALOG_ORDER_NOTICE,
    renderProductCardHtml,
    createProductCardElement,
    syncAllActions,
    updateBadges,
    syncWithCatalog,
  };

  syncWithCatalog();
  syncAllActions();
  window.setTimeout(() => {
    window.dispatchEvent(new Event("ck-shop-ready"));
  }, 0);
})();
