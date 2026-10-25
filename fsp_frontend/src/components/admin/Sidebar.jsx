import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  Activity,
  Users,
  Book,
  Mail,
  Calendar,
  Images,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Communication',
    items: [
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/activity', label: 'Activity Logs', icon: Activity },
      { to: '/admin/audit', label: 'Audit Trail', icon: ShieldCheck },
    ],
  },
  {
    label: 'People',
    items: [{ to: '/admin/users', label: 'Users', icon: Users }],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/memories', label: 'Memories', icon: Book },
      { to: '/admin/letters', label: 'Love Letters', icon: Mail },
      { to: '/admin/dates', label: 'Date Plans', icon: Calendar },
      { to: '/admin/gallery', label: 'Gallery', icon: Images },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/admin/settings', label: 'System Settings', icon: Settings }],
  },
];

export default function Sidebar({ onNavigate, onLogout, collapsed = false, onToggleCollapse }) {
  return (
    <motion.div
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      className="flex h-full shrink-0 flex-col overflow-hidden bg-(--color-admin-sidebar) text-(--footer-ink)"
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-button bg-(--color-admin-accent) text-(--footer-ink)">
          <ShieldCheck size={16} strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="m-0 truncate text-[13px] font-semibold tracking-tight">Admin Console</p>
            <p className="m-0 truncate text-xs text-(--footer-ink)/75">For Sneakypea</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="m-0 mb-1.5 px-3 text-xs font-semibold tracking-wider text-(--color-admin-golden) uppercase">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, end, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-2.5 rounded-button px-3 py-2 text-[13px] font-medium no-underline transition-colors ${
                      isActive
                        ? 'bg-(--footer-ink)/10 text-(--footer-ink)'
                        : 'text-(--footer-ink)/85 hover:bg-(--color-admin-sidebar-hover) hover:text-(--footer-ink)'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="admin-nav-active-bar"
                          className="absolute top-1 bottom-1 left-0 w-[3px] rounded-full bg-(--color-admin-accent)"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <motion.span whileHover={{ scale: 1.08 }} className="flex shrink-0 items-center justify-center">
                        <Icon size={16} strokeWidth={2} />
                      </motion.span>
                      {!collapsed && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-(--footer-ink)/10 px-3 py-3">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden w-full appearance-none items-center gap-2.5 rounded-button border-0 bg-transparent px-3 py-2 text-[13px] font-medium text-(--footer-ink)/80 transition hover:bg-(--color-admin-sidebar-hover) hover:text-(--footer-ink) lg:flex"
          >
            {collapsed ? <ChevronsRight size={16} strokeWidth={2} /> : <ChevronsLeft size={16} strokeWidth={2} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className="flex w-full appearance-none items-center gap-2.5 rounded-button border-0 bg-transparent px-3 py-2 text-[13px] font-medium text-(--footer-ink)/80 transition hover:bg-(--color-admin-sidebar-hover) hover:text-(--footer-ink)"
        >
          <LogOut size={16} strokeWidth={2} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </motion.div>
  );
}
