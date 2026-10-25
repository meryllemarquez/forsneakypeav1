import { Monitor, Moon, Sun } from 'lucide-react';
import RadioGroup from '../RadioGroup/RadioGroup';
import IconButton from '../IconButton/IconButton';
import Icon from '../../Icon';
import { useTheme } from '../../../hooks/useTheme';
import styles from './ThemeToggle.module.css';

const OPTIONS = [
  { value: 'light', label: 'Light', phone: 'Light' },
  { value: 'dark', label: 'Dark', phone: 'Dark' },
  { value: 'system', label: 'Match my device', phone: 'Match my phone' },
];

const ANNOUNCE = {
  light: 'Light theme on',
  dark: 'Dark theme on',
  system: 'Following your device theme',
};

function Preview({ value }) {
  if (value === 'system') {
    return (
      <span className={styles.pair} aria-hidden="true">
        <Icon name="sun" size={26} />
        <Icon name="moon" size={26} />
      </span>
    );
  }
  return <Icon name={value === 'dark' ? 'moon' : 'sun'} size={value === 'dark' || value === 'light' ? 40 : 26} />;
}

/**
 * Light / Dark / System picker.
 *   variant="tiles"    big tiles with a doodle each (Profile > Appearance)
 *   variant="compact"  three round 44px buttons (phone avatar menu)
 */
export default function ThemeToggle({ variant = 'tiles' }) {
  const { pref, setPref } = useTheme();
  const compact = variant === 'compact';

  const options = OPTIONS.map((o) => ({
    value: o.value,
    label: compact ? o.phone : o.label,
    content: compact ? (
      o.value === 'light' ? <Sun size={22} strokeWidth={2.6} aria-hidden="true" />
        : o.value === 'dark' ? <Moon size={22} strokeWidth={2.6} aria-hidden="true" />
          : <Monitor size={22} strokeWidth={2.6} aria-hidden="true" />
    ) : (
      <span className={styles.tile}>
        <Preview value={o.value} />
        <span>{o.label}</span>
      </span>
    ),
  }));

  return (
    <div className={compact ? styles.compact : undefined}>
      <RadioGroup
        label="Theme"
        value={pref}
        onChange={setPref}
        options={options}
        variant={compact ? 'swatch' : 'tile'}
        className={compact ? styles.compactGroup : undefined}
      />
      <span className={styles.srOnly} aria-live="polite">{ANNOUNCE[pref]}</span>
    </div>
  );
}

/** One icon button that steps Light -> Dark -> System (desktop navbar). */
export function ThemeCycleButton({ className = '' }) {
  const { pref, setPref } = useTheme();
  const next = { light: 'dark', dark: 'system', system: 'light' }[pref];
  const names = { light: 'light', dark: 'dark', system: 'match device' };
  return (
    <IconButton
      label={`Theme: ${names[pref]}. Switch to ${names[next]}`}
      className={className}
      onClick={() => setPref(next)}
    >
      {pref === 'light' ? <Sun size={20} strokeWidth={2.4} aria-hidden="true" />
        : pref === 'dark' ? <Moon size={20} strokeWidth={2.4} aria-hidden="true" />
          : <Monitor size={20} strokeWidth={2.4} aria-hidden="true" />}
    </IconButton>
  );
}
