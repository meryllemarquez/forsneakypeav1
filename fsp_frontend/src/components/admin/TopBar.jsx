import { motion } from 'framer-motion';
import { Bell, Menu, Search } from 'lucide-react';
import IconButton from '../ui/IconButton/IconButton';

export default function TopBar({ title, onOpenSidebar, onOpenNotifications, unreadCount, userName }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-(--color-admin-border) bg-(--color-admin-surface) px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="lg:hidden">
          <IconButton label="Open sidebar" onClick={onOpenSidebar}>
            <Menu size={20} strokeWidth={2.6} aria-hidden="true" />
        </IconButton>
          </span>
        <div className="min-w-0">
          <p className="m-0 flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.11em] text-(--color-admin-accent) uppercase">
            Admin Console
            <span className="font-normal tracking-normal text-(--color-admin-text-faint) normal-case">/</span>
            <span className="font-semibold text-(--color-admin-text-muted)">Merylle &amp; Cj</span>
          </p>
          <h1 className="m-0 mt-0.5 text-[17px] font-semibold tracking-tight text-(--color-admin-text)">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative hidden md:block">
          <Search size={13} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--color-admin-text-muted)" />
          <input
            aria-label="Search"
            placeholder="Search…"
            className="min-h-11 w-56 rounded-lg border border-(--color-admin-border) bg-(--color-admin-surface-2) py-1.5 pr-3 pl-8 text-sm outline-none transition focus:border-(--color-admin-accent)/50 focus:ring-2 focus:ring-(--color-admin-accent)/15"
          />
        </div>

        <IconButton
          label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          onClick={onOpenNotifications}
          className="relative"
        >
          <Bell size={20} strokeWidth={2.6} aria-hidden="true" />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-admin-danger) px-1 text-[11px] font-semibold text-(--white)"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </IconButton>

        <div className="flex items-center gap-2 rounded-full border border-(--color-admin-border) bg-(--color-admin-surface-2) px-3 py-1.5">
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-(--color-admin-accent)" />
          <span className="hidden text-[12.5px] font-semibold text-(--color-admin-text) sm:inline">{userName || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
}
