import fs from "fs";
import path from "path";
import { PNG } from "pngjs";

const publicDir = path.join(path.resolve(import.meta.dirname, ".."), "public", "franja-logos");

/** Solo quita el fondo negro; no altera píxeles del logo blanco. */
function makeBlackTransparent(png) {
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    if (r <= 35 && g <= 35 && b <= 35) {
      png.data[i + 3] = 0;
    }
  }
  return png;
}

for (let n = 1; n <= 5; n++) {
  const source = path.join(publicDir, `${n}-source.png`);
  if (!fs.existsSync(source)) {
    console.error(`Falta ${source}`);
    process.exit(1);
  }
  const png = PNG.sync.read(fs.readFileSync(source));
  makeBlackTransparent(png);
  fs.writeFileSync(path.join(publicDir, `${n}.png`), PNG.sync.write(png));
  console.log(`OK ${n}.png ${png.width}x${png.height}`);
}
