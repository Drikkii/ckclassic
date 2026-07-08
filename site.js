(function () {
  "use strict";

  function initHeaderOffset() {
    const header = document.querySelector(".header");
    if (!header) return;

    const setHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.offsetHeight}px`,
      );
    };

    setHeaderHeight();

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(setHeaderHeight);
      observer.observe(header);
    } else {
      window.addEventListener("resize", setHeaderHeight);
    }

    window.addEventListener("load", setHeaderHeight);
  }

  initHeaderOffset();
})();

(function () {
  "use strict";

  const header = document.querySelector(".header");
  const dropdownItems = document.querySelectorAll(".nav-menu-el--dropdown");
  if (!dropdownItems.length) return;

  function closeAll(except) {
    dropdownItems.forEach((item) => {
      if (item === except) return;

      item.classList.remove("is-open", "nav-menu-el--align-right");
      const trigger = item.querySelector(".nav-menu-trigger");
      const panel = item.querySelector(".nav-dropdown");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (panel) panel.hidden = true;
    });

    header?.classList.remove("is-nav-open");
  }

  function alignDropdown(item, panel) {
    item.classList.remove("nav-menu-el--align-right");
    panel.style.left = "";
    panel.style.right = "";

    const panelRect = panel.getBoundingClientRect();
    const viewportPadding = 12;

    if (panelRect.right > window.innerWidth - viewportPadding) {
      item.classList.add("nav-menu-el--align-right");
    }
  }

  function openDropdown(item) {
    const trigger = item.querySelector(".nav-menu-trigger");
    const panel = item.querySelector(".nav-dropdown");
    if (!trigger || !panel) return;

    closeAll(item);
    item.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    panel.hidden = false;
    panel.style.left = "";
    alignDropdown(item, panel);
    header?.classList.add("is-nav-open");
  }

  function toggleDropdown(item) {
    const isOpen = item.classList.contains("is-open");
    if (isOpen) {
      closeAll();
    } else {
      openDropdown(item);
    }
  }

  dropdownItems.forEach((item) => {
    const trigger = item.querySelector(".nav-menu-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(item);
    });
  });

  document.addEventListener("click", () => closeAll());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  window.addEventListener("resize", () => {
    const openItem = document.querySelector(".nav-menu-el--dropdown.is-open");
    if (!openItem) return;
    const panel = openItem.querySelector(".nav-dropdown");
    if (panel) alignDropdown(openItem, panel);
  });
})();

(function () {
  "use strict";

  const burger = document.querySelector(".nav-burger");
  const mobileNav = document.getElementById("mobile-nav");
  if (!burger || !mobileNav) return;

  const header = document.querySelector(".header");
  const backBtn = mobileNav.querySelector(".mobile-nav__back");
  const heading = mobileNav.querySelector(".mobile-nav__heading");
  const panels = mobileNav.querySelectorAll("[data-mobile-panel]");
  const mqDesktop = window.matchMedia("(min-width: 993px)");

  const panelTitles = {
    root: "Меню",
    factory: "О фабрике",
    products: "О продукции и материалах",
    catalog: "Модельный ряд",
  };

  function lockScroll() {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add("lock");
    document.body.classList.add("lock");
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      header?.style.setProperty("padding-right", `${scrollbarWidth}px`);
    }
  }

  function unlockScroll() {
    document.documentElement.classList.remove("lock");
    document.body.classList.remove("lock");
    document.body.style.paddingRight = "";
    header?.style.removeProperty("padding-right");
  }

  function showPanel(id) {
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.mobilePanel !== id;
    });
    backBtn.hidden = id === "root";
    heading.textContent = panelTitles[id] || "Меню";
  }

  function openNav() {
    mobileNav.hidden = false;
    header?.classList.add("is-nav-open");
    lockScroll();
    requestAnimationFrame(() => mobileNav.classList.add("is-open"));
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Закрыть меню");
    showPanel("root");
  }

  function closeNav() {
    mobileNav.classList.remove("is-open");
    header?.classList.remove("is-nav-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    unlockScroll();
    window.setTimeout(() => {
      if (!mobileNav.classList.contains("is-open")) {
        mobileNav.hidden = true;
        showPanel("root");
      }
    }, 280);
  }

  burger.addEventListener("click", () => {
    if (mobileNav.classList.contains("is-open")) closeNav();
    else openNav();
  });

  mobileNav.querySelectorAll("[data-mobile-submenu]").forEach((btn) => {
    btn.addEventListener("click", () => showPanel(btn.dataset.mobileSubmenu));
  });

  backBtn.addEventListener("click", () => showPanel("root"));

  mobileNav.querySelectorAll("[data-mobile-nav-close]").forEach((el) => {
    el.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileNav.classList.contains("is-open")) {
      closeNav();
    }
  });

  mqDesktop.addEventListener("change", (event) => {
    if (event.matches && mobileNav.classList.contains("is-open")) closeNav();
  });
})();

(function () {
  "use strict";

  document.querySelectorAll("[data-tabs]").forEach((tabsRoot) => {
    const buttons = tabsRoot.querySelectorAll(".tabs__btn");
    const panels = tabsRoot.querySelectorAll(".tabs__panel");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tab;

        buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
        panels.forEach((panel) => {
          const isActive = panel.dataset.panel === target;
          panel.classList.toggle("is-active", isActive);
          panel.hidden = !isActive;
        });
      });
    });
  });

  document.querySelectorAll("[data-readmore]").forEach((block) => {
    const btn = block.querySelector("[data-readmore-btn]");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const isOpen = block.classList.toggle("is-open");
      btn.textContent = isOpen ? "Скрыть" : "Читать далее";
    });
  });
})();

(function () {
  "use strict";

  const modal = document.getElementById("callback-modal");
  if (!modal) return;

  const dialog = modal.querySelector(".callback-modal__dialog");
  const header = document.querySelector(".header");

  function lockScroll() {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add("lock");
    document.body.classList.add("lock");
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      header?.style.setProperty("padding-right", `${scrollbarWidth}px`);
    }
  }

  function unlockScroll() {
    document.documentElement.classList.remove("lock");
    document.body.classList.remove("lock");
    document.body.style.paddingRight = "";
    header?.style.removeProperty("padding-right");
  }

  function openModal() {
    modal.hidden = false;
    lockScroll();
    requestAnimationFrame(() => modal.classList.add("is-open"));
    const firstInput = modal.querySelector("input");
    if (firstInput) firstInput.focus({ preventScroll: true });
  }

  function closeModal() {
    modal.classList.remove("is-open");
    unlockScroll();
    window.setTimeout(() => {
      if (!modal.classList.contains("is-open")) modal.hidden = true;
    }, 260);
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest(".js-callback-popup-btn")) {
      event.preventDefault();
      openModal();
    }
  });

  modal.querySelectorAll("[data-callback-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  dialog?.addEventListener("click", (event) => event.stopPropagation());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
})();
