/**
 * Находит изображения, на которые нет ссылок в коде/данных сайта.
 * Запуск: node scripts/find-unused-images.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IMAGE_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
  ".avif",
]);
const SCAN_EXT = new Set([
  ".html",
  ".js",
  ".php",
  ".css",
  ".json",
  ".webmanifest",
  ".xml",
]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "vendor",
]);

function walkFiles(dir, filter, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, filter, out);
      continue;
    }
    if (filter(full)) out.push(full);
  }
  return out;
}

function normalizeRef(value) {
  let ref = value.replace(/\\/g, "/");
  ref = ref.replace(/^(\.\.\/)+/, "");
  ref = ref.replace(/^\/+/, "");
  ref = decodeURIComponent(ref.split("?")[0].split("#")[0]);
  return ref.toLowerCase();
}

function collectImageFiles() {
  return walkFiles(ROOT, (file) => IMAGE_EXT.has(path.extname(file).toLowerCase()));
}

function collectTextFiles() {
  return walkFiles(ROOT, (file) => SCAN_EXT.has(path.extname(file).toLowerCase()));
}

function addRef(set, raw) {
  if (!raw || raw.length < 4) return;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (url.hostname.includes("mebel-sk-classic.ru") || url.pathname.startsWith("/")) {
        addRef(set, url.pathname.replace(/^\/+/, ""));
      }
    } catch {
      /* ignore */
    }
    return;
  }
  if (raw.startsWith("data:")) return;
  const normalized = normalizeRef(raw);
  if (
    normalized.startsWith("img/") ||
    normalized.startsWith("favicon/") ||
    normalized.endsWith(".ico")
  ) {
    set.add(normalized);
  }
}

function extractRefsFromContent(content) {
  const refs = [];
  const patterns = [
    /(?:src|href|content|poster)\s*=\s*["']([^"']+\.(?:jpe?g|png|webp|gif|svg|ico|avif))(?:\?[^"']*)?["']/gi,
    /["']((?:\.\.\/)*img\/[^"']+\.(?:jpe?g|png|webp|gif|svg|ico|avif))(?:\?[^"']*)?["']/gi,
    /["']((?:\.\.\/)*favicon\/[^"']+\.(?:jpe?g|png|webp|gif|svg|ico|avif))(?:\?[^"']*)?["']/gi,
    /["'](img\/[^"']+\.(?:jpe?g|png|webp|gif|svg|ico|avif))(?:\?[^"']*)?["']/gi,
    /url\(\s*["']?([^"')]+\.(?:jpe?g|png|webp|gif|svg|ico|avif))(?:\?[^"')]*)?["']?\s*\)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      refs.push(match[1]);
    }
  }

  // srcset: "path 1280w, path 1920w"
  const srcsetPattern = /srcset\s*=\s*["']([^"']+)["']/gi;
  let srcsetMatch;
  while ((srcsetMatch = srcsetPattern.exec(content)) !== null) {
    for (const part of srcsetMatch[1].split(",")) {
      const url = part.trim().split(/\s+/)[0];
      if (url) refs.push(url);
    }
  }

  // JSON "src": "..." and "image": "..."
  const jsonSrcPattern = /"(?:src|image)"\s*:\s*"([^"]+\.(?:jpe?g|png|webp|gif|svg|ico|avif))"/gi;
  let jsonMatch;
  while ((jsonMatch = jsonSrcPattern.exec(content)) !== null) {
    refs.push(jsonMatch[1]);
  }

  const jsonSrcsetPattern = /"srcset"\s*:\s*"([^"]+)"/gi;
  let jsonSrcsetMatch;
  while ((jsonSrcsetMatch = jsonSrcsetPattern.exec(content)) !== null) {
    for (const part of jsonSrcsetMatch[1].split(",")) {
      const url = part.trim().split(/\s+/)[0];
      if (url) refs.push(url);
    }
  }

  // web manifest root icon paths
  const manifestIconPattern = /"src"\s*:\s*"(\/[^"]+\.(?:png|svg|webp|ico))"/gi;
  let manifestMatch;
  while ((manifestMatch = manifestIconPattern.exec(content)) !== null) {
    const raw = manifestMatch[1].replace(/^\/+/, "");
    refs.push(raw);
    refs.push(`favicon/${path.basename(raw)}`);
  }

  return refs;
}

function buildReferencedSet(textFiles) {
  const refs = new Set();
  for (const file of textFiles) {
    const content = fs.readFileSync(file, "utf8");
    for (const raw of extractRefsFromContent(content)) {
      addRef(refs, raw);
    }
  }
  return refs;
}

function relPath(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function isReferenced(file, refs) {
  const rel = relPath(file).toLowerCase();
  if (refs.has(rel)) return true;

  const decoded = decodeURIComponent(rel);
  if (refs.has(decoded.toLowerCase())) return true;

  const basename = path.basename(rel);
  for (const ref of refs) {
    if (ref.endsWith("/" + basename) || ref === basename) return true;
    if (path.basename(ref) === basename) return true;
  }

  return false;
}

function main() {
  const images = collectImageFiles();
  const textFiles = collectTextFiles().filter(
    (file) => !file.includes(`${path.sep}scripts${path.sep}find-unused-images.js`),
  );
  const refs = buildReferencedSet(textFiles);

  const unused = [];
  const used = [];

  for (const file of images) {
    if (isReferenced(file, refs)) {
      used.push(file);
    } else {
      unused.push(file);
    }
  }

  unused.sort();
  used.sort();

  const reportPath = path.join(ROOT, "scripts", "unused-images-report.txt");
  const lines = [
    `Referenced: ${used.length}`,
    `Unused: ${unused.length}`,
    "",
    "=== UNUSED ===",
    ...unused.map((f) => relPath(f)),
  ];
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");

  console.log(`Referenced: ${used.length}`);
  console.log(`Unused: ${unused.length}`);
  console.log(`Report: scripts/unused-images-report.txt`);
  for (const file of unused.slice(0, 30)) {
    console.log("  " + relPath(file));
  }
  if (unused.length > 30) {
    console.log(`  ... and ${unused.length - 30} more`);
  }

  return unused;
}

if (require.main === module) {
  main();
}

module.exports = { main, buildReferencedSet, collectImageFiles };
