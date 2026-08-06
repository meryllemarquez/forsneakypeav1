import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Search, X, CheckCheck } from 'lucide-react';
import styles from './Notifications.module.css';
import NotificationItem from './NotificationItem';

function bucketLabel(iso) {
  if (!iso) return 'Older';
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  if (date >= startOfWeek) return 'Earlier This Week';
  return 'Older';
}

const BUCKET_ORDER = ['Today', 'Yesterday', 'Earlier This Week', 'Older'];

export default function NotificationPanel({ open, notifications, loading, onClose, onMarkRead, onMarkAllRead, onDelete }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread

  const filtered = useMemo(() => {
    return notifications
      .filter((n) => (filter === 'unread' ? !n.isRead : true))
      .filter((n) => !query || n.title.toLowerCase().includes(query.toLowerCase()) || n.message?.toLowerCase().includes(query.toLowerCase()));
  }, [notifications, filter, query]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const n of filtered) {
      const label = bucketLabel(n.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    }
    return BUCKET_ORDER.filter((label) => groups[label]?.length).map((label) => [label, groups[label]]);
  }, [filtered]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={styles.panel}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          >
            <div className={styles.panelHeader}>
              <div className={styles.panelTitleGroup}>
                <h2>Notifications</h2>
                <p>{unreadCount} unread</p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close notifications">
                <X size={17} />
              </button>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <Search size={13} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notifications…"
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.filterChips}>
                {['all', 'unread'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`${styles.filterChip} ${filter === f ? styles.filterChipActive : ''}`}
                  >
                    {f === 'all' ? 'All' : 'Unread'}
                  </button>
                ))}
              </div>
            </div>

            {unreadCount > 0 && (
              <button type="button" className={styles.markAllBtn} onClick={onMarkAllRead}>
                <CheckCheck size={13} />
                Mark all as read
              </button>
            )}

            <div className={styles.list}>
              {loading ? (
                <p className={styles.loadingText}>Loading…</p>
              ) : grouped.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIconWrap}>
                    <Bell size={22} strokeWidth={1.75} />
                  </div>
                  <h3>You&rsquo;re all caught up</h3>
                  <p>Nothing to show here right now.</p>
                </div>
              ) : (
                grouped.map(([label, items]) => (
                  <div key={label}>
                    <p className={styles.groupLabel}>{label}</p>
                    <AnimatePresence initial={false}>
                      {items.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onMarkRead={onMarkRead}
                          onDelete={onDelete}
                          onNavigated={onClose}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
