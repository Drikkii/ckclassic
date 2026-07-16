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
  let presetProductTypes = [];

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

  function normalizeCatalogProduct(product) {
    const item = { ...product };
    if (Array.isArray(item.mechanisms)) {
      if (!item.mechanismLabel) {
        item.mechanismLabel = window.CKShop?.formatMechanismLabel?.(item.mechanisms) || "";
      }
      return item;
    }
    item.mechanisms = ["none"];
    item.mechanismLabel = "Без механизма";
    return item;
  }

  function renderMechanismLine(product) {
    const label = product?.mechanismLabel;
    if (!label || label === "—") return "";
    return `<li><span>Механизм:</span> ${label}</li>`;
  }

  function renderProductCard(p) {
    if (window.CKShop?.createProductCardElement) {
      return window.CKShop.createProductCardElement(p);
    }

    const article = document.createElement("article");
    article.className = "catalog-product";
    const href = productUrl(p.sku);
    const priceText = `от ${Number(p.price).toLocaleString("ru-RU")} ₽`;
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
          ${renderMechanismLine(p)}
        </ul>
        <p class="catalog-product__price">${priceText}</p>
      </div>`;
    return article;
  }

  function isShowAllCatalog() {
    const input = filterForm?.querySelector("[data-filter-all]");
    return Boolean(input?.checked);
  }

  function isNewOnlyFilter() {
    const input = filterForm?.querySelector("[data-filter-new]");
    return Boolean(input?.checked);
  }

  function isProductNew(product) {
    if (window.CKShop?.isProductNew) {
      return window.CKShop.isProductNew(product);
    }
    const value = product?.isNew;
    return value === true || value === 1 || value === "1";
  }

  function expandProductTypes(types) {
    const result = [];
    types.forEach((type) => {
      if (type === "corner") {
        result.push("corner-classic", "corner-ottoman");
      } else {
        result.push(type);
      }
    });
    return [...new Set(result)];
  }

  function normalizeProductTypesForUrl(types) {
    const set = new Set(types);
    const params = [];
    if (set.has("corner-classic") && set.has("corner-ottoman")) {
      params.push("corner");
      set.delete("corner-classic");
      set.delete("corner-ottoman");
    }
    set.forEach((type) => params.push(type));
    return params;
  }

  function matchesProductType(product, productTypes) {
    if (!productTypes.length) return true;
    return productTypes.includes(product.type);
  }

  function clearCategoryFilters() {
    if (!filterForm) return;
    filterForm
      .querySelectorAll('input[name="style"], input[name="collection"], input[name="mechanism_type"]')
      .forEach((input) => {
        input.checked = false;
      });
  }

  function getCheckedValues(name) {
    if (!filterForm) return [];
    return Array.from(filterForm.querySelectorAll(`input[name="${name}"]:checked`)).map(
      (input) => input.value,
    );
  }

  function getFilterState() {
    return {
      showAll: isShowAllCatalog(),
      newOnly: isNewOnlyFilter(),
      productTypes: [...presetProductTypes],
      styles: getCheckedValues("style"),
      collections: getCheckedValues("collection"),
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
    const showAll = state.showAll;
    const scopeFree = showAll || state.newOnly;

    const styleMatch = showAll || !state.styles.length || state.styles.includes(p.style);
    const collectionMatch =
      scopeFree ||
      globalSearch ||
      !state.collections.length ||
      state.collections.includes(p.collection);
    const priceMatch = p.price <= state.maxPrice;
    const groupMatch =
      scopeFree ||
      globalSearch ||
      !groupFilterActive ||
      !focusGroup ||
      p.group === focusGroup;

    const mechanismMatch =
      showAll ||
      !state.mechanismTypes.length ||
      (Array.isArray(p.mechanisms) &&
        state.mechanismTypes.some((type) => p.mechanisms.includes(type)));

    const productTypeMatch =
      !state.productTypes.length || matchesProductType(p, state.productTypes);

    const newMatch = !state.newOnly || isProductNew(p);

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
      productTypeMatch &&
      newMatch &&
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
        case "collection":
          return String(a.collectionLabel || a.collection || "").localeCompare(
            String(b.collectionLabel || b.collection || ""),
            "ru",
          ) || String(a.name || "").localeCompare(String(b.name || ""), "ru");
        case "new":
        default:
          return Number(b.isNew) - Number(a.isNew) || b.popularity - a.popularity;
      }
    });
    return sorted;
  }

  function getScopeItems() {
    if (isShowAllCatalog()) {
      return catalogItems;
    }
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
    if (state.showAll) params.set("all", "1");
    if (state.newOnly) params.set("new", "1");
    normalizeProductTypesForUrl(state.productTypes).forEach((v) => params.append("type", v));
    state.styles.forEach((v) => params.append("style", v));
    state.collections.forEach((v) => params.append("collection", v));
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
      if (!input.matches("[data-filter-all], [data-filter-new]")) {
        input.checked = false;
      }
    });

    const allInput = filterForm?.querySelector("[data-filter-all]");
    if (allInput) allInput.checked = Boolean(state.showAll);

    const newInput = filterForm?.querySelector("[data-filter-new]");
    if (newInput) newInput.checked = Boolean(state.newOnly);

    presetProductTypes = [...(state.productTypes || [])];

    if (state.showAll) {
      clearCategoryFilters();
    }

    state.styles.forEach((v) => {
      const input = filterForm?.querySelector(`input[name="style"][value="${v}"]`);
      if (input) input.checked = true;
    });
    state.collections.forEach((v) => {
      const input = filterForm?.querySelector(`input[name="collection"][value="${v}"]`);
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
      showAll: params.get("all") === "1",
      newOnly: params.get("new") === "1",
      productTypes: expandProductTypes(readMulti("type")),
      styles: readMulti("style"),
      collections: readMulti("collection"),
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
      state.showAll ||
      state.newOnly ||
      state.productTypes.length ||
      state.styles.length ||
      state.collections.length ||
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

  function debounce(fn, ms) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  function getFilterBaseItems(state) {
    if (state.showAll) {
      return catalogItems;
    }
    if (
      state.q ||
      state.styles.length ||
      state.collections.length ||
      state.mechanismTypes.length ||
      state.productTypes.length ||
      state.newOnly
    ) {
      return catalogItems;
    }
    return getScopeItems();
  }

  function applyFilters() {
    let state = getFilterState();

    if (state.showAll) {
      groupFilterActive = false;
    } else if (state.newOnly) {
      groupFilterActive = false;
      filterForm?.querySelectorAll('input[name="collection"]').forEach((input) => {
        input.checked = false;
      });
      state = { ...state, collections: [] };
    } else if (state.q) {
      groupFilterActive = false;
      filterForm?.querySelectorAll('input[name="collection"]').forEach((input) => {
        input.checked = false;
      });
      state = { ...state, collections: [] };
    } else if (
      state.collections.length ||
      state.styles.length ||
      state.mechanismTypes.length ||
      state.productTypes.length ||
      state.newOnly ||
      state.widthFrom != null ||
      state.widthTo != null
    ) {
      groupFilterActive = false;
    }

    const filtered = sortItems(
      getFilterBaseItems(state).filter((p) => matchesFilters(p, state)),
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

    const allInput = filterForm.querySelector("[data-filter-all]");
    if (allInput) allInput.checked = false;

    presetProductTypes = [];

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
    presetProductTypes = [...urlState.productTypes];
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

  filterForm?.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") return;

    if (target.matches("[data-filter-all]")) {
      if (target.checked) {
        clearCategoryFilters();
        presetProductTypes = [];
        groupFilterActive = false;
      }
      applyFilters();
      return;
    }

    if (target.matches("[data-filter-new]")) {
      if (target.checked) {
        filterForm?.querySelectorAll('input[name="collection"]').forEach((input) => {
          input.checked = false;
        });
        groupFilterActive = false;
      }
      applyFilters();
      return;
    }

    if (
      target.name === "style" ||
      target.name === "collection" ||
      target.name === "mechanism_type"
    ) {
      if (target.checked) {
        const allInput = filterForm.querySelector("[data-filter-all]");
        if (allInput) allInput.checked = false;
        presetProductTypes = [];
      }
      applyFilters();
    }
  });

  widthFromInput?.addEventListener("change", applyFilters);
  widthToInput?.addEventListener("change", applyFilters);
  const debouncedApplyFilters = debounce(applyFilters, 200);

  searchInput?.addEventListener("input", () => {
    if (!searchInput.value.trim() && !isShowAllCatalog() && defaultCollections.length) {
      defaultCollections.forEach((value) => {
        const input = filterForm?.querySelector(`input[name="collection"][value="${value}"]`);
        if (input) input.checked = true;
      });
      groupFilterActive = false;
    }
    debouncedApplyFilters();
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
      ? window.CATALOG_PRODUCTS.map((item) => normalizeCatalogProduct(item))
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
