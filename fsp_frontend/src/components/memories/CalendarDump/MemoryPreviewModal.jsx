import { motion } from 'framer-motion';
import styles from './MemoryPreviewModal.module.css';

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function MemoryPreviewModal({ entry, onClose, onOpenAlbum }) {
  return (
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close preview">
          <CloseIcon />
        </button>

        <div className={styles.imageWrapper}>
          <img
            src={entry.highlightPhotoUrl}
            alt={entry.folderName}
            className={styles.image}
            style={{ objectPosition: `${entry.highlightPhotoPositionX ?? 50}% ${entry.highlightPhotoPositionY ?? 50}%` }}
          />
        </div>

        <div className={styles.body}>
          <p className={styles.date}>{entry.eventDate}</p>
          <h2 className={styles.title}>{entry.folderName}</h2>
          {entry.description && <p className={styles.description}>{entry.description}</p>}

          <button type="button" className={styles.openAlbumBtn} onClick={onOpenAlbum}>
            Open Album
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
