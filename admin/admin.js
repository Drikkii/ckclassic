(function () {
  "use strict";

  const gallery = document.querySelector("[data-admin-gallery]");
  const orderInput = document.querySelector("[data-gallery-order]");
  if (gallery && orderInput) {
    let dragged = null;

    function updateOrder() {
      const items = gallery.querySelectorAll("[data-gallery-item]");
      const order = Array.from(items).map(function (el) {
        return el.getAttribute("data-original-index");
      });
      orderInput.value = order.join(",");
    }

    gallery.querySelectorAll("[data-gallery-item]").forEach(function (item) {
      item.addEventListener("dragstart", function () {
        dragged = item;
        item.classList.add("is-dragging");
      });
      item.addEventListener("dragend", function () {
        item.classList.remove("is-dragging");
        dragged = null;
        updateOrder();
      });
      item.addEventListener("dragover", function (event) {
        event.preventDefault();
        if (!dragged || dragged === item) return;
        const rect = item.getBoundingClientRect();
        const after = event.clientY > rect.top + rect.height / 2;
        gallery.insertBefore(dragged, after ? item.nextSibling : item);
      });
    });
  }

  const mechanismToggle = document.querySelector("[data-mechanism-toggle]");
  const mechanismFields = document.querySelector("[data-mechanism-fields]");
  if (mechanismToggle && mechanismFields) {
    function syncMechanism() {
      mechanismFields.hidden = !mechanismToggle.checked;
    }
    mechanismToggle.addEventListener("change", syncMechanism);
    syncMechanism();
  }

  const collectionSelect = document.getElementById("collection");
  const groupInput = document.getElementById("group");
  if (collectionSelect && groupInput) {
    const map = {
      shantal: "shantal-milord",
    };
    collectionSelect.addEventListener("change", function () {
      const value = collectionSelect.value;
      groupInput.value = map[value] || value;
    });
  }

  const flagPairs = [
    ["product-is-new-cb", "product-is-new"],
    ["product-is-out-of-stock-cb", "product-is-out-of-stock"],
  ];

  function syncProductFlags() {
    flagPairs.forEach(function (pair) {
      const checkbox = document.getElementById(pair[0]);
      const hidden = document.getElementById(pair[1]);
      if (!checkbox || !hidden) return;
      hidden.value = checkbox.checked ? "1" : "0";
    });
  }

  flagPairs.forEach(function (pair) {
    const checkbox = document.getElementById(pair[0]);
    if (!checkbox) return;
    checkbox.addEventListener("change", syncProductFlags);
  });

  const productForm = document.getElementById("product-edit-form");
  const saveBtn = document.querySelector('button[type="submit"][form="product-edit-form"]');

  if (productForm) {
    productForm.addEventListener("submit", syncProductFlags);
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", syncProductFlags, true);
  }

  syncProductFlags();
})();

(function () {
  "use strict";

  const slider = document.querySelector("[data-admin-slider]");
  const orderInput = document.querySelector("[data-slide-order]");
  if (!slider || !orderInput) return;

  let dragged = null;

  function updateOrder() {
    const items = slider.querySelectorAll("[data-slide-item]");
    const order = Array.from(items).map(function (el) {
      return el.getAttribute("data-slide-id");
    });
    orderInput.value = order.join(",");
  }

  slider.querySelectorAll("[data-slide-item]").forEach(function (item) {
    item.addEventListener("dragstart", function () {
      dragged = item;
      item.classList.add("is-dragging");
    });
    item.addEventListener("dragend", function () {
      item.classList.remove("is-dragging");
      dragged = null;
      updateOrder();
    });
    item.addEventListener("dragover", function (event) {
      event.preventDefault();
      if (!dragged || dragged === item) return;
      const rect = item.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      slider.insertBefore(dragged, after ? item.nextSibling : item);
    });
  });
})();
