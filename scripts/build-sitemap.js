const fs = require("fs");
const path = require("path");
const { SITE_URL, pages } = require("./seo-data");

const ROOT = path.join(__dirname, "..");
const today = new Date().toISOString().slice(0, 10);

const urls = Object.entries(pages)
  .filter(([, config]) => config.robots !== "noindex, follow" && !config.dynamic)
  .map(([pagePath]) => {
    const loc = `${SITE_URL.replace(/\/$/, "")}${pagePath}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${pagePath === "/index.html" ? "1.0" : "0.8"}</priority>\n  </url>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
console.log("Wrote sitemap.xml with", Object.keys(pages).length - 3, "URLs");
