const fs = require("fs");
const unused = new Set(
  fs
    .readFileSync("scripts/unused-images-report.txt", "utf8")
    .split("\n")
    .filter((line) => line.startsWith("img/") || line.startsWith("favicon/")),
);

function checkFile(contentPath, pattern) {
  const content = fs.readFileSync(contentPath, "utf8");
  const missing = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    let ref = match[1].replace(/^(\.\.\/)+/, "");
    try {
      ref = decodeURIComponent(ref);
    } catch {
      /* ignore */
    }
    ref = ref.replace(/\\/g, "/").toLowerCase();
    if (unused.has(ref)) missing.push(ref);
  }
  return missing;
}

const catalogMissing = checkFile(
  "catalog-data.js",
  /"src":\s*"([^"]+)"/g,
);
const sliderMissing = checkFile(
  "slider-data.js",
  /"(?:src|srcset)":\s*"([^"]+)"/g,
);

console.log("Catalog refs wrongly unused:", catalogMissing.length);
if (catalogMissing.length) console.log(catalogMissing.slice(0, 5).join("\n"));

for (const slide of sliderMissing) {
  if (slide.includes(",")) {
    for (const part of slide.split(",")) {
      const url = part.trim().split(/\s+/)[0].toLowerCase();
      if (unused.has(url)) console.log("Slider unused:", url);
    }
  } else if (unused.has(slide.toLowerCase())) {
    console.log("Slider unused:", slide);
  }
}
