import { Link } from 'react-router-dom';
import logoMark from '../../../assets/brand/logo-mark.svg';
import styles from './Logo.module.css';

// Brand mark (a smiling star hugged by a june bug) next to the wordmark.
export default function Logo({ to = '/home', size = 48, tone = 'ink', showWordmark = true, className = '' }) {
  const content = (
    <>
      <img src={logoMark} alt="" width={size} height={size} className={styles.mark} />
      {showWordmark && <span className={styles.word}>for sneakypea</span>}
    </>
  );
  const cls = `${styles.logo} ${tone === 'white' ? styles.white : ''} ${className}`;
  return to ? (
    <Link to={to} className={cls} aria-label="for sneakypea, home">
      {content}
    </Link>
  ) : (
    <span className={cls}>{content}</span>
  );
}
