import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, StickyNote, BringToFront, SendToBack, Lock } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';

export default function LayerPanel({ open, items = [], onClose, onSelect, onBringToFront, onSendBackward }) {
  const isMobile = useIsMobile();
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
              <p className="m-0 text-xs font-medium tracking-wide text-[#8a7360] uppercase">Stacking Order</p>
              <h2 className="m-0 font-serif text-lg text-[#3a2b1e]">Layers</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="appearance-none rounded-full border-0 bg-transparent p-1.5 text-[#8a7360] transition hover:bg-black/5 hover:text-[#3a2b1e]"
              aria-label="Close layers"
            >
              <X size={18} />
            </button>
          </div>

          <p className="px-5 pt-3 text-xs text-[#8a7360]">
            Front-most first. Select an item to jump to it, or reorder it in the stack.
          </p>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-[#8a7360]">
                <Layers size={22} strokeWidth={1.5} />
                <p className="m-0 text-sm">Nothing on the board yet.</p>
              </div>
            )}

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-2.5 rounded-xl bg-[#f4ece0] p-2 shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => onSelect?.(item)}
                    className="flex min-w-0 flex-1 appearance-none items-center gap-2.5 rounded-lg border-0 bg-transparent p-0 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-inner">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <StickyNote size={15} className="text-[#8a7360]" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 truncate text-sm font-medium text-[#3a2b1e] capitalize">
                        {item.label}
                        {item.locked && <Lock size={11} className="shrink-0 text-[#8a7360]" />}
                      </span>
                      <span className="block text-[10px] tracking-wide text-[#8a7360] uppercase">
                        {item.type} · z{item.zIndex}
                      </span>
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onBringToFront?.(item)}
                      title="Bring to front"
                      className="appearance-none rounded-md border-0 bg-white/70 p-1 text-[#4a3a2c] transition hover:bg-white"
                    >
                      <BringToFront size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendBackward?.(item)}
                      title="Send backward"
                      className="appearance-none rounded-md border-0 bg-white/70 p-1 text-[#4a3a2c] transition hover:bg-white"
                    >
                      <SendToBack size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
