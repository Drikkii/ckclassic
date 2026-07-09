const fs = require("fs");
const path = require("path");
const {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  GOOGLE_SITE_VERIFICATION,
  YANDEX_SITE_VERIFICATION,
  YANDEX_METRIKA_ID,
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

  let next = removeOldMetrika(content);
  const block = buildMetrikaBlock(YANDEX_METRIKA_ID);

  if (next.includes(METRIKA_START)) {
    return next;
  }

  return next.replace(
    /(<meta charset="UTF-8" \/>)/,
    `$1\n    ${block}`,
  );
}

function buildSeoBlock(page) {
  const canonical = buildCanonical(SITE_URL, page.path);
  return `${SEO_BLOCK_START}
${renderSeoHead({
  title: page.title,
  description: page.description,
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
  content = ensureMetrika(content);

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
  (file) => !file.includes(`${path.sep}admin${path.sep}`),
);

for (const file of htmlFiles) {
  syncFile(file);
}

console.log(`Synced ${htmlFiles.length} HTML files.`);
