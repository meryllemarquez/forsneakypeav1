import { motion, AnimatePresence } from 'framer-motion';
import { CircleAlert, X } from 'lucide-react';
import Icon from '../../Icon';
import styles from './Notification.module.css';

// Each type has its own icon, so a toast never relies on its tint alone. Errors use a line icon in a
// citrus badge (no doodle fits "something went wrong").
const TOAST_ICON = { info: 'bell', success: 'sparkle', gold: 'star' };

// The one toast stack for the whole app (addToast from NotificationContext).
export default function NotificationToast({ toasts, onDismiss }) {
  return (
    <div className={styles.toastContainer}>
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
            {toast.type === 'error' ? (
              <span className={styles.errorBadge}>
                <CircleAlert size={22} strokeWidth={2.8} aria-hidden="true" />
              </span>
            ) : (
              <Icon name={TOAST_ICON[toast.type] || 'bell'} size={30} />
            )}
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
