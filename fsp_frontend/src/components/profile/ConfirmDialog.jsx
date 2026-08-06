import { motion, AnimatePresence } from 'framer-motion';
import styles from './ConfirmDialog.module.css';

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
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={() => !busy && onClose?.()}
        >
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.message}>{message}</p>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose} disabled={busy}>Cancel</button>
              <button className={styles.confirmBtn} onClick={onConfirm} disabled={busy}>
                {busy ? 'Working…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
