(function () {
  "use strict";

  const grid = document.querySelector("[data-catalog-grid]");
  if (!grid) return;

  const body = document.body;
  const countEl = document.querySelector("[data-catalog-count]");
  const sortSelect = document.querySelector("[data-catalog-sort]");
  const filterForm = document.querySelector("[data-catalog-filters-form]");
  const searchInput = document.querySelector("[data-catalog-search]");
  const priceRange = document.querySelector("[data-price-range]");
  const priceInput = document.querySelector("[data-price-input]");
  const priceMaxLabel = document.querySelector("[data-price-max]");
  const widthFromInput = document.querySelector("[data-width-from]");
  const widthToInput = document.querySelector("[data-width-to]");
  const resetBtn = document.querySelector("[data-filter-reset]");
  const filtersToggle = document.querySelector("[data-filters-toggle]");
  const filtersPanel = document.querySelector("[data-catalog-filters-panel]");
  const tagButtons = document.querySelectorAll("[data-catalog-tag]");

  const defaultCollections = (body.dataset.defaultCollections || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const focusGroup = body.dataset.catalogFocus || "";

  let catalogItems = Array.isArray(window.CATALOG_PRODUCTS) ? [...window.CATALOG_PRODUCTS] : [];
  let groupFilterActive = Boolean(focusGroup);
  let syncingFromUrl = false;

  const CATALOG_PRICE_CEILING = 500000;
  const CATALOG_PRICE_MIN = Number(priceRange?.min || priceInput?.min || 27000);

  let priceMax = Number(priceRange?.max || priceInput?.max || CATALOG_PRICE_CEILING);

  function formatPriceLabel(value) {
    return `${Number(value).toLocaleString("ru-RU")} ₽`;
  }

  function parsePriceValue(value) {
    const digits = String(value ?? "").replace(/\s/g, "").replace(/[^\d]/g, "");
    if (digits === "") return null;
    return Number(digits);
  }

  function formatPriceInputValue(value) {
    const num = Number(value);
    if (Number.isNaN(num)) return "";
    return num.toLocaleString("ru-RU");
  }

  function clampPrice(value) {
    const num = Number(value);
    if (Number.isNaN(num)) return priceMax;
    return Math.max(CATALOG_PRICE_MIN, Math.min(priceMax, Math.round(num)));
  }

  function getCurrentMaxPrice() {
    if (priceInput) {
      const parsed = parsePriceValue(priceInput.value);
      if (parsed !== null) return clampPrice(parsed);
    }
    if (priceRange?.value) {
      return clampPrice(priceRange.value);
    }
    return priceMax;
  }

  function setCurrentMaxPrice(value, options = {}) {
    const { syncPartner = true, updateLabel = true } = options;
    const clamped = clampPrice(value);

    if (priceRange) priceRange.value = String(clamped);
    if (syncPartner && priceInput) {
      priceInput.value = formatPriceInputValue(clamped);
    }
    if (updateLabel && priceMaxLabel) {
      priceMaxLabel.textContent = formatPriceLabel(clamped);
    }

    return clamped;
  }

  function setPriceLimit(nextMax) {
    const limit = Math.max(CATALOG_PRICE_CEILING, Math.ceil(nextMax));
    priceMax = limit;

    if (priceRange) {
      priceRange.max = String(limit);
      if (Number(priceRange.value) > limit) {
        priceRange.value = String(limit);
      }
    }

    if (priceInput) {
      priceInput.max = String(limit);
      if (Number(priceInput.value) > limit) {
        priceInput.value = String(limit);
      }
    }

    if (priceMaxLabel) {
      priceMaxLabel.textContent = formatPriceLabel(limit);
    }

    return limit;
  }

  function syncPriceRangeFromCatalog() {
    if (!catalogItems.length) return;

    const prices = catalogItems
      .map((p) => Number(p.price) || 0)
      .filter((price) => price > 0);
    if (!prices.length) return;

    const catalogMax = Math.max(...prices);
    const catalogMin = Math.floor(Math.min(...prices) / 1000) * 1000;
    const limit = setPriceLimit(Math.max(CATALOG_PRICE_CEILING, catalogMax));

    const minLabel = priceRange?.parentElement?.querySelector(
      ".catalog-filters__range-values span:first-child",
    );
    if (minLabel && catalogMin > 0) {
      minLabel.textContent = formatPriceLabel(catalogMin);
    }

    setCurrentMaxPrice(limit, { syncPartner: true, updateLabel: true });
    return limit;
  }

  function productUrl(sku) {
    return `product.html?sku=${encodeURIComponent(sku)}`;
  }

  function renderProductCard(p) {
    if (window.CKShop?.createProductCardElement) {
      return window.CKShop.createProductCardElement(p);
    }

    const article = document.createElement("article");
    const outOfStock =
      p.isOutOfStock === true || p.isOutOfStock === 1 || p.isOutOfStock === "1";
    article.className = `catalog-product${outOfStock ? " catalog-product--out-of-stock" : ""}`;
    const href = productUrl(p.sku);
    const priceText = outOfStock
      ? "Нет в наличии"
      : `${Number(p.price).toLocaleString("ru-RU")} ₽`;
    const priceClass = outOfStock ? " catalog-product__price--unavailable" : "";
    article.innerHTML = `
      <a class="catalog-product__image" href="${href}">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </a>
      <div class="catalog-product__body">
        <h3 class="catalog-product__title">
          <a href="${href}">${p.name}</a>
        </h3>
        <ul class="catalog-product__meta">
          <li><span>Артикул:</span> ${p.sku}</li>
          <li><span>Коллекция:</span> ${p.collectionLabel}</li>
          <li><span>Габариты:</span> ${p.dims}</li>
          ${p.hasMechanism ? `<li><span>Механизм:</span> ${p.mechanismLabel}</li>` : ""}
        </ul>
        <p class="catalog-product__price${priceClass}">${priceText}</p>
      </div>`;
    return article;
  }

  function getCheckedValues(name) {
    if (!filterForm) return [];
    return Array.from(filterForm.querySelectorAll(`input[name="${name}"]:checked`)).map(
      (input) => input.value,
    );
  }

  function getFilterState() {
    return {
      styles: getCheckedValues("style"),
      collections: getCheckedValues("collection"),
      mechanisms: getCheckedValues("mechanism"),
      mechanismTypes: getCheckedValues("mechanism_type"),
      maxPrice: getCurrentMaxPrice(),
      widthFrom: widthFromInput?.value ? Number(widthFromInput.value) : null,
      widthTo: widthToInput?.value ? Number(widthToInput.value) : null,
      q: (searchInput?.value || "").trim().toLowerCase(),
      sort: sortSelect?.value || "new",
    };
  }

  function matchesFilters(p, state) {
    const globalSearch = Boolean(state.q);

    const styleMatch = !state.styles.length || state.styles.includes(p.style);
    const collectionMatch =
      globalSearch || !state.collections.length || state.collections.includes(p.collection);
    const priceMatch = p.price <= state.maxPrice;
    const groupMatch =
      globalSearch || !groupFilterActive || !focusGroup || p.group === focusGroup;

    const mechFlags = state.mechanisms;
    let mechanismMatch = true;
    if (mechFlags.length) {
      const wantsYes = mechFlags.includes("yes");
      const wantsNo = mechFlags.includes("no");
      mechanismMatch =
        (wantsYes && p.hasMechanism) ||
        (wantsNo && !p.hasMechanism) ||
        (!wantsYes && !wantsNo);
    }

    const typeMatch =
      !state.mechanismTypes.length ||
      (p.mechanismType && state.mechanismTypes.includes(p.mechanismType));

    let widthMatch = true;
    if (state.widthFrom != null && !Number.isNaN(state.widthFrom)) {
      widthMatch = widthMatch && p.width >= state.widthFrom;
    }
    if (state.widthTo != null && !Number.isNaN(state.widthTo)) {
      widthMatch = widthMatch && p.width <= state.widthTo;
    }

    let searchMatch = true;
    if (state.q) {
      const hay = `${p.name} ${p.sku} ${p.collectionLabel || ""} ${p.description || ""}`.toLowerCase();
      searchMatch = hay.includes(state.q);
    }

    return (
      styleMatch &&
      collectionMatch &&
      priceMatch &&
      groupMatch &&
      mechanismMatch &&
      typeMatch &&
      widthMatch &&
      searchMatch
    );
  }

  function sortItems(items, sort) {
    const sorted = [...items];
    sorted.sort((a, b) => {
      switch (sort) {
        case "popular":
          return b.popularity - a.popularity;
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "new":
        default:
          return Number(b.isNew) - Number(a.isNew) || b.popularity - a.popularity;
      }
    });
    return sorted;
  }

  function getScopeItems() {
    if (defaultCollections.length) {
      return catalogItems.filter((p) => defaultCollections.includes(p.collection));
    }
    if (focusGroup) {
      return catalogItems.filter((p) => p.group === focusGroup);
    }
    return catalogItems;
  }

  function renderGrid(items) {
    grid.innerHTML = "";
    items.forEach((p) => grid.appendChild(renderProductCard(p)));
    window.CKShop?.syncAllActions?.();
  }

  function updateCount(visibleCount) {
    if (!countEl) return;
    const total = getScopeItems().length;
    countEl.textContent = `Показано: ${visibleCount} из ${total}`;
  }

  function stateToParams(state) {
    const params = new URLSearchParams();
    state.styles.forEach((v) => params.append("style", v));
    state.collections.forEach((v) => params.append("collection", v));
    state.mechanisms.forEach((v) => params.append("mechanism", v));
    state.mechanismTypes.forEach((v) => params.append("mechanism_type", v));
    if (state.widthFrom != null) params.set("width_from", String(state.widthFrom));
    if (state.widthTo != null) params.set("width_to", String(state.widthTo));
    if (state.maxPrice < priceMax) params.set("price_to", String(state.maxPrice));
    if (state.q) params.set("q", state.q);
    if (state.sort && state.sort !== "new") params.set("sort", state.sort);
    return params;
  }

  function applyStateToForm(state) {
    syncingFromUrl = true;

    filterForm?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = false;
    });

    state.styles.forEach((v) => {
      const input = filterForm?.querySelector(`input[name="style"][value="${v}"]`);
      if (input) input.checked = true;
    });
    state.collections.forEach((v) => {
      const input = filterForm?.querySelector(`input[name="collection"][value="${v}"]`);
      if (input) input.checked = true;
    });
    state.mechanisms.forEach((v) => {
      const input = filterForm?.querySelector(`input[name="mechanism"][value="${v}"]`);
      if (input) input.checked = true;
    });
    state.mechanismTypes.forEach((v) => {
      const input = filterForm?.querySelector(`input[name="mechanism_type"][value="${v}"]`);
      if (input) input.checked = true;
    });

    if (priceRange && state.maxPrice) {
      setCurrentMaxPrice(state.maxPrice, { syncPartner: true, updateLabel: true });
    } else if (priceInput && state.maxPrice) {
      setCurrentMaxPrice(state.maxPrice, { syncPartner: true, updateLabel: true });
    }
    if (widthFromInput) widthFromInput.value = state.widthFrom ?? "";
    if (widthToInput) widthToInput.value = state.widthTo ?? "";
    if (searchInput) searchInput.value = state.q || "";
    if (sortSelect) sortSelect.value = state.sort || "new";

    syncingFromUrl = false;
  }

  function readStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const readMulti = (key) => params.getAll(key);

    return {
      styles: readMulti("style"),
      collections: readMulti("collection"),
      mechanisms: readMulti("mechanism"),
      mechanismTypes: readMulti("mechanism_type"),
      maxPrice: params.has("price_to") ? Number(params.get("price_to")) : priceMax,
      widthFrom: params.has("width_from") ? Number(params.get("width_from")) : null,
      widthTo: params.has("width_to") ? Number(params.get("width_to")) : null,
      q: (params.get("q") || "").trim().toLowerCase(),
      sort: params.get("sort") || "new",
    };
  }

  function hasActiveUrlFilters(state) {
    return (
      state.styles.length ||
      state.collections.length ||
      state.mechanisms.length ||
      state.mechanismTypes.length ||
      state.widthFrom != null ||
      state.widthTo != null ||
      state.q ||
      (state.maxPrice && state.maxPrice < priceMax) ||
      (state.sort && state.sort !== "new")
    );
  }

  function updateUrl(state) {
    const params = stateToParams(state);
    const query = params.toString();
    const next = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      history.replaceState(null, "", next);
    }
  }

  function applyFilters() {
    let state = getFilterState();

    if (state.q) {
      groupFilterActive = false;
      filterForm?.querySelectorAll('input[name="collection"]').forEach((input) => {
        input.checked = false;
      });
      state = { ...state, collections: [] };
    } else if (
      state.collections.length ||
      state.styles.length ||
      state.mechanisms.length ||
      state.mechanismTypes.length ||
      state.widthFrom != null ||
      state.widthTo != null
    ) {
      groupFilterActive = false;
    }

    const filtered = sortItems(
      catalogItems.filter((p) => matchesFilters(p, state)),
      state.sort,
    );

    renderGrid(filtered);
    updateCount(filtered.length);

    if (!syncingFromUrl) updateUrl(state);
  }

  function setDefaultFilters() {
    if (!filterForm) return;

    filterForm.querySelectorAll("input[type=checkbox]").forEach((input) => {
      input.checked = false;
    });

    if (defaultCollections.length) {
      defaultCollections.forEach((value) => {
        const input = filterForm.querySelector(`input[name="collection"][value="${value}"]`);
        if (input) input.checked = true;
      });
      groupFilterActive = false;
    } else if (focusGroup) {
      groupFilterActive = true;
    }

    if (priceRange) {
      setCurrentMaxPrice(priceRange.max, { syncPartner: true, updateLabel: true });
    } else if (priceInput) {
      setCurrentMaxPrice(priceInput.max || priceMax, { syncPartner: true, updateLabel: true });
    }

    if (widthFromInput) widthFromInput.value = "";
    if (widthToInput) widthToInput.value = "";
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "new";
    tagButtons.forEach((tag) => tag.classList.remove("is-active"));
  }

  function resetFilters() {
    setDefaultFilters();
    applyFilters();
  }

  function applyTagFilter(tag) {
    setDefaultFilters();
    tagButtons.forEach((btn) => btn.classList.toggle("is-active", btn === tag));

    const style = tag.dataset.style;
    const collection = tag.dataset.collection;

    if (style && filterForm) {
      const input = filterForm.querySelector(`input[name="style"][value="${style}"]`);
      if (input) input.checked = true;
    }

    if (collection && filterForm) {
      const input = filterForm.querySelector(`input[name="collection"][value="${collection}"]`);
      if (input) input.checked = true;
    }

    groupFilterActive = false;
    applyFilters();
  }

  function initFromUrlOrDefaults() {
    const urlState = readStateFromUrl();
    if (hasActiveUrlFilters(urlState)) {
      groupFilterActive = false;
      applyStateToForm(urlState);
    } else {
      setDefaultFilters();
    }
    applyFilters();
  }

  if (priceRange) {
    priceRange.addEventListener("input", () => {
      setCurrentMaxPrice(priceRange.value, { syncPartner: true, updateLabel: true });
      applyFilters();
    });
  }

  priceInput?.addEventListener("input", () => {
    const parsed = parsePriceValue(priceInput.value);
    if (parsed === null) return;

    const clamped = clampPrice(parsed);
    if (priceRange) priceRange.value = String(clamped);
    if (priceMaxLabel) priceMaxLabel.textContent = formatPriceLabel(clamped);
    applyFilters();
  });

  priceInput?.addEventListener("change", () => {
    const parsed = parsePriceValue(priceInput.value);
    if (parsed === null) {
      setCurrentMaxPrice(priceMax, { syncPartner: true, updateLabel: true });
    } else {
      setCurrentMaxPrice(parsed, { syncPartner: true, updateLabel: true });
    }
    applyFilters();
  });

  filterForm?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", applyFilters);
  });

  widthFromInput?.addEventListener("change", applyFilters);
  widthToInput?.addEventListener("change", applyFilters);
  searchInput?.addEventListener("input", () => {
    if (!searchInput.value.trim() && defaultCollections.length) {
      defaultCollections.forEach((value) => {
        const input = filterForm?.querySelector(`input[name="collection"][value="${value}"]`);
        if (input) input.checked = true;
      });
      groupFilterActive = false;
    }
    applyFilters();
  });
  sortSelect?.addEventListener("change", applyFilters);

  filterForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters();
    filtersPanel?.classList.remove("is-open");
  });

  resetBtn?.addEventListener("click", resetFilters);
  tagButtons.forEach((tag) => tag.addEventListener("click", () => applyTagFilter(tag)));
  filtersToggle?.addEventListener("click", () => filtersPanel?.classList.toggle("is-open"));

  window.addEventListener("popstate", initFromUrlOrDefaults);

  document.querySelectorAll("[data-readmore]").forEach((block) => {
    const btn = block.querySelector("[data-readmore-btn]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isOpen = block.classList.toggle("is-open");
      btn.textContent = isOpen ? "Скрыть" : "Читать подробнее";
    });
  });

  if (priceMaxLabel && (priceRange || priceInput)) {
    priceMaxLabel.textContent = formatPriceLabel(getCurrentMaxPrice());
  }

  if (priceInput?.value) {
    const initialPrice = parsePriceValue(priceInput.value);
    if (initialPrice !== null) {
      priceInput.value = formatPriceInputValue(initialPrice);
    }
  }

  function whenShopReady(fn) {
    if (window.CKShop) {
      fn();
      return;
    }
    window.addEventListener("ck-shop-ready", fn, { once: true });
  }

  function startCatalog() {
    catalogItems = Array.isArray(window.CATALOG_PRODUCTS)
      ? window.CATALOG_PRODUCTS.map((item) => ({
          ...item,
          isOutOfStock:
            item.isOutOfStock === true || item.isOutOfStock === 1 || item.isOutOfStock === "1",
        }))
      : [];
    window.CKShop?.syncWithCatalog?.();
    syncPriceRangeFromCatalog();
    initFromUrlOrDefaults();
  }

  if (countEl) {
    countEl.textContent = "Показано: …";
  }

  whenShopReady(startCatalog);
})();
