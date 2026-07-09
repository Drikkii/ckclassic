(function () {
  "use strict";

  const seo = window.CK_SEO || {};
  const siteUrl = (window.CK_SITE_CONFIG && window.CK_SITE_CONFIG.siteUrl) || seo.siteUrl || "";
  const siteName = seo.siteName || "Ск-классик";
  const defaultDescription = seo.defaultDescription || "";
  const defaultOgImage = seo.defaultOgImage || "";

  function trimDescription(text, max) {
    const limit = max || 160;
    const clean = String(text ?? "").replace(/\s+/g, " ").trim();
    if (clean.length <= limit) return clean;
    return `${clean.slice(0, limit - 1).trim()}…`;
  }

  function resolvePagePath() {
    const path = window.location.pathname || "/index.html";
    if (path.endsWith("/")) return `${path}index.html`;
    if (!path.endsWith(".html")) return path;
    return path;
  }

  function absoluteUrl(pathOrUrl) {
    if (!pathOrUrl) return "";
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const base = String(siteUrl).replace(/\/$/, "");
    const path = String(pathOrUrl).startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${base}${path}`;
  }

  function upsertMetaByName(name, content) {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function upsertMetaByProperty(property, content) {
    if (!content) return;
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function upsertCanonical(href) {
    if (!href) return;
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function upsertJsonLd(id, data) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function applySeo(config, options) {
    const opts = options || {};
    const title = config.title || document.title;
    const description = trimDescription(
      config.description || defaultDescription,
    );
    const canonical = opts.canonical || absoluteUrl(resolvePagePath());
    const ogImage = absoluteUrl(config.ogImage || defaultOgImage);
    const robots = config.robots || "";

    if (title) document.title = title;

    upsertMetaByName("description", description);
    if (robots) upsertMetaByName("robots", robots);
    upsertCanonical(canonical);

    upsertMetaByProperty("og:type", config.ogType || "website");
    upsertMetaByProperty("og:site_name", siteName);
    upsertMetaByProperty("og:locale", "ru_RU");
    upsertMetaByProperty("og:title", title);
    upsertMetaByProperty("og:description", description);
    upsertMetaByProperty("og:url", canonical);
    upsertMetaByProperty("og:image", ogImage);

    upsertMetaByName("twitter:card", "summary_large_image");
    upsertMetaByName("twitter:title", title);
    upsertMetaByName("twitter:description", description);
    upsertMetaByName("twitter:image", ogImage);
  }

  function applyHomeJsonLd() {
    if (resolvePagePath() !== "/index.html") return;

    upsertJsonLd("ck-seo-organization", {
      "@context": "https://schema.org",
      "@type": "FurnitureStore",
      name: siteName,
      url: absoluteUrl("/index.html"),
      logo: absoluteUrl(defaultOgImage),
      telephone: window.CK_SITE_CONFIG?.phoneTel || "",
      email: window.CK_SITE_CONFIG?.email || "",
      description: defaultDescription,
    });
  }

  window.CK_applyProductSeo = function (product) {
    if (!product) return;

    const title = `${product.name} — ${siteName}`;
    const description = trimDescription(
      product.description ||
        `${product.name} — модель коллекции «${product.collectionLabel || "Ск-классик"}». Купить мягкую мебель от производителя.`,
    );
    const image =
      product.gallery?.[0]?.src || product.image || defaultOgImage;
    const canonical = absoluteUrl(
      `/pages/catalog/product.html?sku=${encodeURIComponent(product.sku)}`,
    );

    applySeo(
      {
        title,
        description,
        ogImage: image,
        ogType: "product",
      },
      { canonical },
    );

    upsertJsonLd("ck-seo-product", {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      sku: product.sku,
      description,
      image: absoluteUrl(image),
      brand: {
        "@type": "Brand",
        name: siteName,
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "RUB",
        price: product.price,
        availability:
          product.isOutOfStock === true ||
          product.isOutOfStock === 1 ||
          product.isOutOfStock === "1"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        url: canonical,
      },
    });
  };

  const pagePath = resolvePagePath();
  const pageConfig = seo.pages?.[pagePath];

  if (pageConfig && !pageConfig.dynamic) {
    applySeo(pageConfig);
    applyHomeJsonLd();
  } else if (pageConfig?.dynamic) {
    applySeo(pageConfig);
  } else if (defaultDescription) {
    applySeo({
      title: document.title,
      description: defaultDescription,
    });
  }
})();
