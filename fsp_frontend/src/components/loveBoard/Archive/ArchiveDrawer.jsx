import { motion, AnimatePresence } from 'framer-motion';
import { X, ArchiveRestore, Trash2, Archive } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';

export default function ArchiveDrawer({ open, notes = [], papers = {}, onClose, onRestore, onDelete }) {
  const isMobile = useIsMobile();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={
            isMobile
              ? 'fixed inset-x-0 bottom-0 top-auto z-[120] flex max-h-[75vh] w-full flex-col rounded-t-2xl border-t border-[#e7d8c2]/70 bg-[#fffaf1] shadow-2xl'
              : 'fixed top-0 left-0 z-[120] flex h-full w-full max-w-sm flex-col border-r border-[#e7d8c2]/70 bg-[#fffaf1] shadow-2xl'
          }
          initial={isMobile ? { y: '100%' } : { x: '-100%' }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: '100%' } : { x: '-100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          <div className="flex items-center justify-between border-b border-[#e7d8c2] px-5 py-4">
            <div>
              <p className="m-0 text-xs font-medium tracking-wide text-[#8a7360] uppercase">Tucked Away</p>
              <h2 className="m-0 font-serif text-lg text-[#3a2b1e]">Archived Letters</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="appearance-none rounded-full border-0 bg-transparent p-1.5 text-[#8a7360] transition hover:bg-black/5 hover:text-[#3a2b1e]"
              aria-label="Close archive"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {notes.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-[#8a7360]">
                <Archive size={22} strokeWidth={1.5} />
                <p className="m-0 text-sm">Nothing archived yet.</p>
              </div>
            )}

            <div className="space-y-3">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-3 rounded-xl bg-[#f4ece0] p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  {papers[note.paperImage] && (
                    <img src={papers[note.paperImage]} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover shadow" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm font-semibold text-[#3a2b1e]">{note.title || 'Untitled letter'}</p>
                    <p className="m-0 truncate text-xs text-[#8a7360]">{note.content}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onRestore(note)}
                      className="inline-flex appearance-none items-center gap-1 rounded-full border-0 bg-[#a8391f] px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-[#8c2c16]"
                    >
                      <ArchiveRestore size={12} />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(note)}
                      className="inline-flex appearance-none items-center gap-1 rounded-full border-0 bg-white px-2.5 py-1 text-[11px] font-medium text-[#a8391f] transition hover:bg-[#f4e1da]"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
