// Shrinks the Love Board paper / pin / tape / sticker PNGs IN PLACE (same names, same aspect ratio).
//   node scripts/optimize-loveboard-assets.mjs
// Saved letters reference these files by name, so nothing is renamed or deleted; only the pixel
// dimensions and file weight drop. Safe to re-run (never enlarges).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/love-board');
const MAX_SIDE = { papers: 600, pins: 200, tapes: 200, stickers: 256 };

let before = 0;
let after = 0;
for (const [category, maxSide] of Object.entries(MAX_SIDE)) {
  const dir = path.join(root, category);
  for (const file of fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png'))) {
    const full = path.join(dir, file);
    const input = fs.readFileSync(full);
    const out = await sharp(input)
      .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
      .toBuffer();
    before += input.length;
    if (out.length < input.length) {
      fs.writeFileSync(full, out);
      after += out.length;
    } else {
      after += input.length;
    }
    const meta = await sharp(fs.readFileSync(full)).metadata();
    console.log(`${category}/${file}: ${meta.width}x${meta.height}, ${(input.length / 1024) | 0} KB -> ${(fs.statSync(full).size / 1024) | 0} KB`);
  }
}
console.log(`total ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(2)} MB`);
