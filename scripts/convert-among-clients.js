/**
 * Переименовывает фото among-clients в client-XX.webp
 * Запуск: node scripts/convert-among-clients.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "img", "among-clients");
const QUALITY = 88;

function sortKey(name) {
  const match = name.match(/\((\d+)\)/);
  const num = match ? Number(match[1]) : 0;
  const duplicate = name.includes("(1)") ? 0.5 : 0;
  return num + duplicate;
}

async function main() {
  const sources = fs
    .readdirSync(DIR)
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file) && !/^client-\d+\.webp$/i.test(file))
    .sort((a, b) => sortKey(a) - sortKey(b) || a.localeCompare(b, "ru"));

  if (!sources.length) {
    console.log("No source images found in", DIR);
    return;
  }

  const written = [];

  for (let i = 0; i < sources.length; i += 1) {
    const source = sources[i];
    const target = `client-${String(i + 1).padStart(2, "0")}.webp`;
    const sourcePath = path.join(DIR, source);
    const targetPath = path.join(DIR, target);

    await sharp(sourcePath)
      .rotate()
      .webp({ quality: QUALITY })
      .toFile(targetPath);

    written.push({ source, target });
    console.log(`${source} -> ${target}`);
  }

  for (const { source } of written) {
    if (/^client-\d+\.webp$/i.test(source)) continue;
    fs.unlinkSync(path.join(DIR, source));
  }

  console.log(`Done: ${written.length} files`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
