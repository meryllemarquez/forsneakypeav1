import { useId } from 'react';
import { CANVAS, FLOWER_BY_NAME, GATHER, describeRecipe } from '../../../utils/bouquetRecipe';
import FlowerGlyph from './FlowerGlyph';
import { Ribbon, WrapBack, WrapDefs, WrapFront } from './parts';
import styles from './BouquetCanvas.module.css';

const INK = '#172B70';
const STEM = '#5E9B4E';
const HEAD_HALF = 30; // half the size of a flower's selection box at scale 1

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

// Dashed box with three handles: rotate (top), scale (bottom-right), delete (top-left).
// Drawn above everything. Handles are 22-unit hit circles (44px on a 400-wide phone canvas
// scaled to ~0.9) with a smaller visible dot.
function SelectionRing({ item, onHandlePointerDown, onDelete }) {
  const h = HEAD_HALF * item.s + 6;
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
      <rect x={-h} y={-h} width={h * 2} height={h * 2} rx="10" fill="none" stroke={INK} strokeWidth="2" strokeDasharray="5 5" pointerEvents="none" />
      <path d={`M0 ${-h} V${-h - 12}`} stroke={INK} strokeWidth="2" pointerEvents="none" />
      {handle('rotate', 0, -h - 20, 'Rotate', <path d="M-4 1 A4 4 0 1 1 0 5 M-4 -3 V1 H0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />)}
      {handle('scale', h, h, 'Resize', <path d="M-3 3 L3 -3 M0 -3 H3 V0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />)}
      {handle('delete', -h, -h, 'Delete', <path d="M-3 -3 L3 3 M3 -3 L-3 3" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />, {
        onClick: (e) => {
          e.stopPropagation();
          onDelete?.(item);
        },
      })}
    </g>
  );
}

/**
 * The bouquet picture, a pure function of the recipe (logical 400 x 500). Used by the maker now and by
 * the gallery / view / Love Board sticker later. Pass `interactive` to make flowers selectable:
 *   { selectedId, justAddedId, svgRef, svgProps, onItemPointerDown, onItemKeyDown,
 *     onHandlePointerDown, onDelete }
 * The card item (letter) is not drawn yet.
 */
export default function BouquetCanvas({ recipe, interactive = null, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const items = recipe.items.filter((item) => item.type === 'flower' && FLOWER_BY_NAME[item.name]);
  const selected = interactive ? items.find((item) => item.id === interactive.selectedId) : null;

  return (
    <svg
      ref={interactive?.svgRef}
      viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
      className={`${styles.canvas} ${interactive ? styles.interactive : ''} ${className}`}
      role={interactive ? 'group' : 'img'}
      aria-label={interactive ? 'Bouquet canvas' : describeRecipe(recipe)}
      {...(interactive?.svgProps || {})}
    >
      <defs>
        <WrapDefs uid={uid} />
      </defs>

      <WrapBack wrap={recipe.wrap} uid={uid} />
      <g pointerEvents="none">
        {items.filter((item) => FLOWER_BY_NAME[item.name].stem).map((item) => (
          <Stem key={item.id} item={item} />
        ))}
      </g>

      {items.map((item, index) => {
        const k = item.s;
        const isSelected = interactive?.selectedId === item.id;
        const label = FLOWER_BY_NAME[item.name].label;
        return (
          <g
            key={item.id}
            transform={`translate(${item.x} ${item.y}) rotate(${item.r})`}
            className={interactive ? styles.item : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={
              interactive ? `${label}, flower ${index + 1} of ${items.length}${isSelected ? ', selected' : ''}` : undefined
            }
            onPointerDown={interactive ? (e) => interactive.onItemPointerDown?.(e, item) : undefined}
            onKeyDown={interactive ? (e) => interactive.onItemKeyDown?.(e, item) : undefined}
            onFocus={interactive ? () => interactive.onFocusItem?.(item) : undefined}
          >
            <g className={interactive?.justAddedId === item.id ? styles.drop : undefined}>
              <g transform={`scale(${item.flip ? -k : k} ${k}) translate(-32 -28)`}>
                <FlowerGlyph name={item.name} tint={item.tint} />
              </g>
            </g>
            {interactive && <circle r={HEAD_HALF * k} fill="transparent" />}
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
