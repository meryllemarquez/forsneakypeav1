import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import styles from './Notifications.module.css';
import NotificationPanel from './NotificationPanel';
import { notificationService } from '../../services/notificationService';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await notificationService.getNotifications();
        if (mounted) setNotifications(Array.isArray(data) ? data : []);
      } catch {
        // Non-fatal — the bell just shows zero unread if this fails.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refetch = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // ignore — keep showing the last known state
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await notificationService.markRead(id);
    } catch {
      refetch();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllRead();
    } catch {
      refetch();
    }
  };

  const handleDelete = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationService.deleteNotification(id);
    } catch {
      refetch();
    }
  };

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
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDelete}
      />
    </div>
  );
}
