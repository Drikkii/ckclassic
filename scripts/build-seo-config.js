const fs = require("fs");
const path = require("path");
const {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  pages,
} = require("./seo-data");

const ROOT = path.join(__dirname, "..");
const outPath = path.join(ROOT, "seo-config.js");

const payload = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  defaultDescription: DEFAULT_DESCRIPTION,
  defaultOgImage: DEFAULT_OG_IMAGE,
  pages,
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
