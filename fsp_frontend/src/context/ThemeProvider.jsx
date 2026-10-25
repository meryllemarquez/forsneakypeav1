import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeContext } from './ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profileService';

const STORAGE_KEY = 'fsp-theme';
const PREFS = ['light', 'dark', 'system'];
const META_COLORS = { light: '#FFF8E8', dark: '#0E1533' };
const DARK_QUERY = '(prefers-color-scheme: dark)';

const readStored = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return PREFS.includes(value) ? value : null;
  } catch {
    return null;
  }
};

const systemTheme = () => (window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light');

/** Writes the resolved theme onto <html> (the inline script in index.html does the same before first paint). */
function applyTheme(pref, resolved, animate) {
  const root = document.documentElement;
  if (animate && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-fading');
    window.setTimeout(() => root.classList.remove('theme-fading'), 280);
  }
  root.setAttribute('data-theme', resolved);
  root.setAttribute('data-theme-pref', pref);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[resolved]);
}

/**
 * Light / Dark / System. The choice lives in localStorage (per device) and, for the couple, is also
 * saved on their profile: this device's choice always wins; the saved one only seeds a device that has none.
 */
export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [pref, setPrefState] = useState(() => readStored() || 'system');
  const [system, setSystem] = useState(systemTheme);
  const resolved = pref === 'system' ? system : pref;
  const first = useRef(true);
  const saveTimer = useRef(null);
  const canSync = user?.role === 'ROLE_USER';

  useEffect(() => {
    const media = window.matchMedia?.(DARK_QUERY);
    if (!media) return undefined;
    const onChange = () => setSystem(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    applyTheme(pref, resolved, !first.current);
    first.current = false;
  }, [pref, resolved]);

  // Another tab changed the theme.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && PREFS.includes(e.newValue)) setPrefState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // A device with no saved choice adopts the one saved on the account at sign-in.
  useEffect(() => {
    if (!user?.themePref || readStored()) return;
    if (PREFS.includes(user.themePref) && user.themePref !== 'system') {
      try { localStorage.setItem(STORAGE_KEY, user.themePref); } catch { /* storage unavailable */ }
      setPrefState(user.themePref);
    }
  }, [user?.themePref]);

  const setPref = useCallback((next) => {
    if (!PREFS.includes(next)) return;
    setPrefState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable: still applies this session */ }
    if (canSync) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        profileService.updateTheme(next).catch(() => { /* this device still has it */ });
      }, 500);
    }
  }, [canSync]);

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  const value = useMemo(() => ({ pref, resolved, setPref }), [pref, resolved, setPref]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
