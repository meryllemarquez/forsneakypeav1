import { Link } from 'react-router-dom';
import Icon from '../../Icon';
import styles from './WheelCard.module.css';

/** Home entry point to the decision wheel. */
export default function WheelCard() {
  return (
    <Link to="/wheel" className={styles.card}>
      <Icon name="wheel" size={64} />
      <span className={styles.text}>
        <span className={styles.title}>Can&apos;t decide?</span>
        <span className={styles.hand}>spin the wheel, love</span>
      </span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </Link>
  );
}
