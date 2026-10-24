import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useCanvasDrag } from '../../../hooks/useCanvasDrag';

const MIN_WIDTH = 40;
const MIN_HEIGHT = 24;

export default function TextBoxHandle({ block, scale = 1, isSelected, isEditing, onSelect, onStartEdit, onStopEdit, onChange }) {
  const elRef = useRef(null);
  const interactionRef = useRef(null);

  // Translate goes through the same pointer-capture hook as Note/Sticker —
  // critically, this also fixes resize/rotate handles fighting the box's
  // own drag: Framer's `drag` attaches a native listener directly on this
  // element, which fires during native bubbling *before* a nested handle's
  // React-synthetic stopPropagation() can reach it, so a resize-handle drag
  // was silently also dragging the whole box. Pointer-capture drag has no
  // such native listener to race against.
  const { x, y, onPointerDown: onDragPointerDown } = useCanvasDrag({
    disabled: isEditing,
    onDragStart: () => onSelect?.(),
    onDragEnd: (dx, dy) => onChange({ x: block.x + dx / scale, y: block.y + dy / scale }),
    onTap: () => onSelect?.(),
  });

  const handlePointerMove = (e) => {
    const interaction = interactionRef.current;
    if (!interaction) return;

    if (interaction.mode === 'resize') {
      // Project the screen-space pointer delta into the box's own local
      // (unrotated) frame before applying it to width/height — otherwise
      // a corner drag on a rotated box resizes along the wrong axis.
      const rawDx = (e.clientX - interaction.startClientX) / scale;
      const rawDy = (e.clientY - interaction.startClientY) / scale;
      const theta = ((block.rotation || 0) * Math.PI) / 180;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const dx = rawDx * cos + rawDy * sin;
      const dy = -rawDx * sin + rawDy * cos;
      const patch = {};

      if (interaction.corner.includes('r')) {
        patch.width = Math.max(MIN_WIDTH, interaction.startWidth + dx);
      }
      if (interaction.corner.includes('l')) {
        const newWidth = Math.max(MIN_WIDTH, interaction.startWidth - dx);
        patch.width = newWidth;
        patch.x = interaction.startX + (interaction.startWidth - newWidth);
      }
      if (interaction.corner.includes('b')) {
        patch.height = Math.max(MIN_HEIGHT, interaction.startHeight + dy);
      }
      if (interaction.corner.includes('t')) {
        const newHeight = Math.max(MIN_HEIGHT, interaction.startHeight - dy);
        patch.height = newHeight;
        patch.y = interaction.startY + (interaction.startHeight - newHeight);
      }
      onChange(patch);
    } else if (interaction.mode === 'rotate') {
      const rect = elRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      onChange({ rotation: interaction.startRotation + (angle - interaction.startAngle) });
    }
  };

  const handlePointerUp = () => {
    interactionRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
  };

  const beginResize = (corner) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect?.();
    interactionRef.current = {
      mode: 'resize',
      corner,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWidth: block.width,
      startHeight: block.height,
      startX: block.x,
      startY: block.y,
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
      startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI),
      startRotation: block.rotation || 0,
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  };

  const textStyle = {
    fontFamily: block.fontFamily,
    fontSize: block.fontSize * scale,
    fontWeight: block.fontWeight || 'normal',
    color: block.color,
    textAlign: block.align || 'center',
    lineHeight: block.lineHeight ?? 1.3,
    letterSpacing: `${block.letterSpacing ?? 0}px`,
  };

  return (
    <motion.div
      ref={elRef}
      className="absolute select-none"
      style={{
        left: block.x * scale,
        top: block.y * scale,
        width: block.width * scale,
        height: block.height * scale,
        rotate: block.rotation || 0,
        zIndex: block.zIndex || 1,
        cursor: isEditing ? 'text' : 'grab',
        touchAction: 'none',
        x,
        y,
      }}
      onPointerDown={isEditing ? undefined : onDragPointerDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEdit?.();
      }}
    >
      {isEditing ? (
        <textarea
          autoFocus
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          onBlur={onStopEdit}
          onClick={(e) => e.stopPropagation()}
          className="h-full w-full resize-none border-none bg-transparent p-1 outline-none"
          style={textStyle}
        />
      ) : (
        <div
          className={`h-full w-full overflow-hidden p-1 break-words whitespace-pre-wrap ${
            isSelected ? 'outline-2 outline-dashed outline-(--tomato)' : ''
          }`}
          style={textStyle}
        >
          {block.text || <span className="opacity-40">Type something…</span>}
        </div>
      )}

      {isSelected && !isEditing && (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-sm ring-2 ring-(--tomato)" />

          <div
            className="pointer-events-none absolute top-0 left-1/2 h-5 w-px bg-(--tomato)"
            style={{ transform: 'translate(-50%, -100%)' }}
          />
          <button
            type="button"
            onPointerDown={beginRotate}
            title="Rotate"
            className="absolute top-0 left-1/2 flex h-8 w-8 -translate-x-1/2 cursor-grab appearance-none items-center justify-center border-0 bg-transparent active:cursor-grabbing"
            style={{ transform: 'translate(-50%, calc(-100% - 20px))', touchAction: 'none' }}
          >
            <span className="h-4 w-4 rounded-full border border-(--ink) bg-white shadow" />
          </button>

          {['tl', 'tr', 'bl', 'br'].map((corner) => (
            <button
              key={corner}
              type="button"
              onPointerDown={beginResize(corner)}
              className="absolute flex h-8 w-8 appearance-none items-center justify-center border-0 bg-transparent"
              style={{
                top: corner.includes('t') ? 0 : '100%',
                left: corner.includes('l') ? 0 : '100%',
                transform: 'translate(-50%, -50%)',
                cursor: corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize',
                touchAction: 'none',
              }}
            >
              <span className="h-2.5 w-2.5 rounded-sm border border-(--ink) bg-white shadow" />
            </button>
          ))}
        </>
      )}
    </motion.div>
  );
}
