import { useState } from 'react';
import ConfirmDialog from '../../ui/ConfirmDialog/ConfirmDialog';
import { useAuth } from '../../../hooks/useAuth';

/**
 * The one "Leave for now?" dialog shared by every sign-out entry point (phone avatar menu,
 * desktop navbar, admin sidebar). `onLoggedOut` runs after a successful sign-out (admin navigates).
 */
export default function LogoutConfirm({ open, onClose, onLoggedOut }) {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      await logout();
      onClose();
      onLoggedOut?.();
    } catch {
      setError("Couldn't sign you out. Try again?");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (busy) return;
    setError('');
    onClose();
  };

  return (
    <ConfirmDialog
      open={open}
      icon="house"
      title="Leave for now?"
      message="We'll keep everything safe until you're back, love."
      confirmLabel="Leave"
      cancelLabel="Stay"
      busyLabel="Leaving…"
      busy={busy}
      error={error}
      onConfirm={handleConfirm}
      onClose={handleClose}
    />
  );
}
