/**
 * Genera favicons cuadrados desde public/banquito.png
 * Ejecutar: npx tsx scripts/generate-favicons.ts
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public", "banquito.png");

const whiteBg = { r: 255, g: 255, b: 255, alpha: 1 };

async function squarePng(out: string, size: number, padding = 0.12) {
  const inner = Math.round(size * (1 - padding * 2));
  const resized = await sharp(src)
    .resize(inner, inner, { fit: "contain", background: whiteBg })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: whiteBg,
    },
  })
    .composite([{ input: resized, gravity: "centre" }])
    .png()
    .toFile(out);

  console.log("wrote", out);
}

async function main() {
  mkdirSync(path.join(root, "app"), { recursive: true });
  mkdirSync(path.join(root, "public"), { recursive: true });

  await squarePng(path.join(root, "app", "icon.png"), 512);
  await squarePng(path.join(root, "app", "apple-icon.png"), 180);
  await squarePng(path.join(root, "public", "favicon-32x32.png"), 32);
  await squarePng(path.join(root, "public", "favicon-16x16.png"), 16);

  // favicon.ico multi-size (32 + 16)
  const pngToIco = (await import("png-to-ico")).default;
  const ico = await pngToIco([
    path.join(root, "public", "favicon-16x16.png"),
    path.join(root, "public", "favicon-32x32.png"),
  ]);
  writeFileSync(path.join(root, "app", "favicon.ico"), ico);
  writeFileSync(path.join(root, "public", "favicon.ico"), ico);
  console.log("wrote favicon.ico");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
