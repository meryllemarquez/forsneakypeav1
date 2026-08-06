import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import NoteCanvasPreview from './NoteCanvasPreview';
import { NOTE_CANVAS_WIDTH, NOTE_CANVAS_HEIGHT, NOTE_BOARD_SCALE } from '../../../utils/noteCanvas';
import { MOOD_OPTIONS } from '../../../constants/loveBoardConstants';
import { useCanvasDrag } from '../../../hooks/useCanvasDrag';

const EXIT_VARIANTS = {
  delete: { scale: 0.25, rotate: 35, opacity: 0, filter: 'blur(2px)', transition: { duration: 0.4 } },
  archive: { x: 420, y: 320, scale: 0.15, opacity: 0, rotate: -15, transition: { duration: 0.5, ease: 'easeIn' } },
};

export default function Note({ note, paperUrl, pins, tapes, boardScale = 1, panMode = false, isTop, exitReason, onOpen, onDragEnd, onBringToFront }) {
  const width = NOTE_CANVAS_WIDTH * NOTE_BOARD_SCALE;
  const height = NOTE_CANVAS_HEIGHT * NOTE_BOARD_SCALE;
  const [isDragging, setIsDragging] = useState(false);
  const MoodIcon = MOOD_OPTIONS.find((m) => m.value === note.mood)?.icon;

  // Pointer-capture drag: the note tracks the cursor 1:1 (no elastic
  // overshoot), and getScale is read live so accuracy holds at every zoom
  // level — see fsp_frontend/src/hooks/useCanvasDrag.js.
  const { x, y, onPointerDown } = useCanvasDrag({
    getScale: () => boardScale,
    disabled: panMode,
    onDragStart: () => {
      setIsDragging(true);
      onBringToFront?.(note.id);
    },
    onDragEnd: (dx, dy) => {
      setIsDragging(false);
      onDragEnd?.(note.id, note.positionX + dx, note.positionY + dy);
    },
    onTap: () => onOpen?.(note),
  });

  return (
    <motion.div
      className="absolute select-none"
      style={{
        left: note.positionX,
        top: note.positionY,
        width,
        height,
        zIndex: note.zIndex || 1,
        rotate: note.rotation || 0,
        cursor: panMode ? 'inherit' : isDragging ? 'grabbing' : 'grab',
        pointerEvents: panMode ? 'none' : 'auto',
        touchAction: 'none',
        x,
        y,
      }}
      onPointerDown={panMode ? undefined : onPointerDown}
      whileHover={panMode || isDragging ? undefined : { scale: 1.03, boxShadow: '0 22px 32px -10px rgba(40,25,10,0.45)' }}
      animate={
        isDragging
          ? { scale: 1.06, opacity: 1, boxShadow: '0 30px 45px -12px rgba(40, 25, 10, 0.55)' }
          : { scale: 1, opacity: 1, boxShadow: '0 0px 0px rgba(0,0,0,0)' }
      }
      initial={{ scale: 0.4, opacity: 0 }}
      exit={EXIT_VARIANTS[exitReason] || EXIT_VARIANTS.delete}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <div
        className="relative h-full w-full drop-shadow-[0_10px_18px_rgba(40,25,10,0.35)]"
        style={{ zIndex: isTop ? 2 : 1 }}
      >
        <NoteCanvasPreview note={note} paperUrl={paperUrl} pins={pins} tapes={tapes} scale={NOTE_BOARD_SCALE} />

        {note.isFavorite && (
          <Heart size={16} className="absolute top-2 right-2 fill-[#a8391f] text-[#a8391f] drop-shadow" />
        )}

        {MoodIcon && (
          <MoodIcon size={15} className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[#3a2b1e]/70 drop-shadow" />
        )}
      </div>
    </motion.div>
  );
}
