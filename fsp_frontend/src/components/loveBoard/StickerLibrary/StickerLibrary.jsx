import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DrawerPanel, Chip } from '../common/lbUi';

export default function StickerLibrary({ open, stickers = [], onAdd, onClose }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const seen = new Set();
    for (const sticker of stickers) seen.add(sticker.category || 'General');
    return ['All', ...Array.from(seen).sort()];
  }, [stickers]);

  const visibleStickers =
    activeCategory === 'All' ? stickers : stickers.filter((s) => (s.category || 'General') === activeCategory);

  return (
    <DrawerPanel open={open} onClose={onClose} eyebrow="decorate mode" title="Sticker Library">
      <p className="m-0 px-5 pb-1 text-sm text-(--ink-soft)">
        Tap a sticker to drop it onto the board, then drag, rotate, resize or lock it in place.
      </p>

      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto px-5 py-2">
          {categories.map((cat) => (
            <Chip key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} className="shrink-0">
              {cat}
            </Chip>
          ))}
        </div>
      )}

      <div className="grid flex-1 grid-cols-3 content-start gap-3 overflow-y-auto p-5">
        {visibleStickers.map((sticker) => (
          <motion.button
            key={sticker.id}
            type="button"
            onClick={() => onAdd(sticker.filename)}
            whileHover={{ y: -3, rotate: 3 }}
            whileTap={{ scale: 0.92 }}
            className="lb-focus min-h-11 cursor-pointer appearance-none rounded-2xl border-2 border-solid border-(--ink) bg-(--paper) p-2 transition-colors hover:bg-(--gelato-tint)"
            aria-label={`Add sticker: ${sticker.label}`}
            title={sticker.label}
          >
            <img src={sticker.url} alt="" className="aspect-square w-full object-contain" />
          </motion.button>
        ))}

        {visibleStickers.length === 0 && (
          <p className="col-span-3 m-0 text-sm text-(--ink-muted)">No stickers found in public/assets/love-board/stickers.</p>
        )}
      </div>
    </DrawerPanel>
  );
}
