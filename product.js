(function () {
  "use strict";

  const root = document.querySelector("[data-product-root]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const sku = params.get("sku");

  const notFound = document.querySelector("[data-product-not-found]");
  const breadcrumbs = document.querySelector("[data-product-breadcrumbs]");
  const galleryMain = document.querySelector("[data-gallery-main]");
  const galleryThumbs = document.querySelector("[data-gallery-thumbs]");
  const priceEl = document.querySelector("[data-product-price]");
  const priceBaseEl = document.querySelector("[data-product-price-base]");
  const orderForm = document.querySelector("[data-product-order-form]");
  const lightbox = document.querySelector("[data-product-lightbox]");
  const lightboxImg = document.querySelector("[data-lightbox-img]");
  const orderModal = document.querySelector("[data-order-modal]");
  const similarSection = document.querySelector("[data-product-similar]");
  const similarGrid = document.querySelector("[data-product-similar-grid]");
  const shopActionsEl = document.querySelector("[data-product-shop-actions]");

  function findProduct(products, targetSku) {
    return products.find((p) => String(p.sku) === String(targetSku));
  }

  async function loadCatalogProducts() {
    let products = Array.isArray(window.CATALOG_PRODUCTS) ? window.CATALOG_PRODUCTS : [];
    if (!sku) return products;

    if (findProduct(products, sku)) return products;

    try {
      const apiUrl = new URL("../../api/catalog.php", window.location.href).href;
      const response = await fetch(apiUrl, { credentials: "same-origin" });
      if (!response.ok) return products;

      const fresh = await response.json();
      if (!Array.isArray(fresh)) return products;

      window.CATALOG_PRODUCTS = fresh;
      return fresh;
    } catch (error) {
      console.error(error);
      return products;
    }
  }

  loadCatalogProducts().then((products) => {
    const product = findProduct(products, sku);

    if (!product) {
      notFound.hidden = false;
      return;
    }

    renderProduct(product, products);
  });

  function renderProduct(product, products) {
  if (window.CKShop?.getProduct) {
    product = window.CKShop.getProduct(product.sku) || product;
  } else if (!Array.isArray(product.mechanisms)) {
    product = { ...product, mechanisms: ["none"], mechanismLabel: "Без механизма" };
  }

  delete product.frame;

  function cleanProductDescription(text) {
    return String(text || "")
      .replace(/\s*Каркас[^.!?…]*[.!?…]?/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function renderSpec(label, value) {
    const normalized = value == null || value === "" ? "—" : String(value);
    return `<div><dt>${label}</dt><dd>${normalized}</dd></div>`;
  }

  root.hidden = false;
  document.title = `${product.name} — Ск-классик`;
  if (typeof window.CK_applyProductSeo === "function") {
    window.CK_applyProductSeo(product);
  }

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
  if (galleryDescription) {
    galleryDescription.textContent = cleanProductDescription(product.description || "");
  }

  const specsEl = document.querySelector("[data-product-specs]");
  const specItems = [
    renderSpec("Размеры (Д×Ш×В)", product.dims),
    renderSpec("Тип", product.typeLabel || product.type),
    renderSpec("Стиль", product.styleLabel || product.style),
    renderSpec("Наполнитель", product.filler),
    renderSpec("Основание", product.base),
  ];
  if (product.mechanismLabel && product.mechanismLabel !== "—") {
    specItems.push(renderSpec("Механизм", product.mechanismLabel));
  }
  specsEl.innerHTML = specItems.join("");

  function formatPrice(value) {
    return `от ${Number(value).toLocaleString("ru-RU")} ₽`;
  }

  function updatePrice() {
    priceEl.classList.remove("product-detail__price--unavailable");
    priceEl.textContent = formatPrice(product.basePrice || product.price || 0);
    priceBaseEl.hidden = true;
    updateProductShopActions();
  }

  function updateProductShopActions() {
    if (!shopActionsEl || !window.CKShop) return;
    if (window.CKShop.renderProductActionsRow) {
      shopActionsEl.innerHTML = window.CKShop.renderProductActionsRow(product.sku, {
        noticeClass: "product-detail__notice",
        rowClass: "product-detail__actions-row",
      });
    } else {
      const notice =
        window.CKShop.CATALOG_ORDER_NOTICE ||
        "* Вся мебель изготавливается под заказ. Для уточнения деталей оставьте заявку.";
      shopActionsEl.innerHTML = `<div class="product-detail__actions-row">
        <p class="product-detail__notice">${notice}</p>
        ${window.CKShop.renderActionsHtml(product.sku)}
      </div>`;
    }
    const cartBtn = shopActionsEl.querySelector("[data-cart-btn]");
    if (cartBtn) window.CKShop.syncAllActions();
  }

  updatePrice();

  if (window.CKShop) updateProductShopActions();
  else window.addEventListener("ck-shop-ready", updateProductShopActions, { once: true });

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

  orderForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(orderForm);
    const requestId = String(Math.floor(1000 + Math.random() * 9000));
    const payload = Object.fromEntries(formData.entries());
    payload.requestId = requestId;
    payload.createdAt = new Date().toISOString();

    const orders = JSON.parse(localStorage.getItem("ck_orders") || "[]");
    orders.push(payload);
    localStorage.setItem("ck_orders", JSON.stringify(orders));

    const submitBtn = orderForm.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = "Отправка…";
    }

    try {
      if (window.CKForms?.sendLead) {
        await window.CKForms.sendLead({
          _subject: "Заявка на товар",
          fields: {
            "Тип заявки": "Заявка на товар",
            "Номер заявки": requestId,
            "Страница": document.title,
            "URL": window.location.href,
            ...payload,
          },
        });
      }
    } catch (error) {
      console.error(error);
      window.alert(
        `Заявка сохранена, но письмо не отправилось. Позвоните нам: ${window.CK_SITE_CONFIG?.phonesLine || "+7 (964) 510-67-47, +7 (964) 525-44-58"}`,
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent =
          submitBtn.dataset.originalText || "Отправить заявку";
      }
    }

    orderForm.reset();
    document.querySelector("[data-order-model]").value = product.name;
    document.querySelector("[data-order-sku]").value = product.sku;
    updatePrice();
    openOrderModal(requestId);
  });

  function renderSimilarCard(p) {
    if (window.CKShop?.renderProductCardHtml) {
      return window.CKShop.renderProductCardHtml(p, { compact: true });
    }

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

  function normalizeType(type) {
    if (type === "corner") return "corner-classic";
    if (type === "modular") return "modular-set";
    return type;
  }

  const productType = normalizeType(product.type);

  const similar = products
    .filter(
      (p) =>
        p.sku !== product.sku &&
        (p.collection === product.collection || normalizeType(p.type) === productType),
    )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 4);

  if (similar.length && similarGrid) {
    function renderSimilarGrid() {
      similarSection.hidden = false;
      similarGrid.innerHTML = similar.map(renderSimilarCard).join("");
      window.CKShop?.syncAllActions();
    }

    if (window.CKShop) renderSimilarGrid();
    else window.addEventListener("ck-shop-ready", renderSimilarGrid, { once: true });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.key === "Escape") {
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
  }
})();
