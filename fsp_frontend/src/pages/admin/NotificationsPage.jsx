import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import NotificationCard from '../../components/admin/NotificationCard';
import FilterBar from '../../components/admin/common/FilterBar';
import EmptyState from '../../components/admin/common/EmptyState';
import { SkeletonRows } from '../../components/admin/common/LoadingSkeleton';
import { useNotifications } from '../../queries/useNotifications';

export default function NotificationsPage() {
  const { notifications, loading, markRead: handleMarkRead, markAllRead: handleMarkAllRead, remove: handleDelete } =
    useNotifications();
  const [query, setQuery] = useState('');
  const [readFilter, setReadFilter] = useState(null);

  const filtered = useMemo(() => {
    return notifications
      .filter((n) => (readFilter === 'unread' ? !n.isRead : readFilter === 'read' ? n.isRead : true))
      .filter((n) => !query || n.title.toLowerCase().includes(query.toLowerCase()));
  }, [notifications, readFilter, query]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <FilterBar
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search notifications…"
          filters={[
            {
              label: 'Status',
              value: readFilter,
              onChange: setReadFilter,
              options: [
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' },
              ],
            },
          ]}
          onClear={() => {
            setQuery('');
            setReadFilter(null);
          }}
        />
      </div>

      {unreadCount > 0 && (
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="inline-flex appearance-none items-center gap-1.5 rounded-lg border-0 bg-(--color-admin-surface-2) px-3 py-1.5 text-xs font-medium text-(--color-admin-text) transition hover:bg-(--color-admin-border)"
        >
          <CheckCheck size={13} />
          Mark all as read ({unreadCount})
        </button>
      )}

      {loading ? (
        <SkeletonRows rows={5} cols={1} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Nothing matches your current filters." />
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((n) => (
              <NotificationCard key={n.id} notification={n} onMarkRead={handleMarkRead} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
