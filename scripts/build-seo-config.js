const fs = require("fs");
const path = require("path");
const {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  buildMetaKeywords,
  getPageKeywords,
  pages,
} = require("./seo-data");

const ROOT = path.join(__dirname, "..");
const outPath = path.join(ROOT, "seo-config.js");

const seoPages = Object.fromEntries(
  Object.entries(pages).map(([path, config]) => [
    path,
    {
      ...config,
      keywords: getPageKeywords(path, config),
    },
  ]),
);

const payload = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  defaultDescription: DEFAULT_DESCRIPTION,
  defaultOgImage: DEFAULT_OG_IMAGE,
  defaultKeywords: buildMetaKeywords(),
  pages: seoPages,
};

const file = `(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CK_SEO = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return ${JSON.stringify(payload, null, 2)};
});
`;

fs.writeFileSync(outPath, file, "utf8");
console.log("Wrote seo-config.js from scripts/seo-data.js");
