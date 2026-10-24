import { useState } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Icon from '../../Icon';
import form from '../FormControls.module.css';
import styles from './DeleteAllDialog.module.css';

export const DELETE_ALL_PHRASE = 'delete all';

/**
 * "Delete all" confirmation for a whole section (letters, albums, dates). It spells out that the
 * delete is permanent and hits both accounts, and keeps the button disabled until the phrase is
 * typed. `what` completes the sentence, e.g. "letters and stickers".
 */
export default function DeleteAllDialog({ open, what, busy = false, error = '', onConfirm, onClose }) {
  const [typed, setTyped] = useState('');

  // Start empty every time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTyped('');
  }

  const ready = typed.trim().toLowerCase() === DELETE_ALL_PHRASE;

  return (
    <Modal open={open} onClose={onClose} role="alertdialog" size="sm" locked={busy} hideClose ariaLabel={`Delete all ${what}`}>
      <form
        className={styles.content}
        onSubmit={(e) => {
          e.preventDefault();
          if (ready && !busy) onConfirm();
        }}
      >
        <Icon name="bell" size={64} sticker tilt={-6} />
        <h2 className={styles.title}>Delete all {what}?</h2>
        <p className={styles.message}>
          This deletes all {what} for <strong>both of us</strong>, permanently, from the database. It can&rsquo;t be undone and
          nobody can get them back.
        </p>

        <div className={`${form.field} ${styles.field}`}>
          <label className={form.label} htmlFor="delete-all-phrase">
            Type &ldquo;{DELETE_ALL_PHRASE}&rdquo; to confirm
          </label>
          <input
            id="delete-all-phrase"
            className={form.input}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={busy}
            data-autofocus
          />
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!ready || busy}>
            {busy ? 'Deleting…' : 'Delete all'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
