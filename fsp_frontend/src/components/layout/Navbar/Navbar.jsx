import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { NAV_ITEMS, PHONE_NAV_QUERY } from '../../../constants/nav';
import { avatarDoodle } from '../../../utils/avatar';
import { getAccent } from '../../../constants/profileOptions';
import Icon from '../../Icon';
import Logo from '../Logo/Logo';
import TabBar from '../TabBar/TabBar';
import NotificationBell from '../../notifications/NotificationBell';
import LogoutConfirm from '../LogoutConfirm/LogoutConfirm';
import ThemeToggle, { ThemeCycleButton } from '../../ui/ThemeToggle/ThemeToggle';
import styles from './Navbar.module.css';

function Avatar({ user, size }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size }}>
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
      ) : (
        <Icon name={avatarDoodle(user)} size={size - 2} />
      )}
    </span>
  );
}

// Phones: the avatar opens a small menu holding Profile / Admin / Sign out.
function AvatarMenu({ user, isCouple, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className={styles.menuRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.avatarButton}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user?.name || user?.username || 'you'}`}
      >
        <Avatar user={user} size={36} />
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <p className={styles.menuName}>{user?.name || user?.username}</p>
          <ThemeToggle variant="compact" />
          {isCouple && (
            <button type="button" role="menuitem" className={styles.menuItem} onClick={() => go('/profile')}>
              <UserRound size={18} strokeWidth={2.4} aria-hidden="true" /> Profile
            </button>
          )}
          {isAdmin && (
            <button type="button" role="menuitem" className={styles.menuItem} onClick={() => go('/admin')}>
              <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" /> Admin
            </button>
          )}
          <button type="button" role="menuitem" className={styles.menuItem} onClick={() => { setOpen(false); onLogout(); }}>
            <LogOut size={18} strokeWidth={2.4} aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const navigate = useNavigate();
  const isPhone = useMediaQuery(PHONE_NAV_QUERY);

  const isCouple = user?.role === 'ROLE_USER';
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const displayName = user?.name || user?.username || (isAdmin ? 'Admin' : 'You');

  // The user's accent colour (Profile > Appearance) colours the avatar ring and the highlighted
  // tab. It is published on the root element so the tab bar can read it too.
  const accent = getAccent(user?.accentColor);
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--user-accent', accent.hex);
    root.style.setProperty('--user-accent-ink', accent.ink);
    return () => {
      root.style.removeProperty('--user-accent');
      root.style.removeProperty('--user-accent-ink');
    };
  }, [accent.hex, accent.ink]);

  // Leaves room above the bottom tab bar on phones (see reset.css).
  useEffect(() => {
    document.body.classList.toggle('has-tabbar', isPhone);
    return () => document.body.classList.remove('has-tabbar');
  }, [isPhone]);

  return (
    <>
      <header className={styles.header}>
        <Logo />

        {!isPhone && (
          <nav className={styles.navPill} aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={styles.navLink}>
                <Icon name={item.icon} size={26} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        <div className={styles.right}>
          {!isPhone && isAdmin && (
            <button type="button" className={styles.adminBtn} onClick={() => navigate('/admin')}>
              <ShieldCheck size={18} strokeWidth={2.4} aria-hidden="true" />
              Admin
            </button>
          )}

          <NotificationBell />

          {isPhone ? (
            <AvatarMenu user={user} isCouple={isCouple} isAdmin={isAdmin} onLogout={() => setLeaveOpen(true)} />
          ) : (
            <>
              {isCouple ? (
                <Link to="/profile" className={styles.avatarChip} aria-label={`${displayName}, edit your profile`}>
                  <Avatar user={user} size={36} />
                  <span>{displayName}</span>
                </Link>
              ) : (
                <div className={styles.avatarChip}>
                  <Avatar user={user} size={36} />
                  <span>{displayName}</span>
                </div>
              )}
              <ThemeCycleButton />
              <button type="button" className={styles.iconBtn} onClick={() => setLeaveOpen(true)} aria-label="Sign out">
                <LogOut size={20} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </header>

      {isPhone && <TabBar />}

      <LogoutConfirm open={leaveOpen} onClose={() => setLeaveOpen(false)} />
    </>
  );
}
