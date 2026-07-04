(function () {
  "use strict";

  const root = document.querySelector("[data-product-root]");
  if (!root) return;

  const products = window.CATALOG_PRODUCTS || [];
  const fabrics = window.FABRICS || [];
  const params = new URLSearchParams(window.location.search);
  const sku = params.get("sku");

  const notFound = document.querySelector("[data-product-not-found]");
  const breadcrumbs = document.querySelector("[data-product-breadcrumbs]");
  const galleryMain = document.querySelector("[data-gallery-main]");
  const galleryThumbs = document.querySelector("[data-gallery-thumbs]");
  const fabricSelect = document.querySelector("[data-product-fabric]");
  const fabricPicker = document.querySelector("[data-fabric-picker]");
  const fabricTrigger = document.querySelector("[data-fabric-trigger]");
  const fabricValueEl = document.querySelector("[data-fabric-value]");
  const fabricListEl = document.querySelector("[data-fabric-list]");
  const fabricBackdrop = document.querySelector("[data-fabric-backdrop]");
  const priceEl = document.querySelector("[data-product-price]");
  const priceBaseEl = document.querySelector("[data-product-price-base]");
  const orderForm = document.querySelector("[data-product-order-form]");
  const lightbox = document.querySelector("[data-product-lightbox]");
  const lightboxImg = document.querySelector("[data-lightbox-img]");
  const orderModal = document.querySelector("[data-order-modal]");
  const similarSection = document.querySelector("[data-product-similar]");
  const similarGrid = document.querySelector("[data-product-similar-grid]");

  const product = products.find((p) => p.sku === sku);

  if (!product) {
    notFound.hidden = false;
    return;
  }

  root.hidden = false;
  document.title = `${product.name} — Ск-классик`;

  let galleryIndex = 0;
  const gallery = product.gallery?.length ? product.gallery : [{ src: product.image, alt: product.name, type: "general" }];

  const collectionPages = {
    living: "living.html",
    hermes: "hermes.html",
    dante: "dante.html",
    shantal: "shantal-milord.html",
    jamaica: "jamaica.html",
    scarlett: "scarlett.html",
    teseo: "teseo.html",
    turin: "turin.html",
    baxter: "baxter.html",
    dionis: "dionis.html",
  };

  const catalogHref = collectionPages[product.collection] || "living.html";

  if (breadcrumbs) {
    breadcrumbs.innerHTML = `
      <a href="../../index.html">Главная</a><span>/</span>
      <a href="../../index.html#materials">Каталог</a><span>/</span>
      <a href="${catalogHref}">${product.collectionLabel}</a><span>/</span>
      <span>${product.name}</span>`;
  }

  document.querySelector("[data-product-sku]").textContent = `Артикул: ${product.sku}`;
  document.querySelector("[data-product-title]").textContent = product.name;
  document.querySelector("[data-product-collection]").textContent = `Коллекция «${product.collectionLabel}»`;
  const galleryDescription = document.querySelector("[data-product-gallery-description]");
  if (galleryDescription) galleryDescription.textContent = product.description || "";

  const specsEl = document.querySelector("[data-product-specs]");
  specsEl.innerHTML = `
    <div><dt>Размеры (Д×Ш×В)</dt><dd>${product.dims}</dd></div>
    <div><dt>Ширина</dt><dd>${product.width} см</dd></div>
    <div><dt>Каркас</dt><dd>${product.frame}</dd></div>
    <div><dt>Наполнитель</dt><dd>${product.filler}</dd></div>
    <div><dt>Основание</dt><dd>${product.base}</dd></div>
    <div><dt>Механизм</dt><dd>${product.mechanismLabel || "—"}</dd></div>`;

  function formatPrice(value) {
    return `${Number(value).toLocaleString("ru-RU")} ₽`;
  }

  function getFabricById(id) {
    return fabrics.find((f) => f.id === id);
  }

  function getSelectedFabric() {
    return getFabricById(fabricSelect?.value) || fabrics[0];
  }

  function updatePrice() {
    const fabric = getSelectedFabric();
    const delta = fabric?.delta || 0;
    const total = product.basePrice + delta;
    priceEl.textContent = formatPrice(total);

    if (delta > 0) {
      priceBaseEl.hidden = false;
      priceBaseEl.textContent = `Базовая: ${formatPrice(product.basePrice)}`;
    } else {
      priceBaseEl.hidden = true;
    }

    updateFabricTrigger();

    const orderFabric = document.querySelector("[data-order-fabric]");
    if (orderFabric) orderFabric.value = fabric?.name || "";
  }

  let selectedFabricId = "";

  function updateFabricTrigger() {
    const fabric = getSelectedFabric();
    if (!fabric || !fabricValueEl) return;
    const total = product.basePrice + (fabric.delta || 0);
    const deltaText = fabric.delta ? ` (+${formatPrice(fabric.delta)})` : "";
    fabricValueEl.innerHTML = `
      <span class="fabric-picker__value-main">${fabric.name}</span>
      <span class="fabric-picker__value-sub">${formatPrice(total)}${deltaText}</span>`;
  }

  function renderFabricList() {
    if (!fabricListEl || !fabricSelect) return;

    fabricSelect.innerHTML = allowedFabrics
      .map((f) => `<option value="${f.id}">${f.name}</option>`)
      .join("");

    if (!selectedFabricId && allowedFabrics[0]) {
      selectedFabricId = allowedFabrics[0].id;
    }
    fabricSelect.value = selectedFabricId;

    fabricListEl.innerHTML = allowedFabrics
      .map((f) => {
        const total = product.basePrice + f.delta;
        const deltaText = f.delta ? `+${formatPrice(f.delta)} · ` : "";
        return `<li>
          <button
            type="button"
            class="fabric-picker__option${f.id === selectedFabricId ? " is-active" : ""}"
            data-fabric-id="${f.id}"
            role="option"
            aria-selected="${f.id === selectedFabricId}"
          >
            <span class="fabric-picker__option-name">${f.name}</span>
            <span class="fabric-picker__option-price">${deltaText}${formatPrice(total)}</span>
          </button>
        </li>`;
      })
      .join("");
    updateFabricTrigger();
  }

  function openFabricPicker() {
    if (!fabricPicker || !fabricListEl) return;
    fabricPicker.classList.add("is-open");
    fabricTrigger?.setAttribute("aria-expanded", "true");
    fabricListEl.hidden = false;
    if (fabricBackdrop) fabricBackdrop.hidden = false;
  }

  function closeFabricPicker() {
    if (!fabricPicker || !fabricListEl) return;
    fabricPicker.classList.remove("is-open");
    fabricTrigger?.setAttribute("aria-expanded", "false");
    fabricListEl.hidden = true;
    if (fabricBackdrop) fabricBackdrop.hidden = true;
  }

  function setFabric(id) {
    selectedFabricId = id;
    if (fabricSelect) fabricSelect.value = id;
    renderFabricList();
    updatePrice();
    closeFabricPicker();
  }

  const allowedFabrics = (product.fabrics || ["standard"])
    .map((id) => getFabricById(id))
    .filter(Boolean);

  renderFabricList();

  fabricTrigger?.addEventListener("click", () => {
    if (fabricPicker?.classList.contains("is-open")) closeFabricPicker();
    else openFabricPicker();
  });

  fabricBackdrop?.addEventListener("click", closeFabricPicker);

  fabricListEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fabric-id]");
    if (!btn) return;
    setFabric(btn.dataset.fabricId);
  });

  fabricSelect?.addEventListener("change", () => {
    selectedFabricId = fabricSelect.value;
    renderFabricList();
    updatePrice();
  });

  updatePrice();

  document.querySelector("[data-order-model]").value = product.name;
  document.querySelector("[data-order-sku]").value = product.sku;

  const galleryPrev = document.querySelector("[data-gallery-prev]");
  const galleryNext = document.querySelector("[data-gallery-next]");
  const lightboxPrev = document.querySelector("[data-lightbox-prev]");
  const lightboxNext = document.querySelector("[data-lightbox-next]");

  function updateGalleryNav() {
    const show = gallery.length > 1;
    [galleryPrev, galleryNext, lightboxPrev, lightboxNext].forEach((btn) => {
      if (btn) btn.hidden = !show;
    });
    if (galleryThumbs) galleryThumbs.hidden = !show;
  }

  function setGallerySlide(index) {
    galleryIndex = (index + gallery.length) % gallery.length;
    const slide = gallery[galleryIndex];
    galleryMain.src = slide.src;
    galleryMain.alt = slide.alt || product.name;
    galleryThumbs.querySelectorAll(".product-gallery__thumb").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === galleryIndex);
      if (i === galleryIndex) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });
    if (lightbox && !lightbox.hidden && lightboxImg) {
      lightboxImg.src = slide.src;
      lightboxImg.alt = slide.alt || product.name;
    }
  }

  galleryThumbs.innerHTML = gallery
    .map(
      (slide, i) => `<button class="product-gallery__thumb${i === 0 ? " is-active" : ""}" type="button" data-gallery-index="${i}" aria-label="Фото ${i + 1}">
        <img src="${slide.src}" alt="" loading="lazy" />
      </button>`,
    )
    .join("");

  galleryThumbs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-gallery-index]");
    if (!btn) return;
    setGallerySlide(Number(btn.dataset.galleryIndex));
  });

  setGallerySlide(0);
  updateGalleryNav();

  galleryPrev?.addEventListener("click", (e) => {
    e.stopPropagation();
    setGallerySlide(galleryIndex - 1);
  });
  galleryNext?.addEventListener("click", (e) => {
    e.stopPropagation();
    setGallerySlide(galleryIndex + 1);
  });

  function lockScroll() {
    document.documentElement.classList.add("lock");
    document.body.classList.add("lock");
  }

  function unlockScroll() {
    document.documentElement.classList.remove("lock");
    document.body.classList.remove("lock");
  }

  function openLightbox() {
    if (!lightbox) return;
    lightbox.hidden = false;
    lightboxImg.src = gallery[galleryIndex].src;
    lightboxImg.alt = gallery[galleryIndex].alt || product.name;
    lockScroll();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    unlockScroll();
  }

  document.querySelector("[data-gallery-open]")?.addEventListener("click", openLightbox);
  document.querySelector("[data-lightbox-close]")?.addEventListener("click", closeLightbox);
  document.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => setGallerySlide(galleryIndex - 1));
  document.querySelector("[data-lightbox-next]")?.addEventListener("click", () => setGallerySlide(galleryIndex + 1));

  lightbox?.addEventListener("click", (e) => {
    if (
      e.target === lightbox ||
      e.target.classList.contains("product-lightbox__stage")
    ) {
      closeLightbox();
    }
  });

  function openOrderModal(requestId) {
    const text = document.querySelector("[data-order-modal-text]");
    if (text) {
      text.textContent = `Спасибо, ваша заявка принята! Номер заявки: ${requestId}. Менеджер свяжется с вами в ближайшее время.`;
    }
    orderModal.hidden = false;
    lockScroll();
  }

  function closeOrderModal() {
    orderModal.hidden = true;
    unlockScroll();
  }

  orderModal?.querySelectorAll("[data-order-modal-close]").forEach((el) => {
    el.addEventListener("click", closeOrderModal);
  });

  orderForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(orderForm);
    const requestId = String(Math.floor(1000 + Math.random() * 9000));
    const payload = Object.fromEntries(formData.entries());
    payload.requestId = requestId;
    payload.createdAt = new Date().toISOString();

    const orders = JSON.parse(localStorage.getItem("ck_orders") || "[]");
    orders.push(payload);
    localStorage.setItem("ck_orders", JSON.stringify(orders));

    orderForm.reset();
    document.querySelector("[data-order-model]").value = product.name;
    document.querySelector("[data-order-sku]").value = product.sku;
    updatePrice();
    openOrderModal(requestId);
  });

  function renderSimilarCard(p) {
    const href = `product.html?sku=${encodeURIComponent(p.sku)}`;
    return `<article class="catalog-product">
      <a class="catalog-product__image" href="${href}">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </a>
      <div class="catalog-product__body">
        <h3 class="catalog-product__title"><a href="${href}">${p.name}</a></h3>
        <ul class="catalog-product__meta">
          <li><span>Артикул:</span> ${p.sku}</li>
          <li><span>Коллекция:</span> ${p.collectionLabel}</li>
        </ul>
        <p class="catalog-product__price">${formatPrice(p.basePrice || p.price)}</p>
      </div>
    </article>`;
  }

  const similar = products
    .filter((p) => p.sku !== product.sku && (p.collection === product.collection || p.type === product.type))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 4);

  if (similar.length && similarGrid) {
    similarSection.hidden = false;
    similarGrid.innerHTML = similar.map(renderSimilarCard).join("");
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.key === "Escape") {
      if (fabricPicker?.classList.contains("is-open")) closeFabricPicker();
      if (!lightbox?.hidden) closeLightbox();
      if (!orderModal?.hidden) closeOrderModal();
      return;
    }
    if (gallery.length <= 1) return;
    if (!lightbox?.hidden || document.activeElement === galleryMain) {
      if (e.key === "ArrowLeft") setGallerySlide(galleryIndex - 1);
      if (e.key === "ArrowRight") setGallerySlide(galleryIndex + 1);
    }
  });
})();
