const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const unused = fs
  .readFileSync(path.join(__dirname, "unused-images-report.txt"), "utf8")
  .split("\n")
  .filter((line) => line.startsWith("img/") || line.startsWith("favicon/"));

let deleted = 0;
let bytes = 0;
const errors = [];

for (const rel of unused) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  try {
    const size = fs.statSync(file).size;
    fs.unlinkSync(file);
    deleted += 1;
    bytes += size;
  } catch (error) {
    errors.push(`${rel}: ${error.message}`);
  }
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) removeEmptyDirs(full);
  }
  if (dir === path.join(ROOT, "img")) return;
  if (dir === path.join(ROOT, "favicon")) return;
  if (fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}

removeEmptyDirs(path.join(ROOT, "img"));
removeEmptyDirs(path.join(ROOT, "favicon"));

console.log(`Deleted: ${deleted} files (${Math.round(bytes / 1024 / 1024)} MB)`);
if (errors.length) {
  console.log("Errors:");
  errors.forEach((line) => console.log("  " + line));
}
