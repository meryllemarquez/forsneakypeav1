import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '../../../constants/animations';
import styles from './Modal.module.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '500px'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className={styles.overlayWrapper}>
        <motion.div
          className={styles.backdrop}
          onClick={onClose}
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
        />
        <motion.div
          className={styles.modalContent}
          style={{ maxWidth }}
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          role="dialog"
          aria-modal="true"
        >
          {title && (
            <div className={styles.header}>
              <h3 className={styles.title}>{title}</h3>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close Modal">
                ✕
              </button>
            </div>
          )}
          <div className={styles.body}>{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}