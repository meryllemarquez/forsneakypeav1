import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Copy, Trash2, BringToFront, SendToBack, RotateCw } from 'lucide-react';
import Icon from '../../Icon';
import { useCanvasDrag } from '../../../hooks/useCanvasDrag';
import { bouquetStickerId, isBouquetSticker, resolveStickerIcon } from '../../../constants/loveBoardCatalog';
import { useBouquets } from '../../../queries/queries';
import { normalizeRecipe } from '../../../utils/bouquetRecipe';
import BouquetCanvas from '../../bouquet/BouquetCanvas/BouquetCanvas';

const MIN_SCALE = 0.35;
const MAX_SCALE = 3;
// Handles render at their normal small visual size but sit inside a larger
// invisible hit-target button (Apple/Google HIG minimum ~28-32px) so they
// stay easy to grab on touch without looking oversized on desktop.
const TOUCH_HIT_SIZE = 32;

export default function Sticker({
  sticker,
  decorateMode,
  panMode = false,
  isSelected,
  boardScale = 1,
  onSelect,
  onDragEnd,
  onBringToFront,
  onSendBackward,
  onChange,
  onTransformStart,
  onTransformEnd,
  onDuplicate,
  onToggleLock,
  onDelete,
}) {
  const interactive = decorateMode && !sticker.isLocked && !panMode;
  const baseSize = 84;
  const renderedSize = baseSize * (sticker.scale || 1);
  const [isDragging, setIsDragging] = useState(false);
  const elRef = useRef(null);
  const interactionRef = useRef(null);

  // Chrome (handles/popover/badges) counter-scales against the board's
  // zoom-to-fit factor so it stays a usable, consistent size on screen no
  // matter how zoomed out the board is. Capped so it doesn't balloon at
  // extreme zoom-out.
  const chromeScale = Math.min(1 / boardScale, 2.5);

  const { x, y, onPointerDown: onDragPointerDown } = useCanvasDrag({
    getScale: () => boardScale,
    disabled: !interactive,
    onDragStart: () => {
      setIsDragging(true);
      onBringToFront?.(sticker.id);
    },
    onDragEnd: (dx, dy) => {
      setIsDragging(false);
      onDragEnd?.(sticker.id, sticker.positionX + dx, sticker.positionY + dy);
    },
    onTap: () => decorateMode && onSelect?.(sticker.id),
  });

  // Kept in refs so the pointermove/pointerup listeners (added once per
  // gesture) always see the latest id/callback without needing to be
  // torn down and re-attached on every re-render mid-drag. Synced via
  // effect (not during render) to stay compiler-safe.
  const onChangeRef = useRef(onChange);
  const onTransformEndRef = useRef(onTransformEnd);
  const stickerIdRef = useRef(sticker.id);
  useEffect(() => {
    onChangeRef.current = onChange;
    onTransformEndRef.current = onTransformEnd;
    stickerIdRef.current = sticker.id;
  });

  const handlePointerMove = useCallback((e) => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    if (interaction.mode === 'resize') {
      const dist = Math.hypot(e.clientX - interaction.centerX, e.clientY - interaction.centerY) || 1;
      const ratio = dist / interaction.startDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, interaction.startScale * ratio));
      onChangeRef.current?.(stickerIdRef.current, { scale: Number(newScale.toFixed(3)) });
    } else if (interaction.mode === 'rotate') {
      const angle = Math.atan2(e.clientY - interaction.centerY, e.clientX - interaction.centerX) * (180 / Math.PI);
      const newRotation = interaction.startRotation + (angle - interaction.startAngle);
      onChangeRef.current?.(stickerIdRef.current, { rotation: Number(newRotation.toFixed(1)) });
    }
  }, []);

  // Registered with { once: true } so it never needs to remove itself by
  // name (avoids a self-referential closure); the effect below still
  // covers early cleanup if the component unmounts mid-gesture.
  const handlePointerUp = useCallback(() => {
    interactionRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    onTransformEndRef.current?.(stickerIdRef.current);
  }, [handlePointerMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const beginResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = elRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    interactionRef.current = {
      mode: 'resize',
      centerX,
      centerY,
      startDist: Math.hypot(e.clientX - centerX, e.clientY - centerY) || 1,
      startScale: sticker.scale || 1,
    };
    onTransformStart?.(sticker.id);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  };

  const beginRotate = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = elRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    interactionRef.current = {
      mode: 'rotate',
      centerX,
      centerY,
      startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI),
      startRotation: sticker.rotation || 0,
    };
    onTransformStart?.(sticker.id);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  };

  return (
    <motion.div
      ref={elRef}
      className="absolute"
      style={{
        left: sticker.positionX,
        top: sticker.positionY,
        width: renderedSize,
        height: renderedSize,
        zIndex: sticker.zIndex || 1,
        rotate: sticker.rotation || 0,
        cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
        pointerEvents: panMode ? 'none' : 'auto',
        touchAction: 'none',
        x,
        y,
      }}
      onPointerDown={interactive ? onDragPointerDown : undefined}
      onClick={(e) => e.stopPropagation()}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isDragging ? 1.05 : 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      whileHover={interactive && !isDragging ? { scale: 1.05 } : undefined}
      exit={{ scale: 0, opacity: 0, rotate: (sticker.rotation || 0) + 40, transition: { duration: 0.3 } }}
    >
      <div className="relative h-full w-full">
        {/* The doodle fills ~80% of the box, like the old patches did, so saved sizes keep their footprint. */}
        <div data-theme="light" className="pointer-events-none flex h-full w-full items-center justify-center">
          {isBouquetSticker(sticker.image) ? (
            <BouquetStickerArt id={bouquetStickerId(sticker.image)} size={Math.round(renderedSize * 0.9)} />
          ) : (
            <Icon name={resolveStickerIcon(sticker.image)} size={Math.round(renderedSize * 0.8)} sticker />
          )}
        </div>
        {sticker.isLocked && (
          <span
            className="absolute -top-1 -right-1 rounded-full bg-(--white)/90 p-0.5 text-(--ink) shadow"
            style={{ transform: `scale(${chromeScale})`, transformOrigin: 'top right' }}
          >
            <Lock size={11} strokeWidth={2.25} />
          </span>
        )}

        {isSelected && interactive && (
          <>
            {/* Rotation handle + connecting stem */}
            <div
              className="pointer-events-none absolute top-0 left-1/2 h-6 w-px bg-(--white)/70"
              style={{ transform: `translate(-50%, calc(-100% + ${6 * chromeScale}px)) scaleY(${chromeScale})`, transformOrigin: 'bottom' }}
            />
            <button
              type="button"
              onPointerDown={beginRotate}
              title="Rotate"
              className="absolute top-0 left-1/2 flex -translate-x-1/2 cursor-grab appearance-none items-center justify-center border-0 bg-transparent active:cursor-grabbing"
              style={{
                width: TOUCH_HIT_SIZE,
                height: TOUCH_HIT_SIZE,
                transform: `translate(-50%, calc(-100% - ${24 * chromeScale}px)) scale(${chromeScale})`,
                transformOrigin: 'center',
                touchAction: 'none',
              }}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-(--outline) bg-(--white) text-(--tomato) shadow">
                <RotateCw size={11} strokeWidth={2.25} />
              </span>
            </button>

            {/* Corner resize handles — uniform scale, aspect ratio always preserved */}
            {[
              { key: 'tl', top: 0, left: 0, cursor: 'nwse-resize' },
              { key: 'tr', top: 0, left: renderedSize, cursor: 'nesw-resize' },
              { key: 'bl', top: renderedSize, left: 0, cursor: 'nesw-resize' },
              { key: 'br', top: renderedSize, left: renderedSize, cursor: 'nwse-resize' },
            ].map((handle) => (
              <button
                key={handle.key}
                type="button"
                onPointerDown={beginResize}
                className="absolute flex appearance-none items-center justify-center border-0 bg-transparent"
                style={{
                  top: handle.top,
                  left: handle.left,
                  width: TOUCH_HIT_SIZE,
                  height: TOUCH_HIT_SIZE,
                  cursor: handle.cursor,
                  transform: `translate(-50%, -50%) scale(${chromeScale})`,
                  transformOrigin: 'center',
                  touchAction: 'none',
                }}
              >
                <span className="h-3 w-3 rounded-sm border border-(--outline) bg-(--white) shadow" />
              </button>
            ))}

            {/* Selection outline */}
            <div className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-(--tomato)" />
          </>
        )}
      </div>

      <AnimatePresence>
        {isSelected && interactive && (
          <motion.div
            className="absolute top-full left-1/2 z-50 mt-3 w-56 rounded-3xl border-2 border-solid border-(--white) bg-(--ink) p-2 text-(--white) shadow-[4px_4px_0_var(--sea)]"
            style={{ x: '-50%', scale: chromeScale, transformOrigin: 'top center' }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-1 text-xs font-extrabold">
              <PopoverAction icon={<BringToFront size={18} strokeWidth={2.6} />} label="Front" onClick={() => onBringToFront?.(sticker.id)} />
              <PopoverAction icon={<SendToBack size={18} strokeWidth={2.6} />} label="Back" onClick={() => onSendBackward?.(sticker.id)} />
              <PopoverAction icon={<Copy size={18} strokeWidth={2.6} />} label="Copy" onClick={() => onDuplicate?.(sticker)} />
              <PopoverAction icon={<Lock size={18} strokeWidth={2.6} />} label="Lock" onClick={() => onToggleLock?.(sticker)} />
              <PopoverAction danger icon={<Trash2 size={18} strokeWidth={2.6} />} label="Delete" onClick={() => onDelete?.(sticker)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {decorateMode && sticker.isLocked && (
        <button
          type="button"
          className="absolute -top-2 -right-2 flex size-11 appearance-none items-center justify-center rounded-full border-2 border-solid border-(--outline) bg-(--white) p-0 text-(--on-bright) transition hover:bg-(--gelato) [--icon-ink:var(--on-bright)]"
          style={{ transform: `scale(${chromeScale})`, transformOrigin: 'top right' }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock?.(sticker);
          }}
          title="Unlock sticker"
          aria-label="Unlock sticker"
        >
          <Unlock size={18} strokeWidth={2.6} aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}

// A pinned bouquet: the same SVG as the gallery, read from the cached bouquet list. A bouquet that
// was deleted (or is still loading) shows the tulip doodle instead.
function BouquetStickerArt({ id, size }) {
  const { data: bouquets } = useBouquets();
  const bouquet = bouquets?.find((b) => b.id === id);
  if (!bouquet) return <Icon name="tulip" size={size} sticker />;
  return (
    <div style={{ width: size * 0.8, height: size }}>
      <BouquetCanvas recipe={normalizeRecipe(bouquet.recipe)} bare />
    </div>
  );
}

function PopoverAction({ icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 cursor-pointer flex-col items-center justify-center gap-0.5 appearance-none rounded-xl border-0 py-1.5 text-(--white) transition ${
        danger ? 'bg-(--tomato) hover:brightness-110' : 'bg-(--white)/15 hover:bg-(--white)/25'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
