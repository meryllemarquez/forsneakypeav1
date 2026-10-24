import Modal from '../../ui/Modal/Modal';
import Button from '../../ui/Button/Button';
import styles from './MemoryPreviewModal.module.css';

export default function MemoryPreviewModal({ open, entry, onClose, onOpenAlbum }) {
  return (
    <Modal open={open} onClose={onClose} title={entry.folderName} size="md">
      <div className={styles.imageWrapper}>
        <img
          src={entry.highlightPhotoUrl}
          alt={entry.folderName}
          className={styles.image}
          style={{ objectPosition: `${entry.highlightPhotoPositionX ?? 50}% ${entry.highlightPhotoPositionY ?? 50}%` }}
        />
      </div>

      <p className={styles.date}>{entry.eventDate}</p>
      {entry.description && <p className={styles.description}>{entry.description}</p>}

      <div className={styles.actions}>
        <Button variant="primary" onClick={onOpenAlbum}>
          Open album
        </Button>
      </div>
    </Modal>
  );
}
