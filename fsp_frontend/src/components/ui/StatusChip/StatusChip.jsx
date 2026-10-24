import { DATE_STATUS_LABELS } from '../../../constants/dateStatus';
import styles from './StatusChip.module.css';

/**
 * Dreaming = sea, Planning = gelato, Booked = citrus, Ready = amalfi,
 * Completed = ink, Cancelled = white with a strikethrough.
 */
export default function StatusChip({ status, className = '' }) {
  const key = String(status || '').toUpperCase();
  const label = DATE_STATUS_LABELS[key] || 'Planned';
  return <span className={`${styles.chip} ${styles[key.toLowerCase()] || styles.planning} ${className}`}>{label}</span>;
}
