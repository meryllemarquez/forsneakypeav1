import { motion, AnimatePresence } from 'framer-motion';
import styles from './Notification.module.css';

export default function NotificationToast({ toasts, onDismiss }) {
  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type]}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            layout
          >
            <span className={styles.message}>{toast.message}</span>
            <button className={styles.dismissBtn} onClick={() => onDismiss(toast.id)}>✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}