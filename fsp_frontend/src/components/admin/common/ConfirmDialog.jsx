import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl border border-(--color-admin-border) bg-(--color-admin-surface) p-5 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-(--color-admin-danger-soft) text-(--color-admin-danger)' : 'bg-(--color-admin-accent-soft) text-(--color-admin-accent)'}`}>
                <AlertTriangle size={16} strokeWidth={2} />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="appearance-none rounded-full border-0 bg-transparent p-1 text-(--color-admin-text-muted) transition hover:bg-black/5"
              >
                <X size={16} />
              </button>
            </div>
            <h3 className="m-0 text-[15px] font-semibold text-(--color-admin-text)">{title}</h3>
            {message && <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-(--color-admin-text-muted)">{message}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="appearance-none rounded-lg border-0 bg-(--color-admin-surface-2) px-3.5 py-2 text-[13px] font-medium text-(--color-admin-text) transition hover:bg-(--color-admin-border) disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={`appearance-none rounded-lg border-0 px-3.5 py-2 text-[13px] font-medium text-white transition disabled:opacity-50 ${
                  danger ? 'bg-(--color-admin-danger) hover:opacity-90' : 'bg-(--color-admin-accent) hover:opacity-90'
                }`}
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
