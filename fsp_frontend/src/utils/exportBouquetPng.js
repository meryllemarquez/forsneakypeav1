import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BouquetCanvas from '../components/bouquet/BouquetCanvas/BouquetCanvas';
import { CANVAS, CARD_SIZE, findCard } from './bouquetRecipe';

/*
 * Client-side PNG export of a bouquet: always the LIGHT look, whatever the app theme.
 * The artwork is drawn with fixed palette hex (no CSS variables), so serializing it as an SVG image
 * already ignores dark mode. The letter is drawn afterwards with canvas fillText, because web fonts
 * (Caveat) do not load inside an SVG used as an image.
 */
const BG = '#FFF8E8';
const INK = '#172B70';
const SIZES = [
  [2400, 3000],
  [1600, 2000], // fallback if the big canvas fails (memory)
];

const slug = (title) =>
  String(title || 'bouquet')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'bouquet';

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The bouquet picture could not be drawn.'));
    img.src = url;
  });
}

// Shrinks the font until the whole letter fits in the box, wrapping on measured width.
function layoutLetter(ctx, text, boxW, boxH) {
  for (let size = Math.floor(boxH * 0.12); size >= 12; size -= 2) {
    ctx.font = `${size}px Caveat, cursive`;
    const lines = [];
    text.split('\n').forEach((paragraph) => {
      let line = '';
      paragraph.split(/\s+/).filter(Boolean).forEach((word) => {
        const trial = line ? `${line} ${word}` : word;
        if (ctx.measureText(trial).width <= boxW || !line) line = trial;
        else {
          lines.push(line);
          line = word;
        }
      });
      lines.push(line);
    });
    if (lines.length * size * 1.08 <= boxH) return { size, lines };
  }
  return { size: 12, lines: [] };
}

async function drawBouquet(recipe, width, height) {
  const margin = Math.round((8 * width) / 2400);
  const foot = Math.round(height * 0.024);
  const scale = Math.min((width - 2 * margin) / CANVAS.w, (height - 2 * margin - foot) / CANVAS.h);
  const left = (width - CANVAS.w * scale) / 2;
  const top = margin;

  const markup = renderToStaticMarkup(createElement(BouquetCanvas, { recipe, exportMode: true })).replace(
    '<svg ',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(CANVAS.w * scale)}" height="${Math.round(CANVAS.h * scale)}" `
  );
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  try {
    await Promise.all([document.fonts.load('48px Caveat'), document.fonts.ready]);
    const img = await loadImage(url);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, left, top, CANVAS.w * scale, CANVAS.h * scale);

    // The full letter, wrapped and shrunk to fit on the card.
    const card = findCard(recipe);
    const letter = recipe.card || {};
    const body = [letter.to && `To: ${letter.to}`, letter.text, letter.from && `from ${letter.from}`].filter(Boolean).join('\n');
    if (card && letter.show !== false && body) {
      const boxW = CARD_SIZE.w * card.s * scale;
      const boxH = CARD_SIZE.h * card.s * scale;
      ctx.save();
      ctx.translate(left + card.x * scale, top + card.y * scale);
      ctx.rotate((card.r * Math.PI) / 180);
      const pad = boxW * 0.09;
      const fit = layoutLetter(ctx, body, boxW - 2 * pad, boxH - 2 * pad);
      ctx.fillStyle = INK;
      ctx.textBaseline = 'top';
      fit.lines.forEach((line, i) => ctx.fillText(line, -boxW / 2 + pad, -boxH / 2 + pad + i * fit.size * 1.08));
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(foot * 0.8)}px Caveat, cursive`;
    ctx.fillText('for sneakypea', width / 2, height - margin - foot / 2);
    ctx.restore();

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The picture was too big to make.'))), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Renders the bouquet to a PNG and saves it: the share sheet on iPhone/iPad (when it can share
 * files), otherwise a normal download. Returns the file name.
 */
export default async function exportBouquetPng(recipe, title) {
  let blob = null;
  let lastError = null;
  for (const [w, h] of SIZES) {
    try {
      blob = await drawBouquet(recipe, w, h);
      break;
    } catch (err) {
      lastError = err;
    }
  }
  if (!blob) throw lastError || new Error('Could not make the picture.');

  const filename = `bouquet-${slug(title)}.png`;
  const file = new File([blob], filename, { type: 'image/png' });
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (apple && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: String(title || 'Bouquet') });
      return filename;
    } catch (err) {
      if (err?.name === 'AbortError') return filename; // they closed the share sheet
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return filename;
}
