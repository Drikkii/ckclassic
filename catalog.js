(function () {
  "use strict";

  const grid = document.querySelector("[data-catalog-grid]");
  if (!grid) return;

  const body = document.body;
  const countEl = document.querySelector("[data-catalog-count]");
  const sortSelect = document.querySelector("[data-catalog-sort]");
  const filterForm = document.querySelector("[data-catalog-filters-form]");
  const priceRange = document.querySelector("[data-price-range]");
  const priceMaxLabel = document.querySelector("[data-price-max]");
  const resetBtn = document.querySelector("[data-filter-reset]");
  const filtersToggle = document.querySelector("[data-filters-toggle]");
  const filtersPanel = document.querySelector("[data-catalog-filters-panel]");
  const tagButtons = document.querySelectorAll("[data-catalog-tag]");

  const defaultCollections = (body.dataset.defaultCollections || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const focusGroup = body.dataset.catalogFocus || "";

  let products = [];
  let groupFilterActive = Boolean(focusGroup);

  function renderProductCard(p) {
    const article = document.createElement("article");
    article.className = "catalog-product";
    article.dataset.style = p.style;
    article.dataset.collection = p.collection;
    article.dataset.price = String(p.price);
    article.dataset.group = p.group;
    article.innerHTML = `
      <a class="catalog-product__image" href="#">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </a>
      <div class="catalog-product__body">
        <h3 class="catalog-product__title">
          <a href="#">${p.name}</a>
        </h3>
        <ul class="catalog-product__meta">
          <li><span>Артикул:</span> ${p.sku}</li>
          <li><span>Коллекция:</span> ${p.collectionLabel}</li>
          <li><span>Габариты:</span> ${p.dims}</li>
        </ul>
        <p class="catalog-product__price">${Number(p.price).toLocaleString("ru-RU")} ₽</p>
      </div>`;
    return article;
  }

  function mountProducts() {
    const source = window.CATALOG_PRODUCTS;
    if (!Array.isArray(source) || !source.length) {
      products = Array.from(grid.querySelectorAll(".catalog-product"));
      return;
    }

    grid.innerHTML = "";
    products = source.map((p) => {
      const el = renderProductCard(p);
      grid.appendChild(el);
      return el;
    });
  }

  mountProducts();

  const priceMax = Number(priceRange?.max || 1000000);

  function getCheckedValues(name) {
    if (!filterForm) return [];
    return Array.from(filterForm.querySelectorAll(`input[name="${name}"]:checked`)).map(
      (input) => input.value,
    );
  }

  function getVisibleProducts() {
    return products.filter((p) => !p.classList.contains("is-hidden"));
  }

  function updateCount() {
    if (!countEl) return;
    const visible = getVisibleProducts().length;
    countEl.textContent = `Показано: ${visible} из ${products.length}`;
  }

  function applyFilters() {
    const styles = getCheckedValues("style");
    const collections = getCheckedValues("collection");
    const maxPrice = priceRange ? Number(priceRange.value) : priceMax;

    if (collections.length || styles.length) {
      groupFilterActive = false;
    }

    products.forEach((product) => {
      const productStyle = product.dataset.style;
      const productCollection = product.dataset.collection;
      const productGroup = product.dataset.group;
      const productPrice = Number(product.dataset.price);

      const styleMatch = !styles.length || styles.includes(productStyle);
      const collectionMatch =
        !collections.length || collections.includes(productCollection);
      const priceMatch = productPrice <= maxPrice;
      const groupMatch =
        !groupFilterActive || !focusGroup || productGroup === focusGroup;

      product.classList.toggle(
        "is-hidden",
        !(styleMatch && collectionMatch && priceMatch && groupMatch),
      );
    });

    applySort(false);
    updateCount();
  }

  function applySort(updateCountFlag) {
    if (!sortSelect) return;

    const visible = getVisibleProducts();
    const hidden = products.filter((p) => p.classList.contains("is-hidden"));
    const sort = sortSelect.value;

    visible.sort((a, b) => {
      const titleA = a.querySelector(".catalog-product__title")?.textContent.trim() || "";
      const titleB = b.querySelector(".catalog-product__title")?.textContent.trim() || "";
      const priceA = Number(a.dataset.price);
      const priceB = Number(b.dataset.price);

      switch (sort) {
        case "name-asc":
          return titleA.localeCompare(titleB, "ru");
        case "name-desc":
          return titleB.localeCompare(titleA, "ru");
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        default:
          return 0;
      }
    });

    [...visible, ...hidden].forEach((item) => grid.appendChild(item));

    if (updateCountFlag !== false) updateCount();
  }

  function setDefaultFilters() {
    if (!filterForm) return;

    filterForm.querySelectorAll("input[type=checkbox]").forEach((input) => {
      input.checked = false;
    });

    if (defaultCollections.length) {
      defaultCollections.forEach((value) => {
        const input = filterForm.querySelector(
          `input[name="collection"][value="${value}"]`,
        );
        if (input) input.checked = true;
      });
      groupFilterActive = false;
    } else if (focusGroup) {
      groupFilterActive = true;
    }

    if (priceRange) {
      priceRange.value = priceRange.max;
      if (priceMaxLabel) {
        priceMaxLabel.textContent = `${Number(priceRange.max).toLocaleString("ru-RU")} ₽`;
      }
    }

    tagButtons.forEach((tag) => tag.classList.remove("is-active"));
  }

  function resetFilters() {
    setDefaultFilters();
    if (sortSelect) sortSelect.value = "name-asc";
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
      const input = filterForm.querySelector(
        `input[name="collection"][value="${collection}"]`,
      );
      if (input) input.checked = true;
    }

    groupFilterActive = false;
    applyFilters();
  }

  if (priceRange) {
    priceRange.addEventListener("input", () => {
      if (priceMaxLabel) {
        priceMaxLabel.textContent = `${Number(priceRange.value).toLocaleString("ru-RU")} ₽`;
      }
      applyFilters();
    });
  }

  filterForm?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", applyFilters);
  });

  filterForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters();
    filtersPanel?.classList.remove("is-open");
  });

  resetBtn?.addEventListener("click", resetFilters);
  sortSelect?.addEventListener("change", () => applySort());

  tagButtons.forEach((tag) => {
    tag.addEventListener("click", () => applyTagFilter(tag));
  });

  filtersToggle?.addEventListener("click", () => {
    filtersPanel?.classList.toggle("is-open");
  });

  document.querySelectorAll("[data-readmore]").forEach((block) => {
    const btn = block.querySelector("[data-readmore-btn]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isOpen = block.classList.toggle("is-open");
      btn.textContent = isOpen ? "Скрыть" : "Читать подробнее";
    });
  });

  if (priceMaxLabel && priceRange) {
    priceMaxLabel.textContent = `${Number(priceRange.value).toLocaleString("ru-RU")} ₽`;
  }

  setDefaultFilters();
  applyFilters();
})();
