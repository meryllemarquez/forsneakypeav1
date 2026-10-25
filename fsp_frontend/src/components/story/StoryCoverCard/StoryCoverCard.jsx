import Button from '../../ui/Button/Button';
import StoryCover from '../StoryCover/StoryCover';
import styles from './StoryCoverCard.module.css';

/** Home entry card: the same book cover as the landing, small, a label and the open button. */
export default function StoryCoverCard({ onOpen, busy = false }) {
  return (
    <div id="our-story" className={styles.card}>
      <button type="button" className={styles.cover} onClick={onOpen} aria-label="Read our story" tabIndex={-1}>
        <StoryCover />
      </button>

      <div className={styles.copy}>
        <h2 className={styles.title}>Our story</h2>
        <p className={styles.sub}>tap to read</p>
        <Button variant="secondary" onClick={onOpen} loading={busy} className={styles.btn}>
          Read our story
        </Button>
      </div>
    </div>
  );
}
