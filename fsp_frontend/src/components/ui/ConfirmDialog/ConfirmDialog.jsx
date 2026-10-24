import { useState } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Icon from '../../Icon';
import styles from './ConfirmDialog.module.css';

/**
 * The one confirmation dialog (delete, replace, discard...). `children` renders in place of the
 * icon (for example a photo thumbnail). Text is remembered while the exit animation plays, so
 * callers can clear their state the moment they close it.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busyLabel = 'Working…',
  busy = false,
  error = '',
  icon = 'bell',
  onConfirm,
  onClose,
  children,
}) {
  const incoming = { title, message, confirmLabel, cancelLabel, icon };
  const [shown, setShown] = useState(incoming);
  if (open && Object.keys(incoming).some((key) => incoming[key] !== shown[key])) setShown(incoming);

  return (
    <Modal open={open} onClose={onClose} role="alertdialog" size="sm" locked={busy} hideClose ariaLabel={shown.title}>
      <div className={styles.content}>
        {children || <Icon name={shown.icon} size={64} sticker tilt={-6} />}
        <h2 className={styles.title}>{shown.title}</h2>
        {shown.message && <p className={styles.message}>{shown.message}</p>}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <Button onClick={onClose} disabled={busy} data-autofocus>
            {shown.cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : shown.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
