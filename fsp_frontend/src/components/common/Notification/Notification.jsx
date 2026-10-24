import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Icon from '../../Icon';
import styles from './Notification.module.css';

const TOAST_ICON = { info: 'bell', success: 'sparkle', error: 'bell', gold: 'sparkle' };

// The one toast stack for the whole app (addToast from NotificationContext).
export default function NotificationToast({ toasts, onDismiss }) {
  return (
    <div className={styles.toastContainer} aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type] || ''}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            layout
          >
            <Icon name={TOAST_ICON[toast.type] || 'bell'} size={30} />
            <span className={styles.message}>{toast.message}</span>
            <button type="button" className={styles.dismissBtn} onClick={() => onDismiss(toast.id)} aria-label="Dismiss message">
              <X size={18} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
