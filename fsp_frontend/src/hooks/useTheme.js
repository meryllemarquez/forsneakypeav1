import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/** { pref: 'light'|'dark'|'system', resolved: 'light'|'dark', setPref(pref) } */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
