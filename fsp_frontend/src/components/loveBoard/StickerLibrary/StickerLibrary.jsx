import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';

export default function StickerLibrary({ open, stickers = [], onAdd, onClose }) {
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const seen = new Set();
    for (const sticker of stickers) seen.add(sticker.category || 'General');
    return ['All', ...Array.from(seen).sort()];
  }, [stickers]);

  const visibleStickers =
    activeCategory === 'All' ? stickers : stickers.filter((s) => (s.category || 'General') === activeCategory);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={
            isMobile
              ? 'fixed inset-x-0 bottom-0 top-auto z-[120] flex max-h-[75vh] w-full flex-col rounded-t-2xl border-t border-[#e7d8c2]/70 bg-[#fffaf1] shadow-2xl'
              : 'fixed top-0 right-0 z-[120] flex h-full w-full max-w-xs flex-col border-l border-[#e7d8c2]/70 bg-[#fffaf1] shadow-2xl'
          }
          initial={isMobile ? { y: '100%' } : { x: '100%' }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: '100%' } : { x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          <div className="flex items-center justify-between border-b border-[#e7d8c2] px-5 py-4">
            <div>
              <p className="m-0 text-xs font-medium tracking-wide text-[#8a7360] uppercase">Decorate Mode</p>
              <h2 className="m-0 font-serif text-lg text-[#3a2b1e]">Sticker Library</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="appearance-none rounded-full border-0 bg-transparent p-1.5 text-[#8a7360] transition hover:bg-black/5 hover:text-[#3a2b1e]"
              aria-label="Close sticker library"
            >
              <X size={18} />
            </button>
          </div>

          <p className="px-5 pt-3 text-xs text-[#8a7360]">
            Tap a sticker to drop it onto the board — then drag, rotate, resize or lock it in place.
          </p>

          {categories.length > 2 && (
            <div className="flex gap-1.5 overflow-x-auto px-5 pt-3 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 appearance-none rounded-full border-0 px-3 py-1 text-xs font-medium transition ${
                    activeCategory === cat ? 'bg-[#a8391f] text-white' : 'bg-[#ece1d2] text-[#4a3a2c] hover:bg-[#e2d4bf]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-5">
            {visibleStickers.map((sticker) => (
              <motion.button
                key={sticker.id}
                type="button"
                onClick={() => onAdd(sticker.filename)}
                whileHover={{ y: -3, rotate: 3, boxShadow: '0 10px 20px -6px rgba(60,40,20,0.35)' }}
                whileTap={{ scale: 0.92 }}
                className="appearance-none rounded-xl border-0 bg-[#f4ece0] p-2 shadow-sm transition-colors hover:bg-[#efe2cd]"
                title={sticker.label}
              >
                <img src={sticker.url} alt={sticker.label} className="aspect-square w-full object-contain" />
              </motion.button>
            ))}

            {visibleStickers.length === 0 && (
              <p className="col-span-3 text-sm text-[#8a7360]">
                No stickers found in public/assets/love-board/stickers.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
