/**
 * Превью 480px в img/thumbs-480/ + карта image-thumbs.js
 * Запуск: node scripts/generate-catalog-thumbs.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const THUMBS_DIR = path.join(ROOT, "img", "thumbs-480");
const MAP_FILE = path.join(ROOT, "image-thumbs.js");
const CATALOG_DATA = path.join(ROOT, "catalog-data.js");
const CARD_WIDTH = 480;
const QUALITY = 78;

const SKIP_DIRS = new Set(["thumbs-480", "slider"]);

function thumbId(relativePath) {
  return crypto.createHash("sha1").update(relativePath).digest("hex").slice(0, 12);
}

function normalizeKey(relativePath) {
  return relativePath.replace(/\\/g, "/");
}

function addPath(set, value) {
  if (!value || !/\.webp$/i.test(value)) return;
  const relative = normalizeKey(
    decodeURIComponent(String(value).replace(/^\.\.\/\.\.\//, "").trim()),
  );
  if (relative.startsWith("img/")) {
    set.add(relative);
  }
}

function collectFromCatalog(set) {
  const source = fs.readFileSync(CATALOG_DATA, "utf8");
  const matches = source.match(/"(?:image|src)":\s*"([^"]+)"/g) || [];
  for (const match of matches) {
    addPath(set, match.replace(/^"(?:image|src)":\s*"/, "").replace(/"$/, ""));
  }
}

function collectFromHtml(set, filePath) {
  if (!fs.existsSync(filePath)) return;
  const html = fs.readFileSync(filePath, "utf8");
  const matches = html.match(/src="(\.\.\/[^"]+\.webp)"/gi) || [];
  for (const match of matches) {
    const value = match.replace(/^src="/i, "").replace(/"$/, "");
    addPath(set, value.replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, ""));
  }
}

function collectFromDir(set, dirRelative) {
  const abs = path.join(ROOT, dirRelative);
  if (!fs.existsSync(abs)) return;

  const stack = [abs];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push(full);
        continue;
      }
      if (/\.webp$/i.test(entry.name) && !/-480w\.webp$/i.test(entry.name)) {
        set.add(normalizeKey(path.relative(ROOT, full)));
      }
    }
  }
}

function collectAllSources() {
  const set = new Set();
  collectFromCatalog(set);
  collectFromDir(set, "img/about");
  collectFromDir(set, "img/among-clients");
  collectFromHtml(set, path.join(ROOT, "pages", "works.html"));
  collectFromHtml(set, path.join(ROOT, "pages", "about", "business.html"));
  collectFromHtml(set, path.join(ROOT, "pages", "about", "history.html"));
  collectFromHtml(set, path.join(ROOT, "pages", "about", "contacts.html"));
  collectFromHtml(set, path.join(ROOT, "pages", "works.html"));
  return [...set].sort();
}

async function ensureThumb(relativePath) {
  const sourcePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(sourcePath)) {
    console.warn("skip missing:", relativePath);
    return null;
  }

  const id = thumbId(relativePath);
  const thumbRelative = `img/thumbs-480/${id}.webp`;
  const thumbPath = path.join(ROOT, thumbRelative);
  const sourceStat = fs.statSync(sourcePath);

  if (fs.existsSync(thumbPath)) {
    const thumbStat = fs.statSync(thumbPath);
    if (thumbStat.mtimeMs >= sourceStat.mtimeMs) {
      return { key: relativePath, thumb: thumbRelative };
    }
  }

  await sharp(sourcePath)
    .rotate()
    .resize({
      width: CARD_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(thumbPath);

  const before = Math.round(sourceStat.size / 1024);
  const after = Math.round(fs.statSync(thumbPath).size / 1024);
  console.log(`${relativePath} -> ${thumbRelative} (${before} KB -> ${after} KB)`);
  return { key: relativePath, thumb: thumbRelative };
}

function removeLegacyThumbs() {
  const stack = [path.join(ROOT, "img")];
  let removed = 0;

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "thumbs-480") continue;
        stack.push(full);
        continue;
      }
      if (/-480w\.webp$/i.test(entry.name)) {
        fs.unlinkSync(full);
        removed += 1;
      }
    }
  }

  return removed;
}

function writeMap(entries) {
  const map = Object.fromEntries(entries.map(({ key, thumb }) => [key, thumb]));
  const content = `window.CK_IMAGE_THUMBS = ${JSON.stringify(map, null, 2)};\n`;
  fs.writeFileSync(MAP_FILE, content, "utf8");
}

async function main() {
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
  const sources = collectAllSources();
  const entries = [];

  for (const relativePath of sources) {
    const result = await ensureThumb(relativePath);
    if (result) entries.push(result);
  }

  writeMap(entries);
  const removed = removeLegacyThumbs();

  console.log("");
  console.log(`Sources: ${sources.length}`);
  console.log(`Map entries: ${entries.length}`);
  console.log(`Legacy *-480w.webp removed: ${removed}`);
  console.log(`Written: ${path.relative(ROOT, MAP_FILE)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
