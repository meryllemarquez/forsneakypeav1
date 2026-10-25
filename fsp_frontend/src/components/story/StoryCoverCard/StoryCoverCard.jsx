import Button from '../../ui/Button/Button';
import Icon from '../../Icon/Icon';
import styles from './StoryCoverCard.module.css';

/** Home entry card: the book cover (no title line, that lives on the real cover), a label and the open button. */
export default function StoryCoverCard({ onOpen, busy = false }) {
  return (
    <div id="our-story" className={styles.card}>
      <button type="button" className={styles.cover} onClick={onOpen} aria-label="Read our story" tabIndex={-1}>
        <span className={styles.stitch} aria-hidden="true" />
        <span className={styles.plate} aria-hidden="true" />
        <span className={styles.pair} aria-hidden="true">
          <Icon name="her" size={34} sticker tilt={-6} />
          <Icon name="him" size={34} sticker tilt={5} />
        </span>
        <span className={styles.ribbon} aria-hidden="true" />
      </button>

      <div className={styles.copy}>
        <h2 className={styles.title}>Our story</h2>
        <p className={styles.sub}>tap to read</p>
        <Button variant="primary" onClick={onOpen} loading={busy} className={styles.btn}>
          Read our story
        </Button>
      </div>
    </div>
  );
}
