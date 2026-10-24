import Icon from '../../Icon';
import styles from './PageLoader.module.css';

// Suspense fallback while a lazily loaded page (Memories, Dates, Love Letters) downloads.
// Paper background and a bouncing Motmot, so the switch from the previous page to the real
// one does not flash white.
export default function PageLoader({ label = 'Opening this page…' }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <Icon name="motmot" size={96} sticker className={styles.motmot} />
      <p className={styles.label}>{label}</p>
    </div>
  );
}
