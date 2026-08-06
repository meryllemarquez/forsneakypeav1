import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  Book,
  Calendar,
  Trash2,
  Image,
  UserCog,
  ShieldAlert,
  Check,
  X,
} from 'lucide-react';

const TYPE_ICON = {
  DATE_CREATED: Calendar,
  DATE_COMPLETED: Calendar,
  DATE_UPDATED: Calendar,
  MEMORY_CREATED: Book,
  MEMORY_DELETED: Trash2,
  GALLERY_UPLOAD: Image,
  LOVE_NOTE_CREATED: Mail,
  PROFILE_CHANGED: UserCog,
  ADMIN_ACTION: ShieldAlert,
  REMINDER: Bell,
  CHECKLIST_UPDATE: Check,
  SYSTEM: Bell,
};

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function NotificationCard({ notification, onMarkRead, onDelete }) {
  const Icon = TYPE_ICON[notification.type] || Bell;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
      className={`group relative flex gap-3 rounded-xl border px-3.5 py-3 transition ${
        notification.isRead
          ? 'border-(--color-admin-border) bg-(--color-admin-surface)'
          : 'border-(--color-admin-accent)/20 bg-(--color-admin-accent-soft)/40'
      }`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.isRead ? 'bg-(--color-admin-surface-2) text-(--color-admin-text-muted)' : 'bg-(--color-admin-accent) text-white'}`}>
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[13px] font-medium text-(--color-admin-text)">{notification.title}</p>
        {notification.message && <p className="m-0 mt-0.5 text-xs text-(--color-admin-text-muted)">{notification.message}</p>}
        <p className="m-0 mt-1 text-[11px] text-(--color-admin-text-muted)">{timeAgo(notification.createdAt)}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
        {!notification.isRead && (
          <button
            type="button"
            title="Mark as read"
            onClick={() => onMarkRead(notification.id)}
            className="flex h-6 w-6 appearance-none items-center justify-center rounded-md border-0 bg-(--color-admin-surface-2) text-(--color-admin-text-muted) transition hover:bg-(--color-admin-accent-soft) hover:text-(--color-admin-accent)"
          >
            <Check size={12} />
          </button>
        )}
        <button
          type="button"
          title="Delete"
          onClick={() => onDelete(notification.id)}
          className="flex h-6 w-6 appearance-none items-center justify-center rounded-md border-0 bg-(--color-admin-surface-2) text-(--color-admin-text-muted) transition hover:bg-(--color-admin-danger-soft) hover:text-(--color-admin-danger)"
        >
          <X size={12} />
        </button>
      </div>
      {!notification.isRead && <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-(--color-admin-accent) group-hover:hidden" />}
    </motion.div>
  );
}
