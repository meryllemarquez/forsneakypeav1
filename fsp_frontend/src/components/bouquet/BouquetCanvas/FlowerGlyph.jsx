import { Children, cloneElement, isValidElement } from 'react';
import { GLYPHS } from '../../Icon/glyphs';
import { FLOWER_BY_NAME, TINT_HEX } from '../../../utils/bouquetRecipe';

const INK = '#172B70';
const cache = new Map();

// Swaps the main petal fill of a glyph for the tint colour (glyphs are plain JSX, so we rebuild the tree).
function recolor(node, from, to) {
  if (!isValidElement(node)) return node;
  const props = {};
  if (node.props.fill === from) props.fill = to;
  if (node.props.children !== undefined) {
    props.children = Children.map(node.props.children, (child) => recolor(child, from, to));
  }
  return Object.keys(props).length ? cloneElement(node, props) : node;
}

function tinted(name, tint) {
  const key = `${name}:${tint}`;
  if (!cache.has(key)) {
    const def = FLOWER_BY_NAME[name];
    const glyph = GLYPHS[name];
    const to = TINT_HEX[tint];
    cache.set(key, def?.from && to && to !== def.from ? recolor(glyph, def.from, to) : glyph);
  }
  return cache.get(key);
}

// A flower drawn in the 64x64 icon box, with the Icon wrapper's stroke settings and a FIXED ink colour
// (the artwork looks the same in light and dark mode).
export default function FlowerGlyph({ name, tint }) {
  if (!GLYPHS[name]) return null;
  return (
    <g fill="none" stroke={INK} color={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      {tinted(name, tint)}
    </g>
  );
}
