import { motion, AnimatePresence } from 'framer-motion';
import { TriangleAlert } from 'lucide-react';

/**
 * Reusable frosted-glass confirmation modal, generalized from the inline
 * version in MemoriesPage.jsx so the Love Board's note/sticker deletes can
 * share one implementation.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  busy = false,
  error = '',
  onConfirm,
  onClose,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={() => !busy && onClose?.()}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl border border-[#e7d8c2]/70 bg-[#fffaf2] p-6 text-center shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f3e3cf] text-[#a8391f]">
              <TriangleAlert size={22} strokeWidth={2} />
            </div>
            <h3 className="m-0 mb-2 font-serif text-lg text-[#3a2b1e]">{title}</h3>
            <p className="m-0 mb-4 text-sm leading-relaxed text-[#6b5849]">{message}</p>

            {error && <p className="m-0 mb-3 text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 appearance-none rounded-full border-0 bg-[#ece1d2] px-4 py-2.5 text-sm font-medium text-[#3a2b1e] transition hover:bg-[#e2d4bf] disabled:opacity-50"
                onClick={onClose}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 appearance-none rounded-full border-0 bg-[#a8391f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#8c2c16] disabled:opacity-50"
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? 'Working…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
