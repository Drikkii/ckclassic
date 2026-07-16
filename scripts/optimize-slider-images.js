/**
 * Конвертирует PNG из img/slider в WebP и обновляет slider-data.js.
 * Запуск: npm install sharp --no-save && node scripts/optimize-slider-images.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SLIDER_DIR = path.join(ROOT, "img", "slider");
const SRCSET_WIDTHS = [640, 960, 1280];
const QUALITY = 80;

const SLIDES = [
  {
    base: "divan_classika",
    alt: "Классические диваны Ск-классик в интерьере",
    title: "Мягкая мебель Ск-классик",
    sub: "Собственное производство · доставка по России",
    useH1: true,
    h1: "Мягкая мебель Ск-классик",
  },
  {
    base: "divan_v_moskve_",
    alt: "Диваны в Москве — мебельная фабрика Ск-классик",
    title: "Диваны в Москве",
    sub: "Производство и доставка по Москве и области",
    useH1: false,
    h1: "",
  },
  {
    base: "divan_classika_na_zakaz",
    alt: "Классические диваны на заказ",
    title: "Классика на заказ",
    sub: "Индивидуальные размеры и отделка",
    useH1: false,
    h1: "",
  },
  {
    base: "divan_barocco",
    alt: "Диваны в стиле барокко",
    title: "Диваны в стиле барокко",
    sub: "Роскошная классическая мягкая мебель",
    useH1: false,
    h1: "",
  },
];

function findSource(sliderDir, base) {
  const candidates = [
    `${base}-1920w.png`,
    `${base}-1920w.webp`,
    `${base}.png`,
    `${base}.webp`,
  ];
  for (const name of candidates) {
    const full = path.join(sliderDir, name);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

async function saveWebp(inputPath, outputPath, width = 0) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const sameFile = path.resolve(inputPath) === path.resolve(outputPath);
  let pipeline = sharp(sameFile ? fs.readFileSync(inputPath) : inputPath);
  if (width > 0) {
    pipeline = pipeline.resize({
      width,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const info = await pipeline.webp({ quality: QUALITY, effort: 6 }).toFile(outputPath);
  return {
    relative: "img/slider/" + path.basename(outputPath),
    width: info.width,
    height: info.height,
  };
}

async function buildVariants(slide) {
  const source = findSource(SLIDER_DIR, slide.base);
  if (!source) {
    throw new Error(`Нет файла для слайда: ${slide.base}`);
  }

  const meta = await sharp(source).metadata();
  const sourceWidth = meta.width || 0;
  const variants = new Map();

  for (const width of SRCSET_WIDTHS) {
    if (sourceWidth < width) continue;
    const filename = `${slide.base}-${width}w.webp`;
    const outputPath = path.join(SLIDER_DIR, filename);
    if (path.resolve(source) === path.resolve(outputPath)) {
      variants.set(width, {
        relative: "img/slider/" + filename,
        width: sourceWidth,
        height: meta.height || 0,
      });
      console.log(`  ${slide.base}: ${filename} (без изменений, ${sourceWidth}x${meta.height})`);
      continue;
    }
    const saved = await saveWebp(source, outputPath, width);
    variants.set(width, saved);
    console.log(
      `  ${slide.base}: ${path.basename(source)} → ${filename} (${saved.width}x${saved.height})`,
    );
  }

  if (!variants.size) {
    const filename = `${slide.base}.webp`;
    const outputPath = path.join(SLIDER_DIR, filename);
    const saved = await saveWebp(source, outputPath);
    variants.set(saved.width, saved);
  }

  return variants;
}

function buildSlide(slide, variants) {
  const items = [...variants.values()].sort((a, b) => a.width - b.width);
  const preferred =
    items.find((item) => item.width === 1280) ||
    items.find((item) => item.width === 960) ||
    items[items.length - 1];
  const srcset = items.map((item) => `${item.relative} ${item.width}w`).join(", ");

  return {
    src: preferred.relative,
    srcset,
    width: preferred.width,
    height: preferred.height,
    alt: slide.alt,
    title: slide.title,
    sub: slide.sub,
    useH1: slide.useH1,
    h1: slide.h1,
  };
}

async function main() {
  fs.mkdirSync(SLIDER_DIR, { recursive: true });
  console.log("Обработка слайдера:");
  const exported = [];

  for (const slide of SLIDES) {
    const variants = await buildVariants(slide);
    exported.push(buildSlide(slide, variants));
  }

  for (const name of fs.readdirSync(SLIDER_DIR)) {
    if (/\.png$/i.test(name)) {
      fs.unlinkSync(path.join(SLIDER_DIR, name));
      console.log(`  удалён PNG: ${name}`);
    }
  }

  const content =
    "window.HOME_SLIDES = " + JSON.stringify(exported, null, 2) + ";\n";
  fs.writeFileSync(path.join(ROOT, "slider-data.js"), content, "utf8");
  console.log(`\nГотово: ${exported.length} слайда, slider-data.js обновлён.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
