import { Link } from 'react-router-dom';
import Icon from '../../Icon';
import BouquetCanvas from '../BouquetCanvas/BouquetCanvas';
import { avatarDoodle } from '../../../utils/avatar';
import { normalizeRecipe } from '../../../utils/bouquetRecipe';
import styles from './BouquetCard.module.css';

const formatDay = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '');

/** One bouquet in the gallery: live-rendered thumbnail, title, and a "by Chicken · 12 Oct" line. */
export default function BouquetCard({ bouquet }) {
  const by = bouquet.createdByName || 'Someone';
  return (
    <Link to={`/bouquets/${bouquet.id}`} className={styles.card}>
      <BouquetCanvas recipe={normalizeRecipe(bouquet.recipe)} className={styles.thumb} />
      <span className={styles.title}>{bouquet.title}</span>
      <span className={styles.by}>
        <Icon name={avatarDoodle({ name: by })} size={24} />
        by {by} · {formatDay(bouquet.createdAt)}
      </span>
    </Link>
  );
}
