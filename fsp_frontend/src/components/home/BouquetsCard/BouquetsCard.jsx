import { Link } from 'react-router-dom';
import Icon from '../../Icon';
import styles from './BouquetsCard.module.css';

/** Home entry point to the bouquet maker and gallery (not in the 4-item nav). */
export default function BouquetsCard() {
  return (
    <Link to="/bouquets" className={styles.card}>
      <span className={styles.icons} aria-hidden="true">
        <Icon name="tulip" size={56} />
        <Icon name="daisy" size={56} />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>Say it with flowers</span>
        <span className={styles.hand}>build a bouquet for your person</span>
      </span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </Link>
  );
}
