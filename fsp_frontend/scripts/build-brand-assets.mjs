// Regenerates the logo mark and every favicon from the one source drawing.
//   npm run build:icons
// Source:  ../docs/brand/logo-2-star-and-junebug.svg
// Outputs: src/assets/brand/logo-mark.svg (SVGO-optimised, same drawing)
//          public/favicon.svg, favicon-32.png, apple-touch-icon.png (180, on paper), icon-512.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { optimize } from 'svgo';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(root, '../docs/brand/logo-2-star-and-junebug.svg');
const PAPER = '#FFF8E8';

const { data: svg } = optimize(fs.readFileSync(source, 'utf8'), {
  multipass: true,
  plugins: [
    { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
    'removeDimensions',
  ],
});

fs.mkdirSync(path.join(root, 'src/assets/brand'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/assets/brand/logo-mark.svg'), svg);
fs.writeFileSync(path.join(root, 'public/favicon.svg'), svg);

const render = (px, density = 600) => sharp(Buffer.from(svg), { density }).resize(px, px, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

// Transparent tab icon.
await render(32).png().toFile(path.join(root, 'public/favicon-32.png'));

// iOS / PWA icons sit on the paper colour with a little breathing room.
async function onPaper(size, file) {
  const inner = Math.round(size * 0.78);
  const mark = await render(inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: PAPER } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(path.join(root, 'public', file));
}
await onPaper(180, 'apple-touch-icon.png');
await onPaper(512, 'icon-512.png');

console.log('brand assets written; logo-mark.svg =', Buffer.byteLength(svg), 'bytes');
