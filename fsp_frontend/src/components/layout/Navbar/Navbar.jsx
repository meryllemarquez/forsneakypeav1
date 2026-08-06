import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import NotificationBell from '../../notifications/NotificationBell';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { path: '/home', label: 'Home' },
  { path: '/memories', label: 'Memories' },
  { path: '/dates', label: 'Dates' },
  { path: '/letters', label: 'Letters' },
];

const HeartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21s-7.2-4.6-10-9.3C.6 8.4 2 4.8 5.3 4.1c2-.4 3.9.5 5 2.2 1.1-1.7 3-2.6 5-2.2 3.3.7 4.7 4.3 3.3 7.6C19.2 16.4 12 21 12 21z" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const LogOutIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initial = (user?.name || user?.username || '?').trim().charAt(0).toUpperCase();
  const isCoupleAccount = user?.role === 'ROLE_USER';

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className={styles.nav}>
        <NavLink to="/home" className={styles.brand}>
          <span className={styles.brandIcon}><HeartIcon /></span>
          for sneakypea
        </NavLink>

        <nav className={styles.navLinks} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.navRight}>
          {user?.role === 'ROLE_ADMIN' && (
            <button className={styles.adminBtn} onClick={() => navigate('/admin')}>
              <ShieldIcon />
              <span>Admin</span>
            </button>
          )}

          <NotificationBell />

          {isCoupleAccount ? (
            <button className={styles.avatarPill} onClick={() => navigate('/profile')} title="Edit your profile">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user?.name} className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarFallback}>{initial}</span>
              )}
              <span className={styles.avatarName}>{user?.name || user?.username || 'You'}</span>
            </button>
          ) : (
            <div className={styles.avatarPill}>
              <span className={styles.avatarFallback}>{initial}</span>
              <span className={styles.avatarName}>{user?.name || user?.username || 'Admin'}</span>
            </div>
          )}

          <button className={styles.logoutBtn} onClick={logout} title="Sign out" aria-label="Sign out">
            <LogOutIcon />
          </button>

          <button
            className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            className={styles.mobileDrawer}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Mobile"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.active : ''}`}
                onClick={closeMobile}
              >
                {item.label}
              </NavLink>
            ))}
            {isCoupleAccount && (
              <NavLink to="/profile" className={styles.mobileLink} onClick={closeMobile}>Profile</NavLink>
            )}
            {user?.role === 'ROLE_ADMIN' && (
              <button className={styles.mobileLink} onClick={() => { closeMobile(); navigate('/admin'); }}>
                Admin Panel
              </button>
            )}
            <button className={styles.mobileLink} onClick={logout}>Sign Out</button>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
