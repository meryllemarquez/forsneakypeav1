import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Book,
  Mail,
  Calendar,
  BellRing,
  BellOff,
  Archive,
  Clock,
  Upload,
  HardDrive,
  ShieldCheck,
  Database,
  Wifi,
  Activity as ActivityIcon,
  Bell,
  ListChecks,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import { SkeletonCards, SkeletonBlock } from '../../components/admin/common/LoadingSkeleton';
import EmptyState from '../../components/admin/common/EmptyState';
import { adminService } from '../../services/adminService';

function timeAgo(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatAction(action) {
  if (!action) return '';
  return action.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

const STATUS_TONE = {
  DREAMING: '#9ca3af',
  PLANNING: '#8C230F',
  BOOKED: '#d97706',
  READY: '#a88a2b',
  COMPLETED: '#16a34a',
  CANCELLED: '#c73616',
};

const QUICK_ACTIONS = [
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/activity', label: 'Activity Logs', icon: ActivityIcon },
  { to: '/admin/audit', label: 'Audit Trail', icon: ShieldCheck },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
];

function Card({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={`rounded-card border border-(--color-admin-border) bg-(--color-admin-surface) p-5 shadow-soft ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function CardTitle({ icon: Icon, children }) {
  return (
    <p className="m-0 mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-(--color-admin-text)">
      {Icon && <Icon size={13} />}
      {children}
    </p>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    adminService
      .getDashboard()
      .then((data) => mounted && setStats(data))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCards count={4} />
        <SkeletonCards count={4} />
      </div>
    );
  }

  if (!stats) {
    return <EmptyState icon={HardDrive} title="Couldn't load dashboard stats" description="Try refreshing the page." />;
  }

  const statusEntries = Object.entries(stats.datePlanStatusBreakdown || {});
  const statusTotal = statusEntries.reduce((sum, [, count]) => sum + count, 0) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="m-0 text-[26px] font-normal text-(--color-admin-text) italic"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Your sanctuary, at a glance.
        </h2>
        <p className="m-0 mt-1.5 text-[13px] text-(--color-admin-text-muted)">
          A quiet overview of everything the two of you have built together.
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardTitle>Quick Actions</CardTitle>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
            <motion.button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex appearance-none flex-col items-center gap-2 rounded-button border border-(--color-admin-border) bg-(--color-admin-surface-2) px-3 py-4 text-center transition hover:border-(--color-admin-accent)/30 hover:bg-(--color-admin-accent-soft)"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-admin-accent-soft) text-(--color-admin-accent)">
                <Icon size={16} />
              </span>
              <span className="text-[12px] font-medium text-(--color-admin-text)">{label}</span>
            </motion.button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} tone="accent" delay={0} />
        <StatCard icon={Book} label="Total Memories" value={stats.totalMemories} tone="success" delay={0.03} trend={stats.trend?.memoriesThisWeek} />
        <StatCard icon={Mail} label="Love Letters" value={stats.totalLoveLetters} tone="accent" delay={0.06} trend={stats.trend?.lettersThisWeek} />
        <StatCard icon={Calendar} label="Date Plans" value={stats.totalDatePlans} tone="warning" delay={0.09} trend={stats.trend?.datesThisWeek} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BellRing} label="Pending Notifications" value={stats.pendingNotifications} tone="danger" delay={0.12} />
        <StatCard icon={BellOff} label="Unread Notifications" value={stats.unreadNotifications} tone="danger" delay={0.15} />
        <StatCard icon={Archive} label="Archived Content" value={stats.archivedContent} tone="accent" delay={0.18} />
        <StatCard
          icon={Clock}
          label={stats.latestLoginUser ? `Latest login · ${stats.latestLoginUser}` : 'Latest login'}
          value={timeAgo(stats.latestLoginAt)}
          tone="success"
          delay={0.21}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card delay={0.24}>
          <CardTitle>Recent Activity</CardTitle>
          {stats.recentActivities?.length ? (
            <ul className="m-0 list-none space-y-3 p-0">
              {stats.recentActivities.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="text-(--color-admin-text)">
                    <span className="font-medium">{a.userName || 'System'}</span> · {formatAction(a.action)}
                  </span>
                  <span className="shrink-0 text-(--color-admin-text-muted)">{timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-xs text-(--color-admin-text-muted)">No recent activity yet.</p>
          )}
        </Card>

        <Card delay={0.27}>
          <CardTitle icon={Upload}>Recent Uploads</CardTitle>
          {stats.recentUploads?.length ? (
            <div className="grid grid-cols-3 gap-2">
              {stats.recentUploads.map((u, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-button bg-(--color-admin-surface-2)">
                  {u.photoUrl ? (
                    <img src={u.photoUrl} alt={u.caption || ''} className="h-full w-full object-cover" />
                  ) : (
                    <SkeletonBlock className="h-full w-full" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-xs text-(--color-admin-text-muted)">No uploads yet.</p>
          )}
        </Card>

        <Card delay={0.3}>
          <CardTitle icon={Book}>Recent Memories</CardTitle>
          {stats.recentMemories?.length ? (
            <ul className="m-0 list-none space-y-2.5 p-0">
              {stats.recentMemories.map((m, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-button bg-(--color-admin-surface-2)">
                    {m.coverImageUrl && <img src={m.coverImageUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <span className="truncate text-[12.5px] text-(--color-admin-text)">{m.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-xs text-(--color-admin-text-muted)">No memory folders yet.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card delay={0.33}>
          <CardTitle icon={Wifi}>System Health</CardTitle>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-1.5 text-(--color-admin-text)">
                <Wifi size={13} /> API
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${stats.systemHealth?.apiReachable ? 'bg-(--color-admin-success-soft) text-(--color-admin-success)' : 'bg-(--color-admin-danger-soft) text-(--color-admin-danger)'}`}>
                {stats.systemHealth?.apiReachable ? 'Reachable' : 'Unreachable'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-1.5 text-(--color-admin-text)">
                <Database size={13} /> Database
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${stats.systemHealth?.databaseConnected ? 'bg-(--color-admin-success-soft) text-(--color-admin-success)' : 'bg-(--color-admin-danger-soft) text-(--color-admin-danger)'}`}>
                {stats.systemHealth?.databaseConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="m-0 pt-1 text-[11px] text-(--color-admin-text-muted)">Checked {timeAgo(stats.systemHealth?.checkedAt)}</p>
          </div>
        </Card>

        <Card delay={0.36}>
          <CardTitle icon={ListChecks}>Date Plan Summary</CardTitle>
          {statusEntries.length ? (
            <div className="space-y-2">
              {statusEntries.map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-[11.5px]">
                    <span className="text-(--color-admin-text-muted)">{status}</span>
                    <span className="font-semibold text-(--color-admin-text)">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-(--color-admin-surface-2)">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(count / statusTotal) * 100}%`, backgroundColor: STATUS_TONE[status] || '#8C230F' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="m-0 text-xs text-(--color-admin-text-muted)">No date plans yet.</p>
          )}
        </Card>

        <Card delay={0.39}>
          <CardTitle icon={Bell}>Recent Notifications</CardTitle>
          {stats.recentNotifications?.length ? (
            <ul className="m-0 list-none space-y-2.5 p-0">
              {stats.recentNotifications.map((n, i) => (
                <li key={i} className="text-[12.5px]">
                  <p className="m-0 font-medium text-(--color-admin-text)">{n.title}</p>
                  <p className="m-0 truncate text-(--color-admin-text-muted)">{n.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-xs text-(--color-admin-text-muted)">No notifications sent yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
