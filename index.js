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

  function collectSlideSrcCandidates(slide) {
    const seen = new Set();
    const list = [];

    function add(raw) {
      const url = String(raw || "").trim();
      if (!url || seen.has(url)) return;
      seen.add(url);
      list.push(url);
    }

    add(slide?.src);
    if (slide?.srcset) {
      slide.srcset.split(",").forEach((part) => {
        add(part.trim().split(/\s+/)[0]);
      });
    }
    add(sliderFallbackSrc(slide?.src || ""));
    add(String(slide?.src || "").replace(/-\d+w\.webp$/i, ".webp"));

    return list;
  }

  window.__ckCarouselImgError = function (img) {
    if (!img) return;

    let candidates = [];
    try {
      candidates = JSON.parse(img.dataset.candidates || "[]");
    } catch (error) {
      candidates = [];
    }

    const attempt = Number(img.dataset.attempt || "0") + 1;
    img.dataset.attempt = String(attempt);
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");

    if (attempt < candidates.length) {
      img.src = encodeSrc(candidates[attempt]);
      return;
    }

    img.closest(".carousel__slide")?.classList.add("carousel__slide--empty");
  };

  async function loadHomeSlides() {
    const fallback =
      Array.isArray(window.HOME_SLIDES) && window.HOME_SLIDES.length
        ? window.HOME_SLIDES
        : [];

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
      const response = await fetch("api/slider.php", {
        cache: "no-store",
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      if (response.ok) {
        const payload = await response.json();
        if (Array.isArray(payload?.slides) && payload.slides.length) {
          window.HOME_SLIDES = payload.slides;
          return payload.slides;
        }
      }
    } catch (error) {
      console.warn("[slider] API unavailable", error);
    }

    return fallback;
  }

  function sliderFallbackSrc(src) {
    const value = String(src || "");
    if (/-1280w\.webp$/i.test(value)) {
      return value.replace(/-1280w\.webp$/i, "-1920w.webp");
    }
    if (/-960w\.webp$/i.test(value)) {
      return value.replace(/-960w\.webp$/i, "-1280w.webp");
    }
    return "";
  }

  async function preloadHeroSlide(slide) {
    const candidates = collectSlideSrcCandidates(slide);
    if (!candidates.length) return;

    for (const src of candidates) {
      const loaded = await new Promise((resolve) => {
        const img = new Image();
        const timer = window.setTimeout(() => resolve(false), 5000);
        img.onload = () => {
          window.clearTimeout(timer);
          resolve(true);
        };
        img.onerror = () => {
          window.clearTimeout(timer);
          resolve(false);
        };
        img.src = encodeSrc(src);
      });
      if (loaded) return;
    }
  }

  function buildCarouselFromData(data) {
    if (!Array.isArray(data) || !data.length) return false;

    function slideHtml(slide, clone, slideIndex) {
      const title = slide.useH1 ? slide.h1 || slide.title || "" : slide.title || "";
      const headingTag = slide.useH1 ? "h1" : "h2";
      const cls = clone
        ? "carousel__slide carousel__slide--clone"
        : "carousel__slide";
      const aria = clone ? ' aria-hidden="true"' : "";
      const isHero = !clone && slideIndex === 0;
      const imgAttrs = isHero
        ? 'fetchpriority="high" decoding="async"'
        : 'loading="lazy" decoding="async"';
      const srcset = slide.srcset
        ? ` srcset="${slide.srcset.split(",").map((part) => {
            const trimmed = part.trim();
            const space = trimmed.lastIndexOf(" ");
            if (space <= 0) return escapeHtml(encodeSrc(trimmed));
            const url = trimmed.slice(0, space).trim();
            const descriptor = trimmed.slice(space + 1).trim();
            return `${escapeHtml(encodeSrc(url))} ${descriptor}`;
          }).join(", ")}" sizes="(max-width: 1280px) 100vw, 1280px"`
        : "";
      const dimensions =
        slide.width && slide.height
          ? ` width="${Number(slide.width)}" height="${Number(slide.height)}"`
          : "";

      const candidates = collectSlideSrcCandidates(slide);
      const candidatesAttr = escapeHtml(JSON.stringify(candidates));
      const primarySrc = candidates[0] || slide.src || "";

      return `<li class="${cls}"${aria}>
        <img src="${encodeSrc(primarySrc)}" alt="${escapeHtml(slide.alt)}"${srcset}${dimensions} data-candidates="${candidatesAttr}" data-attempt="0" onerror="window.__ckCarouselImgError&&window.__ckCarouselImgError(this)" ${imgAttrs} />
        <div class="carousel__caption">
          <${headingTag}>${escapeHtml(title)}</${headingTag}>
          <p>${escapeHtml(slide.sub || "")}</p>
        </div>
      </li>`;
    }

    const last = data[data.length - 1];
    const first = data[0];
    track.innerHTML = [
      slideHtml(last, true, -1),
      ...data.map((slide, index) => slideHtml(slide, false, index)),
      slideHtml(first, true, -1),
    ].join("");

    return true;
  }

  loadHomeSlides()
    .then(async (data) => {
      try {
        if (!data.length) return;

        window.HOME_SLIDES = data;
        await preloadHeroSlide(data[0]);
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

    function setTrackAnimating(active) {
      track.classList.toggle("is-animating", active);
    }

    function setTrackPosition(animate) {
      const offset = -trackIndex * getSlideWidth();
      track.style.transition =
        animate && !prefersReducedMotion
          ? `transform ${TRANSITION_MS}ms ease`
          : "none";
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
      setTrackAnimating(animate && !prefersReducedMotion);
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
      setTrackAnimating(false);
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
      } finally {
        carousel.classList.remove("carousel--pending");
      }
    })
    .catch((error) => {
      console.warn("[slider] init failed", error);
      carousel.classList.remove("carousel--pending");
    });
})();
