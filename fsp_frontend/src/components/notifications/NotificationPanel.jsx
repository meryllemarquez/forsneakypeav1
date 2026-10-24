import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, CheckCheck } from 'lucide-react';
import Icon from '../Icon';
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
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes the panel; focus moves in on open and back to the bell on close.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);

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
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
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
              <button type="button" ref={closeRef} className={styles.closeBtn} onClick={onClose} aria-label="Close notifications">
                <X size={20} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.searchWrap}>
                <Search size={18} strokeWidth={2.6} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notifications…"
                  aria-label="Search notifications"
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.filterChips}>
                {['all', 'unread'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`${styles.filterChip} ${filter === f ? styles.filterChipActive : ''}`}
                  >
                    {f === 'all' ? 'All' : 'Unread'}
                  </button>
                ))}
              </div>
            </div>

            {unreadCount > 0 && (
              <button type="button" className={styles.markAllBtn} onClick={onMarkAllRead}>
                <CheckCheck size={18} strokeWidth={2.6} aria-hidden="true" />
                Mark all as read
              </button>
            )}

            <div className={styles.list}>
              {loading ? (
                <p className={styles.loadingText}>Loading…</p>
              ) : grouped.length === 0 ? (
                <div className={styles.emptyState}>
                  <Icon name="bell" size={72} sticker tilt={-6} />
                  <h3>You&rsquo;re all caught up, love</h3>
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
