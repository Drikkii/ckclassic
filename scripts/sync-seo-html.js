const fs = require("fs");
const path = require("path");
const {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  GOOGLE_SITE_VERIFICATION,
  YANDEX_SITE_VERIFICATION,
  YANDEX_METRIKA_ID,
  getPageKeywords,
  pages,
} = require("./seo-data");
const { renderSeoHead, buildCanonical } = require("./seo-meta");

const ROOT = path.join(__dirname, "..");

const SEO_BLOCK_START = "<!-- ck-seo:start -->";
const SEO_BLOCK_END = "<!-- ck-seo:end -->";

function walkHtmlFiles(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(full, list);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      list.push(full);
    }
  }
  return list;
}

function pageKeyFromFile(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  return `/${rel}`;
}

function scriptPrefixFromFile(filePath) {
  const relDir = path.relative(ROOT, path.dirname(filePath));
  if (!relDir) return "";
  const depth = relDir.split(path.sep).filter(Boolean).length;
  return "../".repeat(depth);
}

const METRIKA_START = "<!-- Yandex.Metrika counter -->";
const METRIKA_END = "<!-- /Yandex.Metrika counter -->";

function buildMetrikaBlock(id) {
  return `${METRIKA_START}
    <script type="text/javascript">
      (function (m, e, t, r, i, k, a) {
        m[i] =
          m[i] ||
          function () {
            (m[i].a = m[i].a || []).push(arguments);
          };
        m[i].l = 1 * new Date();
        for (var j = 0; j < document.scripts.length; j++) {
          if (document.scripts[j].src === r) {
            return;
          }
        }
        k = e.createElement(t);
        a = e.getElementsByTagName(t)[0];
        k.async = 1;
        k.src = r;
        a.parentNode.insertBefore(k, a);
      })(
        window,
        document,
        "script",
        "https://mc.yandex.ru/metrika/tag.js?id=${id}",
        "ym",
      );

      ym(${id}, "init", {
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        referrer: document.referrer,
        url: location.href,
        accurateTrackBounce: true,
        trackLinks: true,
      });
    </script>
    <noscript
      ><div>
        <img
          src="https://mc.yandex.ru/watch/${id}"
          style="position: absolute; left: -9999px"
          alt=""
        /></div
    ></noscript>
${METRIKA_END}`;
}

function ensureMetrikaScript(content, prefix) {
  const tag = `<script src="${prefix}metrika.js" defer></script>`;
  if (content.includes("metrika.js")) {
    return content;
  }

  if (content.includes(`${prefix}site-config.js`)) {
    return content.replace(
      new RegExp(`(<script src="${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}site-config\\.js" defer><\\/script>)`),
      `$1\n    ${tag}`,
    );
  }

  return content.replace("</body>", `    ${tag}\n  </body>`);
}

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant:wght@400;600&family=Inter:wght@400;500;600&display=swap";

const SYNC_FONTS_BLOCK = `<link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="${FONT_URL}"
    />`;

const CRITICAL_CSS_MARKER = "<!-- ck-critical -->";
const CRITICAL_CSS = `${CRITICAL_CSS_MARKER}
    <style>
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      :root{--font-main:"Cormorant",Georgia,"Times New Roman",serif;--font-ui:"Inter",system-ui,sans-serif;--header-height:10rem;--color-bg:#fbf7ef;--color-bg-alt:#f3ece0;--color-text:#2a2520;--color-muted:#6b635a}
      body{overflow-x:hidden;font-family:var(--font-ui);font-weight:400;color:var(--color-text);background:var(--color-bg);padding-top:var(--header-height);line-height:1.5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
      img{display:block;max-width:100%}
      .container{max-width:1680px;margin:0 auto;padding:0 20px}
      .header{z-index:1000;position:fixed;top:0;left:0;width:100%;background:var(--color-bg);box-shadow:0 1px 0 rgba(0,0,0,.06)}
      .main{min-height:50vh}
    </style>`;

function asyncStylesheetBlock(href) {
  return `<link
      rel="stylesheet"
      href="${href}"
      media="print"
      onload="this.media='all'"
    />
    <noscript><link rel="stylesheet" href="${href}" /></noscript>`;
}

function repairBrokenAsyncCss(content) {
  content = content.replace(
    /<noscript>\s*<!-- ck-critical -->[\s\S]*?<\/style>\s*\n<link rel="stylesheet" href="([^"]+)" \/><\/noscript>/g,
    `${CRITICAL_CSS}\n    <noscript><link rel="stylesheet" href="$1" /></noscript>`,
  );

  content = content.replace(
    /<noscript><link[\s\S]*?href="([^"]+\.css)"[\s\S]*?<noscript><link rel="stylesheet" href="\1" \/><\/noscript><\/noscript>/g,
    '<noscript><link rel="stylesheet" href="$1" /></noscript>',
  );

  return content;
}

function ensureCriticalCss(content) {
  if (
    content.includes(CRITICAL_CSS_MARKER) ||
    content.includes(".carousel--pending") ||
    content.includes("home-new__grid")
  ) {
    return content;
  }

  if (content.includes(CRITICAL_CSS_MARKER)) {
    return content;
  }

  return content.replace(
    /(<\/noscript>\s*\n)(    <link\s+\n      rel="stylesheet")/,
    `$1${CRITICAL_CSS}\n$2`,
  );
}

function ensureAsyncStylesheets(content) {
  return content.replace(
    /^(\s*)<link rel="stylesheet" href="([^"]+\.css)" \/>$/gm,
    (match, indent, href) => {
      if (href.includes("fonts.googleapis.com")) return match;
      return `${indent}${asyncStylesheetBlock(href).replace(/\n/g, `\n${indent}`)}`;
    },
  );
}

function ensureSyncFonts(content) {
  let next = content.replace(/display=optional/g, "display=swap");

  const fontsSectionRe =
    /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>[\s\S]*?(?:fonts\.googleapis\.com\/css2[\s\S]*?)(?=\n\s*(?:<!-- ck-critical -->|<style|<link\s+\n\s*rel="stylesheet"|<link rel="stylesheet"|<link rel="icon"))/;

  if (fontsSectionRe.test(next)) {
    next = next.replace(fontsSectionRe, `${SYNC_FONTS_BLOCK}\n`);
  }

  return ensureAsyncStylesheets(next);
}

function removeOldMetrika(content) {
  const blockRe = new RegExp(
    `${METRIKA_START}[\\s\\S]*?${METRIKA_END}\\s*`,
    "m",
  );
  return content.replace(blockRe, "");
}

function ensureMetrika(content) {
  if (!YANDEX_METRIKA_ID) {
    return content;
  }

  return removeOldMetrika(content);
}

function buildSeoBlock(page) {
  const canonical = buildCanonical(SITE_URL, page.path);
  return `${SEO_BLOCK_START}
${renderSeoHead({
  title: page.title,
  description: page.description,
  keywords: page.keywords,
  canonical,
  robots: page.robots,
  ogImage: page.ogImage || DEFAULT_OG_IMAGE,
  siteName: SITE_NAME,
  ogType: page.ogType || "website",
}).trimEnd()}
${SEO_BLOCK_END}`;
}

function removeOldSeo(content) {
  const blockRe = new RegExp(
    `${SEO_BLOCK_START}[\\s\\S]*?${SEO_BLOCK_END}\\s*`,
    "m",
  );
  let next = content.replace(blockRe, "");

  next = next.replace(/^\s*<meta name="description"[\s\S]*?\/>\s*/m, "");
  next = next.replace(/^\s*<meta name="keywords"[\s\S]*?\/>\s*/m, "");
  next = next.replace(/^\s*<meta name="robots"[\s\S]*?\/>\s*/m, "");
  next = next.replace(/^\s*<link rel="canonical"[\s\S]*?\/>\s*/m, "");
  next = next.replace(/^\s*<meta property="og:[^"]+"[\s\S]*?\/>\s*/gm, "");
  next = next.replace(/^\s*<meta name="twitter:[^"]+"[\s\S]*?\/>\s*/gm, "");

  return next;
}

function ensureScripts(content, prefix) {
  let next = content;
  const seoConfigTag = `<script src="${prefix}seo-config.js" defer></script>`;
  const seoTag = `<script src="${prefix}seo.js" defer></script>`;

  if (!next.includes("seo-config.js")) {
    next = next.replace(
      /(<script src="[^"]*site-config\.js" defer><\/script>)/,
      `$1\n    ${seoConfigTag}`,
    );
    if (!next.includes("seo-config.js")) {
      next = next.replace("</head>", `    ${seoConfigTag}\n  </head>`);
    }
  }

  if (!next.includes('src="' + prefix + 'seo.js"')) {
    next = next.replace(
      /(<script src="[^"]*seo-config\.js" defer><\/script>)/,
      `$1\n    ${seoTag}`,
    );
  }

  return next;
}

function ensureSiteVerifications(content, key) {
  if (key !== "/index.html") {
    return content;
  }

  const tags = [];
  if (GOOGLE_SITE_VERIFICATION) {
    tags.push({
      name: "google-site-verification",
      content: GOOGLE_SITE_VERIFICATION,
    });
  }
  if (YANDEX_SITE_VERIFICATION) {
    tags.push({
      name: "yandex-verification",
      content: YANDEX_SITE_VERIFICATION,
    });
  }

  let next = content;
  for (const tag of tags) {
    const meta = `<meta name="${tag.name}" content="${tag.content}" />`;
    const pattern = new RegExp(
      `<meta name="${tag.name}" content="[^"]*" \\/>`,
    );
    if (pattern.test(next)) {
      next = next.replace(pattern, meta);
    } else {
      next = next.replace(
        /(<meta name="viewport" content="width=device-width, initial-scale=1\.0" \/>)/,
        `$1\n    ${meta}`,
      );
    }
  }

  return next;
}

function syncFile(filePath) {
  const key = pageKeyFromFile(filePath);
  const config = pages[key];
  const prefix = scriptPrefixFromFile(filePath);
  let content = fs.readFileSync(filePath, "utf8");
  content = repairBrokenAsyncCss(content);
  content = ensureMetrika(content);
  content = ensureSyncFonts(content);
  content = ensureCriticalCss(content);
  content = ensureMetrikaScript(content, prefix);

  if (!config) {
    fs.writeFileSync(filePath, content, "utf8");
    console.warn("METRIKA ONLY (no SEO config):", key);
    return;
  }

  content = removeOldSeo(content);

  const page = {
    path: key,
    title: config.title,
    description: config.description,
    keywords: getPageKeywords(key, config),
    robots: config.robots,
    ogImage: config.ogImage,
    ogType: config.ogType,
  };

  const seoBlock = buildSeoBlock(page);

  if (!/<title>[^<]+<\/title>/.test(content)) {
    console.warn("SKIP (no title):", key);
    return;
  }

  content = content.replace(
    /(<title>)[^<]+(<\/title>)/,
    `$1${page.title}$2`,
  );

  content = content.replace(
    /(<title>[^<]+<\/title>)/,
    `$1\n${seoBlock}`,
  );

  content = ensureScripts(content, prefix);
  content = ensureSiteVerifications(content, key);
  fs.writeFileSync(filePath, content, "utf8");
  console.log("OK", key);
}

const htmlFiles = walkHtmlFiles(ROOT).filter(
  (file) =>
    !file.includes(`${path.sep}admin${path.sep}`) &&
    !file.includes(`${path.sep}node_modules${path.sep}`),
);

for (const file of htmlFiles) {
  syncFile(file);
}

console.log(`Synced ${htmlFiles.length} HTML files.`);
