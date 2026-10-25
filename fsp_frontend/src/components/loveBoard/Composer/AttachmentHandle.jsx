import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Trash2, RotateCw } from 'lucide-react';
import { useCanvasDrag } from '../../../hooks/useCanvasDrag';
import { LbAttachment } from '../common/lbGraphics';

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const BASE_SIZE = 34;

export default function AttachmentHandle({ attachment, scale = 1, isSelected, onSelect, onChange, onReplace, onRemove }) {
  const elRef = useRef(null);
  const interactionRef = useRef(null);

  const renderedSize = BASE_SIZE * (attachment.scale || 1) * scale;

  // See the matching comment in TextBoxHandle.jsx: Framer's native `drag`
  // listener on this element would otherwise fire before a nested resize/
  // rotate handle's stopPropagation() can stop it, dragging the whole
  // attachment at the same time as resizing/rotating it.
  const { x, y, onPointerDown: onDragPointerDown } = useCanvasDrag({
    onDragStart: () => onSelect?.(),
    onDragEnd: (dx, dy) => onChange({ x: attachment.x + dx / scale, y: attachment.y + dy / scale }),
    onTap: () => onSelect?.(),
  });

  const handlePointerMove = (e) => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    if (interaction.mode === 'resize') {
      const dist = Math.hypot(e.clientX - interaction.centerX, e.clientY - interaction.centerY) || 1;
      const ratio = dist / interaction.startDist;
      onChange({ scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, interaction.startScale * ratio)) });
    } else if (interaction.mode === 'rotate') {
      const angle = Math.atan2(e.clientY - interaction.centerY, e.clientX - interaction.centerX) * (180 / Math.PI);
      onChange({ rotation: interaction.startRotation + (angle - interaction.startAngle) });
    }
  };

  const handlePointerUp = () => {
    interactionRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
  };

  const beginResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.();
    const rect = elRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    interactionRef.current = {
      mode: 'resize',
      centerX,
      centerY,
      startDist: Math.hypot(e.clientX - centerX, e.clientY - centerY) || 1,
      startScale: attachment.scale || 1,
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  };

  const beginRotate = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.();
    const rect = elRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    interactionRef.current = {
      mode: 'rotate',
      centerX,
      centerY,
      startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI),
      startRotation: attachment.rotation || 0,
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  };

  return (
    <motion.div
      ref={elRef}
      className="absolute"
      style={{
        // Anchored so (x, y) is the visual CENTER of the attachment — matches
        // NoteCanvasPreview's board-render convention exactly, so whatever
        // the user sees here is what renders on the board (no half-size offset).
        left: attachment.x * scale - renderedSize / 2,
        top: attachment.y * scale - renderedSize / 2,
        width: renderedSize,
        height: renderedSize,
        rotate: attachment.rotation || 0,
        zIndex: attachment.zIndex || 1,
        cursor: 'grab',
        touchAction: 'none',
        x,
        y,
      }}
      onPointerDown={onDragPointerDown}
      onClick={(e) => e.stopPropagation()}
    >
      <LbAttachment type={attachment.type} value={attachment.image} />

      {isSelected && (
        <>
          <button
            type="button"
            onPointerDown={beginRotate}
            title="Rotate"
            className="absolute top-0 left-1/2 flex h-8 w-8 -translate-x-1/2 cursor-grab appearance-none items-center justify-center border-0 bg-transparent active:cursor-grabbing"
            style={{ transform: 'translate(-50%, calc(-100% - 16px))', touchAction: 'none' }}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-(--outline) bg-(--white) text-(--tomato) shadow">
              <RotateCw size={9} strokeWidth={2.5} />
            </span>
          </button>
          <button
            type="button"
            onPointerDown={beginResize}
            className="absolute flex h-8 w-8 appearance-none items-center justify-center border-0 bg-transparent"
            style={{ top: '100%', left: '100%', transform: 'translate(-50%, -50%)', cursor: 'nwse-resize', touchAction: 'none' }}
          >
            <span className="h-2.5 w-2.5 rounded-sm border border-(--outline) bg-(--white) shadow" />
          </button>

          <AnimatePresence>
            <motion.div
              className="absolute top-full left-1/2 z-50 mt-2 flex -translate-x-1/2 gap-1 rounded-2xl border-2 border-solid border-(--white) bg-(--ink) p-1 text-(--white) shadow-[3px_3px_0_var(--sea)]"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onReplace}
                title="Replace"
                aria-label="Replace"
                className="flex size-11 cursor-pointer appearance-none items-center justify-center rounded-xl border-0 bg-(--white)/15 p-0 text-(--white) transition hover:bg-(--white)/25"
              >
                <RefreshCw size={18} strokeWidth={2.6} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                title="Remove"
                aria-label="Remove"
                className="flex size-11 cursor-pointer appearance-none items-center justify-center rounded-xl border-0 bg-(--tomato) p-0 text-(--on-tomato) transition hover:brightness-110"
              >
                <Trash2 size={18} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
