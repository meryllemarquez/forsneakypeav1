import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, Search, X } from 'lucide-react';
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
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[140] bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 z-[150] flex h-full w-full max-w-sm flex-col border-l border-(--color-admin-border) bg-(--color-admin-surface)"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-(--color-admin-border) px-5 py-4">
              <div>
                <p className="m-0 text-[15px] font-semibold text-(--color-admin-text)">Notifications</p>
                <p className="m-0 text-xs text-(--color-admin-text-muted)">{unreadCount} unread</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 appearance-none items-center justify-center rounded-full border-0 bg-transparent text-(--color-admin-text-muted) transition hover:bg-(--color-admin-surface-2)"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-(--color-admin-border) px-4 py-3">
              <div className="relative flex-1">
                <Search size={13} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-(--color-admin-text-muted)" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notifications…"
                  className="w-full rounded-lg border border-(--color-admin-border) bg-(--color-admin-surface-2) py-1.5 pr-2 pl-7 text-xs outline-none focus:border-(--color-admin-accent)/50"
                />
              </div>
              <div className="flex rounded-lg border border-(--color-admin-border) p-0.5">
                {['all', 'unread'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`appearance-none rounded-md border-0 px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                      filter === f ? 'bg-(--color-admin-accent) text-white' : 'bg-transparent text-(--color-admin-text-muted)'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="mx-4 mt-3 inline-flex w-fit appearance-none items-center gap-1.5 rounded-lg border-0 bg-(--color-admin-surface-2) px-2.5 py-1.5 text-[11px] font-medium text-(--color-admin-text) transition hover:bg-(--color-admin-border)"
              >
                <CheckCheck size={12} />
                Mark all as read
              </button>
            )}

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {loading ? (
                <SkeletonRows rows={4} cols={1} />
              ) : grouped.length === 0 ? (
                <EmptyState icon={Bell} title="You're all caught up" description="No notifications to show." />
              ) : (
                grouped.map(([date, items]) => (
                  <div key={date}>
                    <p className="m-0 mb-2 text-[11px] font-semibold tracking-wide text-(--color-admin-text-muted) uppercase">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
