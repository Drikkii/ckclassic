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

  const AUTOPLAY_DELAY = 10000;
  const SWIPE_THRESHOLD = 50;
  const TRANSITION_MS = 650;

  const carousel = document.querySelector(".carousel");
  if (!carousel) return;

  const track = carousel.querySelector(".carousel__track");
  if (!track) return;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function encodeSrc(src) {
    const value = String(src || "").trim();
    if (!value) return "";
    if (/%[0-9A-Fa-f]{2}/.test(value)) return value;
    return value.split("/").map(encodeURIComponent).join("/");
  }

  async function loadHomeSlides() {
    try {
      const response = await fetch(`api/slider.php?_=${Date.now()}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const payload = await response.json();
        if (Array.isArray(payload.slides) && payload.slides.length) {
          return payload.slides;
        }
      }
    } catch (error) {
      console.warn("[slider] API unavailable", error);
    }

    if (Array.isArray(window.HOME_SLIDES) && window.HOME_SLIDES.length) {
      return window.HOME_SLIDES;
    }

    return [];
  }

  function buildCarouselFromData(data) {
    if (!Array.isArray(data) || !data.length) return false;

    function slideHtml(slide, clone) {
      const title = slide.useH1 ? slide.h1 || slide.title || "" : slide.title || "";
      const headingTag = slide.useH1 ? "h1" : "h2";
      const cls = clone
        ? "carousel__slide carousel__slide--clone"
        : "carousel__slide";
      const aria = clone ? ' aria-hidden="true"' : "";

      return `<li class="${cls}"${aria}>
        <img src="${encodeSrc(slide.src)}" alt="${escapeHtml(slide.alt)}" />
        <div class="carousel__caption">
          <${headingTag}>${escapeHtml(title)}</${headingTag}>
          <p>${escapeHtml(slide.sub || "")}</p>
        </div>
      </li>`;
    }

    const last = data[data.length - 1];
    const first = data[0];
    track.innerHTML = [
      slideHtml(last, true),
      ...data.map((slide) => slideHtml(slide, false)),
      slideHtml(first, true),
    ].join("");

    return true;
  }

  loadHomeSlides().then((data) => {
    if (!data.length) return;

    window.HOME_SLIDES = data;
    if (!buildCarouselFromData(data)) return;

    const slides = Array.from(
      carousel.querySelectorAll(".carousel__slide:not(.carousel__slide--clone)"),
    );
    if (!slides.length) return;

    const btnPrev = carousel.querySelector(".carousel__btn--prev");
    const btnNext = carousel.querySelector(".carousel__btn--next");
    const dotsContainer = carousel.querySelector(".carousel__dots");
    let currentIndex = 0;
    let trackIndex = 1;
    let autoplayTimer = null;
    let isAnimating = false;
    let fallbackTimer = null;
    let prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let pointerStartX = 0;
    let pointerCurrentX = 0;
    let isDragging = false;
    let dragStarted = false;

    function getSlideWidth() {
      return carousel.offsetWidth;
    }

    function setTrackPosition(animate) {
      const offset = -trackIndex * getSlideWidth();
      track.style.transition =
        animate && !prefersReducedMotion
          ? `transform ${TRANSITION_MS}ms ease`
          : "none";
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    }

    function getDisplayIndex() {
      const allTrackSlides = track.children.length;
      if (trackIndex <= 0) return slides.length - 1;
      if (trackIndex >= allTrackSlides - 1) return 0;
      return trackIndex - 1;
    }

    function updateDots() {
      const activeIndex = getDisplayIndex();
      const dots = dotsContainer.querySelectorAll(".carousel__dot");
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === activeIndex);
        dot.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
      });
    }

    function buildDots() {
      dotsContainer.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Слайд ${i + 1}`);
        dot.addEventListener("click", () => goToSlide(i));
        dotsContainer.appendChild(dot);
      });
      updateDots();
    }

    function resetAutoplay() {
      clearInterval(autoplayTimer);
      autoplayTimer = setInterval(nextSlide, AUTOPLAY_DELAY);
    }

    function handleLoopEnd() {
      const allTrackSlides = track.children.length;

      if (trackIndex === 0) {
        trackIndex = slides.length;
        setTrackPosition(false);
      } else if (trackIndex === allTrackSlides - 1) {
        trackIndex = 1;
        setTrackPosition(false);
      }

      currentIndex = getDisplayIndex();
      updateDots();
      isAnimating = false;
      setNavLocked(false);
    }

    function finishTransition() {
      if (!isAnimating) return;
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
      handleLoopEnd();
    }

    function setNavLocked(locked) {
      carousel.classList.toggle("carousel--busy", locked);
      btnPrev.disabled = locked;
      btnNext.disabled = locked;
      btnPrev.setAttribute("aria-disabled", locked ? "true" : "false");
      btnNext.setAttribute("aria-disabled", locked ? "true" : "false");
      dotsContainer.querySelectorAll(".carousel__dot").forEach((dot) => {
        dot.disabled = locked;
        dot.setAttribute("aria-disabled", locked ? "true" : "false");
      });
    }

    function goToTrackIndex(index, animate) {
      if (animate && isAnimating) return;

      trackIndex = index;
      currentIndex = getDisplayIndex();

      if (animate && !prefersReducedMotion) {
        isAnimating = true;
        setNavLocked(true);
        setTrackPosition(true);
        fallbackTimer = window.setTimeout(finishTransition, TRANSITION_MS + 150);
      } else {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
        setTrackPosition(false);
        handleLoopEnd();
      }

      updateDots();
      resetAutoplay();
    }

    function nextSlide() {
      if (isAnimating) return;
      goToTrackIndex(trackIndex + 1, true);
    }

    function prevSlide() {
      if (isAnimating) return;
      goToTrackIndex(trackIndex - 1, true);
    }

    function goToSlide(index) {
      if (isAnimating) return;
      if (index === currentIndex) return;
      goToTrackIndex(index + 1, true);
    }

    function onTransitionEnd(e) {
      if (e.target !== track || e.propertyName !== "transform") return;
      finishTransition();
    }

    function onPointerDown(e) {
      if (isAnimating) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      isDragging = true;
      dragStarted = false;
      pointerStartX = e.clientX;
      pointerCurrentX = e.clientX;
      track.setPointerCapture(e.pointerId);
      track.classList.add("is-dragging");
      clearInterval(autoplayTimer);
    }

    function onPointerMove(e) {
      if (!isDragging) return;

      pointerCurrentX = e.clientX;
      const delta = pointerCurrentX - pointerStartX;

      if (!dragStarted && Math.abs(delta) > 8) {
        dragStarted = true;
      }

      if (dragStarted) {
        const baseOffset = -trackIndex * getSlideWidth();
        track.style.transform = `translate3d(${baseOffset + delta}px, 0, 0)`;
      }
    }

    function onPointerUp(e) {
      if (!isDragging) return;

      isDragging = false;
      track.classList.remove("is-dragging");

      if (track.hasPointerCapture(e.pointerId)) {
        track.releasePointerCapture(e.pointerId);
      }

      const delta = pointerCurrentX - pointerStartX;

      if (dragStarted && Math.abs(delta) >= SWIPE_THRESHOLD) {
        if (delta < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      } else if (!isAnimating) {
        setTrackPosition(true);
        resetAutoplay();
      } else {
        resetAutoplay();
      }

      dragStarted = false;
    }

    function onResize() {
      setTrackPosition(false);
    }

    buildDots();
    setTrackPosition(false);
    resetAutoplay();

    btnNext.addEventListener("click", (event) => {
      if (isAnimating) {
        event.preventDefault();
        return;
      }
      nextSlide();
    });
    btnPrev.addEventListener("click", (event) => {
      if (isAnimating) {
        event.preventDefault();
        return;
      }
      prevSlide();
    });
    track.addEventListener("transitionend", onTransitionEnd);

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("lostpointercapture", onPointerUp);

    window.addEventListener("resize", onResize);

    carousel.addEventListener("mouseenter", () => clearInterval(autoplayTimer));
    carousel.addEventListener("mouseleave", resetAutoplay);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(autoplayTimer);
      } else {
        resetAutoplay();
      }
    });
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
