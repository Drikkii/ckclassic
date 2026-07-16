/**
 * Сжимает крупные WebP слайдера для мобильной загрузки.
 * Запуск: node scripts/recompress-slider.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SLIDER_DIR = path.join(__dirname, "..", "img", "slider");
const MAX_KB = 150;
const QUALITY = 80;

async function main() {
  const files = fs
    .readdirSync(SLIDER_DIR)
    .filter((name) => /-\d+w\.webp$/i.test(name))
    .map((name) => path.join(SLIDER_DIR, name));

  for (const filePath of files) {
    const sizeKb = fs.statSync(filePath).size / 1024;
    if (sizeKb <= MAX_KB) continue;

    const tempPath = `${filePath}.tmp`;
    await sharp(filePath).webp({ quality: QUALITY, effort: 6 }).toFile(tempPath);
    fs.renameSync(tempPath, filePath);
    const nextKb = fs.statSync(filePath).size / 1024;
    console.log(`${path.basename(filePath)}: ${sizeKb.toFixed(0)} KB -> ${nextKb.toFixed(0)} KB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
