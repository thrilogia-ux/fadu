import fs from "fs";
import path from "path";
import { PNG } from "pngjs";

/**
 * Opcional: regenera PNG desde source si recibís un raster nuevo.
 * El footer usa franja-logos.svg (vector) para máxima nitidez.
 */
const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");
const source = path.join(publicDir, "franja-logos-source.png");

if (!fs.existsSync(source)) {
  console.log("Sin franja-logos-source.png; el footer usa el SVG vectorial.");
  process.exit(0);
}

const png = PNG.sync.read(fs.readFileSync(source));

for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i];
  const g = png.data[i + 1];
  const b = png.data[i + 2];
  if (r <= 40 && g <= 40 && b <= 40) {
    png.data[i + 3] = 0;
  }
}

fs.writeFileSync(path.join(publicDir, "franja-logos.png"), PNG.sync.write(png));
console.log(`Generated franja-logos.png at ${png.width}x${png.height} (fallback raster)`);
