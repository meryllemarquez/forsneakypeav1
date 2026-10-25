import Icon from '../../Icon/Icon';
import styles from './StoryCover.module.css';

const doodle = (size) => ({ width: size, height: size });

/** The storybook cover (her + him pill, "Our story", "since 2023", ribbon). Fills its container-type: inline-size parent. */
export default function StoryCover({ className = '' }) {
  return (
    <span className={`${styles.cover} ${className}`}>
      <span className={styles.spineLine} aria-hidden="true" />
      <span className={styles.pill}>
        <span className={styles.pair} aria-hidden="true">
          <Icon name="her" size={64} style={doodle('21cqw')} />
          <Icon name="him" size={64} style={doodle('21cqw')} />
        </span>
        <span className={styles.coverTitle}>Our story</span>
      </span>
      <span className={styles.since}>since 2023</span>
      {[styles.star1, styles.star2, styles.star3].map((c) => (
        <svg key={c} viewBox="-6 -6 12 12" className={`${styles.star} ${c}`} aria-hidden="true" focusable="false">
          <path d="M0 -5 L1.6 -1.6 L5 0 L1.6 1.6 L0 5 L-1.6 1.6 L-5 0 L-1.6 -1.6 Z" fill="var(--gelato)" />
        </svg>
      ))}
      <span className={styles.ribbon} aria-hidden="true" />
    </span>
  );
}
