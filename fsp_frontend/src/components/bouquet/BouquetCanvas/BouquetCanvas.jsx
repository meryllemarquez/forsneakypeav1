import { useId } from 'react';
import {
  CANVAS,
  CARD_SIZE,
  FLOWER_BY_NAME,
  GATHER,
  PAPER_FILL,
  describeRecipe,
  wrapLines,
} from '../../../utils/bouquetRecipe';
import FlowerGlyph from './FlowerGlyph';
import { Ribbon, WrapBack, WrapDefs, WrapFront } from './parts';
import styles from './BouquetCanvas.module.css';

const INK = '#172B70';
const STEM = '#5E9B4E';
const HEAD_HALF = 30; // half the size of a flower's selection box at scale 1
const PREVIEW_CHARS = 60; // how much of the letter shows on the card in the picture

// Half-size of an item's selection box (canvas units).
const halfSize = (item) =>
  item.type === 'card' ? { w: (CARD_SIZE.w / 2) * item.s, h: (CARD_SIZE.h / 2) * item.s } : { w: HEAD_HALF * item.s, h: HEAD_HALF * item.s };

// Where a flower's stem leaves the head, in canvas coordinates.
function stemBase(item) {
  const d = 24 * item.s;
  const rad = (item.r * Math.PI) / 180;
  return { x: item.x - Math.sin(rad) * d, y: item.y + Math.cos(rad) * d };
}

function Stem({ item }) {
  const { x, y } = stemBase(item);
  const d = `M${x.toFixed(1)} ${y.toFixed(1)} Q${x.toFixed(1)} ${(y + (GATHER.y - y) * 0.6).toFixed(1)} ${GATHER.x} ${GATHER.y}`;
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <path d={d} fill="none" stroke={STEM} strokeWidth="3.4" strokeLinecap="round" />
    </>
  );
}

// The letter card, drawn around (0, 0) at scale 1. The export leaves the text out (web fonts do not load
// inside an SVG image) and draws the full letter on the canvas itself.
function CardArt({ item, card, withText }) {
  const { w, h } = CARD_SIZE;
  const lines = withText ? wrapLines((card.text || '').slice(0, PREVIEW_CHARS), 13, 5) : [];
  const preview = (card.text || '').length > PREVIEW_CHARS && lines.length ? `${lines[lines.length - 1]}…` : null;
  if (preview) lines[lines.length - 1] = preview;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <rect x={-w / 2 + 3} y={-h / 2 + 3} width={w} height={h} rx="8" fill="#CBDBF8" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="8" fill={PAPER_FILL[item.paper] || PAPER_FILL.gelato} stroke={INK} strokeWidth="2.6" />
      {item.paper === 'lined' && (
        <path d={[0, 1, 2, 3, 4, 5].map((i) => `M${-w / 2 + 8} ${-h / 2 + 34 + i * 18} H${w / 2 - 8}`).join(' ')} stroke="#CDE7FF" strokeWidth="1.6" />
      )}
      {lines.map((line, i) => (
        <text
          key={i}
          x={-w / 2 + 10}
          y={-h / 2 + 30 + i * 18}
          fontFamily="Caveat, cursive"
          fontSize="17"
          fill={INK}
          stroke="none"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// Dashed box with three handles: rotate (top), scale (bottom-right), delete (top-left).
// Drawn above everything. Handles are 22-unit hit circles (44px on a 400-wide phone canvas
// scaled to ~0.9) with a smaller visible dot.
function SelectionRing({ item, onHandlePointerDown, onDelete }) {
  const half = halfSize(item);
  const w = half.w + 6;
  const h = half.h + 6;
  const handle = (kind, cx, cy, label, glyph, extra) => (
    <g
      key={kind}
      className={styles.handle}
      transform={`translate(${cx} ${cy})`}
      role="button"
      tabIndex={-1}
      aria-label={label}
      onPointerDown={(e) => onHandlePointerDown?.(e, item, kind)}
      {...extra}
    >
      <circle r="22" fill="transparent" />
      <circle r="9" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
      {glyph}
    </g>
  );
  return (
    <g transform={`translate(${item.x} ${item.y}) rotate(${item.r})`} className={styles.ring}>
      <rect x={-w} y={-h} width={w * 2} height={h * 2} rx="10" fill="none" stroke={INK} strokeWidth="2" strokeDasharray="5 5" pointerEvents="none" />
      <path d={`M0 ${-h} V${-h - 12}`} stroke={INK} strokeWidth="2" pointerEvents="none" />
      {handle('rotate', 0, -h - 20, 'Rotate', <path d="M-4 1 A4 4 0 1 1 0 5 M-4 -3 V1 H0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />)}
      {handle('scale', w, h, 'Resize', <path d="M-3 3 L3 -3 M0 -3 H3 V0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />)}
      {handle('delete', -w, -h, 'Delete', <path d="M-3 -3 L3 3 M3 -3 L-3 3" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />, {
        onClick: (e) => {
          e.stopPropagation();
          onDelete?.(item);
        },
      })}
    </g>
  );
}

const itemLabel = (item) => (item.type === 'card' ? 'Letter card' : FLOWER_BY_NAME[item.name].label);

/**
 * The bouquet picture, a pure function of the recipe (logical 400 x 500). Used by the maker, the
 * gallery, the view page, the PNG export and the Love Board sticker. Props:
 *   interactive      { selectedId, justAddedId, svgRef, svgProps, onItemPointerDown, onItemKeyDown,
 *                      onFocusItem, onHandlePointerDown, onDelete }  (maker only)
 *   onCardActivate   read-only views: tapping the card calls this (opens the letter)
 *   exportMode       plain artwork for the PNG export (no card text, no a11y wrapper)
 *   bare             no surface/outline, for stickers
 */
export default function BouquetCanvas({ recipe, interactive = null, onCardActivate, exportMode = false, bare = false, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const items = recipe.items.filter((item) => (item.type === 'card' ? recipe.card?.show !== false : FLOWER_BY_NAME[item.name]));
  const selected = interactive ? items.find((item) => item.id === interactive.selectedId) : null;

  return (
    <svg
      ref={interactive?.svgRef}
      viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
      className={`${styles.canvas} ${bare ? styles.bare : ''} ${interactive ? styles.interactive : ''} ${className}`}
      role={exportMode ? undefined : interactive ? 'group' : 'img'}
      aria-label={exportMode ? undefined : interactive ? 'Bouquet canvas' : describeRecipe(recipe)}
      {...(interactive?.svgProps || {})}
    >
      <defs>
        <WrapDefs uid={uid} />
      </defs>

      <WrapBack wrap={recipe.wrap} uid={uid} />
      <g pointerEvents="none">
        {items.filter((item) => item.type === 'flower' && FLOWER_BY_NAME[item.name].stem).map((item) => (
          <Stem key={item.id} item={item} />
        ))}
      </g>

      {items.map((item, index) => {
        const k = item.s;
        const isCard = item.type === 'card';
        const isSelected = interactive?.selectedId === item.id;
        const half = halfSize(item);
        const readable = !interactive && isCard && onCardActivate;
        const asButton = interactive || readable;
        return (
          <g
            key={item.id}
            transform={`translate(${item.x} ${item.y}) rotate(${item.r})`}
            className={interactive ? styles.item : readable ? styles.readable : undefined}
            role={asButton ? 'button' : undefined}
            tabIndex={asButton ? 0 : undefined}
            aria-label={
              interactive
                ? `${itemLabel(item)}, ${isCard ? 'item' : 'flower'} ${index + 1} of ${items.length}${isSelected ? ', selected' : ''}`
                : readable
                  ? 'Read the letter'
                  : undefined
            }
            onPointerDown={interactive ? (e) => interactive.onItemPointerDown?.(e, item) : undefined}
            onKeyDown={
              interactive
                ? (e) => interactive.onItemKeyDown?.(e, item)
                : readable
                  ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onCardActivate())
                  : undefined
            }
            onClick={readable ? onCardActivate : undefined}
            onFocus={interactive ? () => interactive.onFocusItem?.(item) : undefined}
          >
            <g className={interactive?.justAddedId === item.id ? styles.drop : undefined}>
              {isCard ? (
                <g transform={`scale(${k})`}>
                  <CardArt item={item} card={recipe.card || {}} withText={!exportMode} />
                </g>
              ) : (
                <g transform={`scale(${item.flip ? -k : k} ${k}) translate(-32 -28)`}>
                  <FlowerGlyph name={item.name} tint={item.tint} />
                </g>
              )}
            </g>
            {(interactive || readable) &&
              (isCard ? (
                <rect x={-half.w} y={-half.h} width={half.w * 2} height={half.h * 2} fill="transparent" />
              ) : (
                <circle r={half.w} fill="transparent" />
              ))}
          </g>
        );
      })}

      {/* Front of the paper: clicks pass through to flowers tucked behind it. */}
      <g pointerEvents="none">
        <WrapFront wrap={recipe.wrap} uid={uid} />
        <g key={recipe.ribbon.style} className={styles.pop}>
          <Ribbon style={recipe.ribbon.style} color={recipe.ribbon.color} />
        </g>
      </g>

      {selected && (
        <SelectionRing item={selected} onHandlePointerDown={interactive.onHandlePointerDown} onDelete={interactive.onDelete} />
      )}
    </svg>
  );
}
