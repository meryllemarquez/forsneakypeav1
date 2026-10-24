import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import Icon from '../Icon';
import styles from './Notifications.module.css';
import { notificationLink } from '../../utils/notificationLinks';

const TYPE_ICON = {
  LOVE_NOTE_CREATED: 'envelope',
  LOVE_NOTE_UPDATED: 'envelope',
  LOVE_NOTE_DELETED: 'envelope',
  MEMORY_CREATED: 'camera',
  MEMORY_UPDATED: 'camera',
  MEMORY_DELETED: 'camera',
  GALLERY_UPLOAD: 'camera',
  DATE_CREATED: 'motmot',
  DATE_UPDATED: 'motmot',
  DATE_COMPLETED: 'motmot',
  PROFILE_CHANGED: 'star',
};

// Memory and gallery moments sit on a citrus tile, everything else on sea: a quiet color
// code so the panel is scannable at a glance.
const GOLD_TYPES = new Set(['MEMORY_CREATED', 'MEMORY_UPDATED', 'MEMORY_DELETED', 'GALLERY_UPLOAD']);

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function NotificationItem({ notification, onMarkRead, onDelete, onNavigated }) {
  const navigate = useNavigate();
  const iconName = TYPE_ICON[notification.type] || 'bell';
  const isGold = GOLD_TYPES.has(notification.type);

  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
    const link = notificationLink(notification);
    if (link) {
      navigate(link);
      onNavigated?.();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
      onClick={handleClick}
      className={`${styles.item} ${!notification.isRead ? styles.itemUnread : ''}`}
    >
      <div className={`${styles.itemIcon} ${isGold ? styles.itemIconGold : ''}`}>
        <Icon name={iconName} size={32} />
      </div>
      <div className={styles.itemBody}>
        <p className={styles.itemTitle}>{notification.title}</p>
        {notification.message && <p className={styles.itemMessage}>{notification.message}</p>}
        <p className={styles.itemTime}>{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && <div className={styles.itemDot} aria-label="Unread" role="img" />}
      <div className={styles.itemActions}>
        {!notification.isRead && (
          <button
            type="button"
            aria-label="Mark as read"
            className={styles.itemActionBtn}
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
          >
            <Check size={18} strokeWidth={2.6} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          aria-label="Delete notification"
          className={`${styles.itemActionBtn} ${styles.itemActionBtnDanger}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <X size={18} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
