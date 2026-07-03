const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const htmlFiles = [
  path.join(ROOT, "index.html"),
  ...fs.readdirSync(path.join(ROOT, "pages", "catalog")).map((f) =>
    path.join(ROOT, "pages", "catalog", f),
  ),
];

const bad = [];
for (const file of htmlFiles) {
  if (!file.endsWith(".html")) continue;
  const html = fs.readFileSync(file, "utf8");
  const re = /img src="(img\/photo-mebeli[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const rel = decodeURIComponent(m[1].replace("img/photo-mebeli/", ""));
    const full = path.join(ROOT, "img", "photo-mebeli", rel);
    if (!fs.existsSync(full)) bad.push({ file: path.basename(file), rel });
  }
}
console.log("broken:", bad.length);
bad.forEach((b) => console.log(b.file, "->", b.rel));
