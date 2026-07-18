(function () {
  "use strict";

  const favoritesRoot = document.querySelector("[data-favorites-page]");
  const cartRoot = document.querySelector("[data-cart-page]");

  function whenShopReady(fn) {
    if (window.CKShop) fn();
    else window.addEventListener("ck-shop-ready", fn, { once: true });
  }

  function renderFavorites() {
    const grid = favoritesRoot?.querySelector("[data-favorites-grid]");
    const empty = favoritesRoot?.querySelector("[data-favorites-empty]");
    if (!grid || !window.CKShop) return;

    const products = window.CKShop
      .getFavorites()
      .map((sku) => window.CKShop.getProduct(sku))
      .filter(Boolean);

    if (!products.length) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;
    grid.innerHTML = products
      .map((p) =>
        window.CKShop.renderProductCardHtml(p, {
          fromPagesRoot: true,
        }),
      )
      .join("");
    window.CKShop.syncAllActions();
  }

  function renderCart() {
    const content = cartRoot?.querySelector("[data-cart-content]");
    const empty = cartRoot?.querySelector("[data-cart-empty]");
    const formWrap = cartRoot?.querySelector("[data-cart-form-wrap]");
    if (!content || !window.CKShop) return;

    const cart = window.CKShop.getCart();

    if (!cart.length) {
      content.innerHTML = "";
      if (empty) empty.hidden = false;
      if (formWrap) formWrap.hidden = true;
      return;
    }

    if (empty) empty.hidden = true;
    if (formWrap) formWrap.hidden = false;

    const rows = cart
      .map((item) => {
        const product = window.CKShop.getProduct(item.sku);
        if (!product) return "";

        const href = window.CKShop.productUrl(item.sku, true);
        const imageTag = window.CKShop.renderCatalogImageTag
          ? window.CKShop.renderCatalogImageTag(product.image, product.name, {
              attrs: 'loading="lazy"',
            })
          : `<img src="${window.CKShop.resolveImage(product.image)}" alt="${product.name}" loading="lazy" />`;
        const lineTotal = item.price * item.qty;

        return `<tr class="cart-table__row" data-cart-row data-sku="${item.sku}" data-fabric-id="${item.fabricId}">
          <td class="cart-table__photo">
            <a href="${href}">${imageTag}</a>
          </td>
          <td class="cart-table__info">
            <a class="cart-table__title" href="${href}">${product.name}</a>
            <p class="cart-table__meta">Артикул: ${item.sku}</p>
          </td>
          <td class="cart-table__price">${window.CKShop.formatPrice(item.price)}</td>
          <td class="cart-table__qty">
            <div class="cart-qty">
              <button type="button" class="cart-qty__btn" data-cart-qty-minus aria-label="Уменьшить">−</button>
              <input type="number" class="cart-qty__input" value="${item.qty}" min="1" max="99" data-cart-qty-input aria-label="Количество" />
              <button type="button" class="cart-qty__btn" data-cart-qty-plus aria-label="Увеличить">+</button>
            </div>
          </td>
          <td class="cart-table__sum">${window.CKShop.formatPrice(lineTotal)}</td>
          <td class="cart-table__remove">
            <button type="button" class="cart-table__remove-btn" data-cart-remove aria-label="Удалить">×</button>
          </td>
        </tr>`;
      })
      .filter(Boolean)
      .join("");

    if (!rows) {
      content.innerHTML = "";
      if (empty) empty.hidden = false;
      if (formWrap) formWrap.hidden = true;
      return;
    }

    content.innerHTML = `
      <div class="cart-table-wrap">
        <table class="cart-table">
          <thead>
            <tr>
              <th scope="col">Фото</th>
              <th scope="col">Товар</th>
              <th scope="col">Цена</th>
              <th scope="col">Кол-во</th>
              <th scope="col">Сумма</th>
              <th scope="col"><span class="visually-hidden">Удалить</span></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="cart-summary">
        <p class="cart-summary__total">Итого: <strong data-cart-total>${window.CKShop.formatPrice(window.CKShop.getCartTotal())}</strong></p>
      </div>`;
  }

  function bindCartEvents() {
    if (!cartRoot) return;

    cartRoot.addEventListener("click", (event) => {
      const row = event.target.closest("[data-cart-row]");
      if (!row || !window.CKShop) return;

      const sku = row.dataset.sku;
      const fabricId = row.dataset.fabricId;

      if (event.target.closest("[data-cart-remove]")) {
        window.CKShop.removeFromCart(sku, fabricId);
        renderCart();
        return;
      }

      if (event.target.closest("[data-cart-qty-minus]")) {
        const input = row.querySelector("[data-cart-qty-input]");
        const next = Math.max(1, Number(input.value || 1) - 1);
        window.CKShop.updateCartQty(sku, fabricId, next);
        renderCart();
        return;
      }

      if (event.target.closest("[data-cart-qty-plus]")) {
        const input = row.querySelector("[data-cart-qty-input]");
        const next = Math.min(99, Number(input.value || 1) + 1);
        window.CKShop.updateCartQty(sku, fabricId, next);
        renderCart();
      }
    });

    cartRoot.addEventListener("change", (event) => {
      const input = event.target.closest("[data-cart-qty-input]");
      if (!input || !window.CKShop) return;
      const row = input.closest("[data-cart-row]");
      window.CKShop.updateCartQty(
        row.dataset.sku,
        row.dataset.fabricId,
        Number(input.value || 1),
      );
      renderCart();
    });

    const form = cartRoot.querySelector("[data-cart-order-form]");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!window.CKShop || !window.CKForms) return;

      const cart = window.CKShop.getCart();
      if (!cart.length) return;

      const formData = new FormData(form);
      const submitBtn = form.querySelector('[type="submit"]');
      const requestId = String(Math.floor(1000 + Math.random() * 9000));

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправка…";
      }

      const itemsText = cart
        .map((item, index) => {
          const product = window.CKShop.getProduct(item.sku);
          return `${index + 1}. ${product?.name || item.sku} × ${item.qty} — ${window.CKShop.formatPrice(item.price * item.qty)}`;
        })
        .join("\n");

      try {
        await window.CKForms.sendLead({
          _subject: "Заказ из корзины",
          fields: {
            "Тип заявки": "Заказ из корзины",
            "Номер заявки": requestId,
            "Имя": formData.get("name"),
            "Телефон": formData.get("phone"),
            "Комментарий": formData.get("comment") || "—",
            "Состав заказа": itemsText,
            "Итого": window.CKShop.formatPrice(window.CKShop.getCartTotal()),
            "Страница": document.title,
            "URL": window.location.href,
          },
        });

        window.CKShop.clearCart();
        renderCart();
        window.CKForms.openThanksModal(
          `Спасибо! Заявка №${requestId} принята. Менеджер свяжется с вами для уточнения деталей заказа.`,
        );
        form.reset();
      } catch (error) {
        console.error(error);
        window.alert(
          `Не удалось отправить заявку. Попробуйте позже или позвоните нам: ${window.CK_SITE_CONFIG?.phonesLine || "+7 (964) 510-67-47, +7 (964) 525-44-58"}`,
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Оформить заказ";
        }
      }
    });
  }

  whenShopReady(() => {
    window.CKShop.syncWithCatalog?.();

    if (favoritesRoot) {
      renderFavorites();
      window.addEventListener("ck-shop-change", renderFavorites);
    }

    if (cartRoot) {
      renderCart();
      bindCartEvents();
      window.addEventListener("ck-shop-change", renderCart);
    }
  });
})();
