import { useState } from 'react';
import { Bell } from 'lucide-react';
import styles from './Notifications.module.css';
import NotificationPanel from './NotificationPanel';
import { useNotifications } from '../../queries/useNotifications';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  // Shared, cached list (fresh for 15s) with optimistic mark-read / delete; see useNotifications.
  const { notifications, loading, markRead, markAllRead, remove } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className={styles.notifRoot}>
      <button
        type="button"
        className={`${styles.bellBtn} ${open ? styles.bellOpen : ''}`}
        onClick={() => setOpen(true)}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={1.8} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      <NotificationPanel
        open={open}
        notifications={notifications}
        loading={loading}
        onClose={() => setOpen(false)}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onDelete={remove}
      />
    </div>
  );
}
