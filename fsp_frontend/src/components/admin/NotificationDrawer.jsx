import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Search } from 'lucide-react';
import Modal from '../ui/Modal/Modal';
import Button from '../ui/Button/Button';
import Chip from '../ui/Chip/Chip';
import form from '../ui/FormControls.module.css';
import NotificationCard from './NotificationCard';
import EmptyState from './common/EmptyState';
import { SkeletonRows } from './common/LoadingSkeleton';

function groupByDate(notifications) {
  const groups = new Map();
  for (const n of notifications) {
    const date = n.createdAt ? new Date(n.createdAt) : null;
    const key = date ? date.toDateString() : 'Unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(n);
  }
  return Array.from(groups.entries());
}

// The shared Modal gives this drawer Esc, a focus trap, focus restore and scroll lock.
export default function NotificationDrawer({ open, notifications, loading, onClose, onMarkRead, onMarkAllRead, onDelete }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread

  const filtered = useMemo(() => {
    return notifications
      .filter((n) => (filter === 'unread' ? !n.isRead : true))
      .filter((n) => !query || n.title.toLowerCase().includes(query.toLowerCase()) || n.message?.toLowerCase().includes(query.toLowerCase()));
  }, [notifications, filter, query]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal open={open} onClose={onClose} placement="right" size="sm" title="Notifications">
      <p className={form.hint} aria-live="polite">{unreadCount} unread</p>

      <div className="mt-3 flex flex-col gap-3">
        <div className="relative">
          <Search size={18} strokeWidth={2.6} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-(--ink)" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications…"
            aria-label="Search notifications"
            className={form.input}
            style={{ paddingLeft: 42 }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Show">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
          <Chip active={filter === 'unread'} onClick={() => setFilter('unread')}>Unread</Chip>
          {unreadCount > 0 && (
            <Button size="sm" onClick={onMarkAllRead}>
              <CheckCheck size={18} strokeWidth={2.6} aria-hidden="true" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          <SkeletonRows rows={4} cols={1} />
        ) : grouped.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="No notifications to show." />
        ) : (
          grouped.map(([date, items]) => (
            <div key={date}>
              <p className="m-0 mb-2 text-xs font-semibold tracking-wide text-(--color-admin-text-muted) uppercase">
                {date === new Date().toDateString() ? 'Today' : date}
              </p>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((n) => (
                    <NotificationCard key={n.id} notification={n} onMarkRead={onMarkRead} onDelete={onDelete} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
