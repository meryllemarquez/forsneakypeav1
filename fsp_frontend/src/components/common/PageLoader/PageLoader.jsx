import styles from './PageLoader.module.css';

// Suspense fallback while a lazily loaded page (Memories, Dates, Love Letters) downloads.
// Warm cream background, a softly pulsing heart and the app's serif heading, so the switch
// from the previous page to the real one does not flash white.
export default function PageLoader({ label = 'Opening this page…' }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <svg className={styles.heart} width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21s-7.2-4.6-10-9.3C.6 8.4 2 4.8 5.3 4.1c2-.4 3.9.5 5 2.2 1.1-1.7 3-2.6 5-2.2 3.3.7 4.7 4.3 3.3 7.6C19.2 16.4 12 21 12 21z" />
      </svg>
      <p className={styles.label}>{label}</p>
    </div>
  );
}
