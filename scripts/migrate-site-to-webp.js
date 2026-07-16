/**
 * Конвертирует изображения сайта в WebP и обновляет ссылки в коде.
 * Запуск: node scripts/migrate-site-to-webp.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const IMG_ROOT = path.join(ROOT, "img");
const QUALITY = 88;

const SKIP_DIRS = new Set(["node_modules", ".git", "favicon"]);
const SOURCE_EXT = /\.(jpe?g|png)$/i;

const TEXT_DIRS = ["pages", "admin", "api", "scripts"];
const TEXT_FILES = [
  "index.html",
  "404.html",
  "layout.js",
  "catalog-data.js",
  "slider-data.js",
  "seo-config.js",
  "home-catalog.js",
  "product.js",
  "shop.js",
  "shop-pages.js",
  "style.css",
  "catalog.css",
  "about.css",
];

function walkFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, list);
    } else if (SOURCE_EXT.test(entry.name)) {
      list.push(full);
    }
  }

  return list;
}

function webpPath(sourcePath) {
  return sourcePath.replace(SOURCE_EXT, ".webp");
}

async function convertImages() {
  const sources = walkFiles(IMG_ROOT);
  let converted = 0;
  let skipped = 0;

  for (const sourcePath of sources) {
    const targetPath = webpPath(sourcePath);
    const sourceStat = fs.statSync(sourcePath);
    const targetExists = fs.existsSync(targetPath);

    if (targetExists) {
      const targetStat = fs.statSync(targetPath);
      if (targetStat.mtimeMs >= sourceStat.mtimeMs) {
        skipped += 1;
        continue;
      }
    }

    await sharp(sourcePath)
      .rotate()
      .webp({ quality: QUALITY })
      .toFile(targetPath);

    converted += 1;
    console.log("converted:", path.relative(ROOT, sourcePath));
  }

  return { converted, skipped, total: sources.length };
}

function shouldSkipRefReplacement(filePath, content, index) {
  const before = content.slice(Math.max(0, index - 80), index);
  return /favicon/i.test(before);
}

function migrateImageRefs(content, filePath = "") {
  return content.replace(/\.(jpe?g|png)(?=["'?\s#&]|$)/gi, (match, _ext, index) => {
    if (shouldSkipRefReplacement(filePath, content, index)) {
      return match;
    }
    return ".webp";
  });
}

function collectTextFiles() {
  const files = new Set();

  for (const rel of TEXT_FILES) {
    const full = path.join(ROOT, rel);
    if (fs.existsSync(full)) files.add(full);
  }

  for (const dir of TEXT_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;

    const stack = [fullDir];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name)) stack.push(full);
          continue;
        }
        if (/\.(html|js|css|php|json)$/i.test(entry.name)) {
          if (/node_modules/.test(full)) continue;
          if (/migrate-site-to-webp\.js$/i.test(full)) continue;
          if (/find-unused-images\.js$/i.test(full)) continue;
          if (/optimize-slider-images\.js$/i.test(full)) continue;
          files.add(full);
        }
      }
    }
  }

  return [...files];
}

function updateTextRefs() {
  const files = collectTextFiles();
  let updated = 0;

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, "utf8");
    const next = migrateImageRefs(original, filePath);
    if (next !== original) {
      fs.writeFileSync(filePath, next, "utf8");
      updated += 1;
      console.log("updated refs:", path.relative(ROOT, filePath));
    }
  }

  return updated;
}

function removeLegacyImages() {
  const sources = walkFiles(IMG_ROOT);
  let removed = 0;

  for (const sourcePath of sources) {
    const targetPath = webpPath(sourcePath);
    if (!fs.existsSync(targetPath)) continue;

    try {
      fs.unlinkSync(sourcePath);
      removed += 1;
    } catch (error) {
      console.warn("could not remove:", path.relative(ROOT, sourcePath), error.message);
    }
  }

  return removed;
}

async function main() {
  const conversion = await convertImages();
  const refUpdates = updateTextRefs();
  const removed = removeLegacyImages();

  console.log("");
  console.log(`Images scanned: ${conversion.total}`);
  console.log(`Converted: ${conversion.converted}, already up to date: ${conversion.skipped}`);
  console.log(`Reference files updated: ${refUpdates}`);
  console.log(`Legacy sources removed: ${removed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
