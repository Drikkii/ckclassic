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

  const collectionSelect = document.getElementById("collection");
  const groupInput = document.getElementById("group");
  const groupDisplay = document.querySelector("[data-group-display]");
  if (collectionSelect && groupInput) {
    const map = {
      shantal: "shantal-milord",
    };

    const specialGroups = ["beds", "chairs", "panels", "custom"];

    function syncCollectionGroup() {
      if (specialGroups.includes(groupInput.value)) {
        return;
      }
      const value = collectionSelect.value;
      groupInput.value = map[value] || value;
      if (groupDisplay) {
        const option = collectionSelect.selectedOptions[0];
        groupDisplay.value = option ? option.textContent.trim() : groupInput.value;
      }
    }

    collectionSelect.addEventListener("change", syncCollectionGroup);
    syncCollectionGroup();
  }

  const typeSelect = document.querySelector("[data-product-type]");
  const baseInput = document.querySelector("[data-product-base]");
  if (typeSelect && baseInput) {
    const baseMap = {
      "corner-ottoman": "угловой диван с оттоманкой",
      "corner-classic": "угловая композиция",
      straight: "прямой диван",
      "modular-set": "модульный набор",
      armchair: "кресло",
      pouf: "пуфик",
    };

    typeSelect.addEventListener("change", function () {
      const nextBase = baseMap[typeSelect.value];
      if (nextBase) baseInput.value = nextBase;
    });
  }

  const flagPairs = [["product-is-new-cb", "product-is-new"]];

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
