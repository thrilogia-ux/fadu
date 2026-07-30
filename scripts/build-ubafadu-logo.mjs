import fs from "fs";
import path from "path";
import { PNG } from "pngjs";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");
const source = path.join(
  publicDir,
  "ubafadushop-logo-source.png"
);

function loadPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function writePng(filePath, png) {
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function clonePng(png) {
  const copy = new PNG({ width: png.width, height: png.height });
  png.data.copy(copy.data);
  return copy;
}

function makeBackgroundTransparent(png, threshold = 40) {
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    if (r <= threshold && g <= threshold && b <= threshold) {
      png.data[i + 3] = 0;
    }
  }
}

function toGrayLogo(png) {
  for (let i = 0; i < png.data.length; i += 4) {
    const alpha = png.data[i + 3];
    if (alpha === 0) continue;
    const gray = Math.round(
      png.data[i] * 0.299 + png.data[i + 1] * 0.587 + png.data[i + 2] * 0.114
    );
    const target = Math.round(gray * 0.45 + 96 * 0.55);
    png.data[i] = target;
    png.data[i + 1] = target;
    png.data[i + 2] = target;
  }
}

function writeEmbeddedSvg(filePath, png, label) {
  const base64 = PNG.sync.write(png).toString("base64");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${png.width} ${png.height}" role="img" aria-label="${label}">
  <image width="${png.width}" height="${png.height}" href="data:image/png;base64,${base64}" />
</svg>
`;
  fs.writeFileSync(filePath, svg);
}

const logo = loadPng(source);
makeBackgroundTransparent(logo);

const gray = clonePng(logo);
toGrayLogo(gray);

writePng(path.join(publicDir, "ubafadushop-logo.png"), logo);
writePng(path.join(publicDir, "ubafadushop-logo-gris.png"), gray);
writeEmbeddedSvg(path.join(publicDir, "ubafadushop-logo.svg"), logo, ".UBAfadu.shop");
writeEmbeddedSvg(
  path.join(publicDir, "ubafadushop-logo-gris.svg"),
  gray,
  ".UBAfadu.shop"
);

console.log(`Generated logos at ${logo.width}x${logo.height}`);
