(function () {
  "use strict";

  const grid = document.querySelector("[data-catalog-grid]");
  if (!grid) return;

  const products = Array.from(grid.querySelectorAll(".catalog-product"));
  const countEl = document.querySelector("[data-catalog-count]");
  const sortSelect = document.querySelector("[data-catalog-sort]");
  const filterForm = document.querySelector("[data-catalog-filters-form]");
  const priceRange = document.querySelector("[data-price-range]");
  const priceMaxLabel = document.querySelector("[data-price-max]");
  const resetBtn = document.querySelector("[data-filter-reset]");
  const filtersToggle = document.querySelector("[data-filters-toggle]");
  const filtersPanel = document.querySelector("[data-catalog-filters-panel]");
  const tagButtons = document.querySelectorAll("[data-catalog-tag]");

  const priceMax = Number(priceRange?.max || 100000);

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

    products.forEach((product) => {
      const productStyle = product.dataset.style;
      const productCollection = product.dataset.collection;
      const productPrice = Number(product.dataset.price);

      const styleMatch = !styles.length || styles.includes(productStyle);
      const collectionMatch =
        !collections.length || collections.includes(productCollection);
      const priceMatch = productPrice <= maxPrice;

      product.classList.toggle("is-hidden", !(styleMatch && collectionMatch && priceMatch));
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

  function resetFilters() {
    if (filterForm) {
      filterForm.querySelectorAll("input[type=checkbox]").forEach((input) => {
        input.checked = false;
      });
    }

    if (priceRange) {
      priceRange.value = priceRange.max;
      if (priceMaxLabel) {
        priceMaxLabel.textContent = `${Number(priceRange.max).toLocaleString("ru-RU")} ₽`;
      }
    }

    tagButtons.forEach((tag) => tag.classList.remove("is-active"));
    products.forEach((p) => p.classList.remove("is-hidden"));
    if (sortSelect) sortSelect.value = "name-asc";
    applySort();
  }

  function applyTagFilter(tag) {
    resetFilters();
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

    applyFilters();
  }

  if (priceRange) {
    priceRange.addEventListener("input", () => {
      if (priceMaxLabel) {
        priceMaxLabel.textContent = `${Number(priceRange.value).toLocaleString("ru-RU")} ₽`;
      }
    });
  }

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

  applySort();
})();
