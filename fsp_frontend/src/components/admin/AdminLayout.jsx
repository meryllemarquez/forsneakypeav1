import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import '../../styles/admin-tailwind.css';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NotificationDrawer from './NotificationDrawer';
import { useAuth } from '../../hooks/useAuth';
import LogoutConfirm from '../layout/LogoutConfirm/LogoutConfirm';
import { useNotifications } from '../../queries/useNotifications';

const TITLES = {
  '/admin': 'Dashboard',
  '/admin/notifications': 'Notifications',
  '/admin/activity': 'Activity Logs',
  '/admin/users': 'Users',
  '/admin/memories': 'Memories',
  '/admin/letters': 'Love Letters',
  '/admin/dates': 'Date Plans',
  '/admin/gallery': 'Gallery',
  '/admin/settings': 'System Settings',
  '/admin/audit': 'Audit Trail',
};

export default function AdminLayout() {
  const { user } = useAuth();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const {
    notifications,
    loading: notifLoading,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
    remove: handleDelete,
  } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    setMobileSidebarOpen(false);
    setLeaveOpen(true);
  };

  const title = TITLES[location.pathname] || 'Control Center';

  return (
    <div className="admin-shell flex h-screen w-screen overflow-hidden bg-(--color-admin-bg) font-sans text-(--color-admin-text)" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile off-canvas sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[160] bg-(--scrim) lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-[170] lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            >
              <Sidebar onNavigate={() => setMobileSidebarOpen(false)} onLogout={handleLogout} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          onOpenNotifications={() => setNotifOpen(true)}
          unreadCount={unreadCount}
          userName={user?.name}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <NotificationDrawer
        open={notifOpen}
        notifications={notifications}
        loading={notifLoading}
        onClose={() => setNotifOpen(false)}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDelete}
      />

      <LogoutConfirm open={leaveOpen} onClose={() => setLeaveOpen(false)} onLoggedOut={() => navigate('/auth')} />
    </div>
  );
}
