import fs from "fs";
import path from "path";
import { PNG } from "pngjs";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");
const source = path.join(publicDir, "franja-logos-source.png");

const png = PNG.sync.read(fs.readFileSync(source));

for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i];
  const g = png.data[i + 1];
  const b = png.data[i + 2];
  if (r <= 40 && g <= 40 && b <= 40) {
    png.data[i + 3] = 0;
  }
}

const base64 = PNG.sync.write(png).toString("base64");
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${png.width} ${png.height}" role="img" aria-label="Logos institucionales UBA, FADU, Diseño, SpICC y DIS">
  <image width="${png.width}" height="${png.height}" href="data:image/png;base64,${base64}" />
</svg>
`;

fs.writeFileSync(path.join(publicDir, "franja-logos.png"), PNG.sync.write(png));
fs.writeFileSync(path.join(publicDir, "franja-logos.svg"), svg);
console.log(`Generated franja-logos at ${png.width}x${png.height}`);
