import { useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { avatarDoodle } from '../../../utils/avatar';
import Icon, { ICON_NAMES } from '../../Icon';
import Button from '../../ui/Button/Button';
import ConfirmDialog from '../../ui/ConfirmDialog/ConfirmDialog';
import styles from './SpinHistory.module.css';

const UNITS = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function timeAgo(iso) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  if (Number.isNaN(seconds)) return '';
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.trunc(seconds / size), unit);
  }
  return 'just now';
}

/** Last spins of a wheel, newest first: doodle, label, when, who spun and a "went with it" badge. */
export default function SpinHistory({ spins = [], loading, error, onRetry, onClear }) {
  const { user } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = avatarDoodle(user);
  const theirs = mine === 'him' ? 'her' : 'him';

  const clear = async () => {
    setBusy(true);
    try {
      await onClear();
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className={styles.state} role="alert">
        <p>Couldn&apos;t load the history.</p>
        <Button size="sm" onClick={onRetry}>Try again</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <ul className={styles.list} aria-busy="true">
        {[0, 1, 2].map((i) => <li key={i} className={`${styles.row} ${styles.skeleton}`} />)}
      </ul>
    );
  }

  return (
    <div>
      {spins.length === 0 ? (
        <p className={styles.empty}>No spins yet. Go on, spin it.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {spins.map((spin) => (
              <li key={spin.id} className={styles.row}>
                <Icon name={ICON_NAMES.includes(spin.doodle) ? spin.doodle : 'wheel'} size={32} />
                <span className={styles.text}>
                  <span className={styles.label}>{spin.label}</span>
                  <time className={styles.time} dateTime={spin.spunAt}>{timeAgo(spin.spunAt)}</time>
                </span>
                <Icon name={spin.spunBy === user?.id ? mine : theirs} size={22} label={spin.spunBy === user?.id ? 'You' : 'Your partner'} />
                {spin.accepted && (
                  <span className={styles.went}>
                    <Check size={14} strokeWidth={3.5} aria-hidden="true" />
                    <span className={styles.srOnly}>went with it</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className={styles.clear} onClick={() => setConfirm(true)}>
            Clear history
          </Button>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        danger
        icon="wheel"
        title="Clear the history?"
        message="The saved wheel stays, only its spins go."
        confirmLabel="Clear"
        busy={busy}
        busyLabel="Clearing…"
        onConfirm={clear}
        onClose={() => setConfirm(false)}
      />
    </div>
  );
}
