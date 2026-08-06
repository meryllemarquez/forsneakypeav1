import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Book, Calendar, Image, Bell, Check, X, UserCog } from 'lucide-react';
import styles from './Notifications.module.css';
import { notificationLink } from '../../utils/notificationLinks';

const TYPE_ICON = {
  LOVE_NOTE_CREATED: Mail,
  LOVE_NOTE_UPDATED: Mail,
  LOVE_NOTE_DELETED: Mail,
  MEMORY_CREATED: Book,
  MEMORY_UPDATED: Book,
  MEMORY_DELETED: Book,
  GALLERY_UPLOAD: Image,
  DATE_CREATED: Calendar,
  DATE_UPDATED: Calendar,
  DATE_COMPLETED: Calendar,
  PROFILE_CHANGED: UserCog,
};

// Letters and dates read as red (the primary accent); memories and gallery
// moments read as gold — a quiet color code so the panel is scannable at a
// glance, matching the icon-avatar convention from the design preview.
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
  const Icon = TYPE_ICON[notification.type] || Bell;
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
        <Icon size={15} strokeWidth={2} />
      </div>
      <div className={styles.itemBody}>
        <p className={styles.itemTitle}>{notification.title}</p>
        {notification.message && <p className={styles.itemMessage}>{notification.message}</p>}
        <p className={styles.itemTime}>{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && <div className={styles.itemDot} />}
      <div className={styles.itemActions}>
        {!notification.isRead && (
          <button
            type="button"
            title="Mark as read"
            className={styles.itemActionBtn}
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
          >
            <Check size={11} />
          </button>
        )}
        <button
          type="button"
          title="Delete"
          className={`${styles.itemActionBtn} ${styles.itemActionBtnDanger}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <X size={11} />
        </button>
      </div>
    </motion.div>
  );
}
