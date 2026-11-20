import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const htmlFiles = ["index.html", "admin.html"];
const cssFiles = ["assets/storefront.css", "assets/admin.css"];

function checkReference(owner, raw) {
  const value = raw.split(/[?#]/, 1)[0].trim();
  if (!value || value.startsWith("#") || /^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(value)) return;
  const target = path.resolve(root, path.dirname(owner), decodeURIComponent(value));
  if (!fs.existsSync(target)) failures.push(owner + " -> recurso local inexistente: " + raw);
}

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of source.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) checkReference(file, match[1]);
}

for (const file of cssFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const opens = (source.match(/{/g) || []).length;
  const closes = (source.match(/}/g) || []).length;
  if (opens !== closes) failures.push(file + " -> llaves CSS desbalanceadas (" + opens + "/" + closes + ")");
  for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) checkReference(file, match[1]);
}

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const ids = [...source.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) failures.push(file + " -> IDs duplicados: " + [...new Set(duplicates)].join(", "));
}

for (const file of ["assets/storefront.js", "assets/admin.js", "assets/motion.js", "assets/config.js", "backend/functions/image-signer/index.mjs"]) {
  if (!fs.existsSync(path.join(root, file))) failures.push("Falta archivo requerido: " + file);
}

if (failures.length) {
  console.error("Validación estática LAU'S: FALLÓ");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("Validación estática LAU'S: OK (rutas HTML/CSS, llaves CSS e IDs únicos).");
