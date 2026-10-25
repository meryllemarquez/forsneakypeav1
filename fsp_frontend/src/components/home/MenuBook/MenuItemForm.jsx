import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { keyFamilies } from '../../../queries/queryKeys';
import { useMenuMutations } from '../../../queries/mutations';
import { useNotification } from '../../../hooks/useNotification';
import { FOOD_DOODLES, LOVED_BY } from '../../../constants/menuOptions';
import Icon from '../../Icon';
import Modal from '../../ui/Modal/Modal';
import Field from '../../ui/Field/Field';
import Button from '../../ui/Button/Button';
import RadioGroup from '../../ui/RadioGroup/RadioGroup';
import ConfirmDialog from '../../ui/ConfirmDialog/ConfirmDialog';
import form from '../../ui/FormControls.module.css';
import styles from './MenuBook.module.css';

const DOODLE_OPTIONS = FOOD_DOODLES.map((d) => ({
  value: d.value,
  label: d.label,
  content: <Icon name={d.value} size={40} />,
}));

const blank = { name: '', doodle: 'utensils', lovedBy: 'both', place: '', price: '', note: '' };

const fromItem = (item) =>
  item
    ? {
        name: item.name,
        doodle: item.doodle,
        lovedBy: item.lovedBy,
        place: item.place || '',
        price: item.pricePhp == null ? '' : String(item.pricePhp),
        note: item.note || '',
      }
    : blank;

/** Add / edit sheet. Mounted only while open so each opening starts from fresh values. */
function FormBody({ item, onClose }) {
  const menu = useMenuMutations();
  const queryClient = useQueryClient();
  const { addToast } = useNotification();
  const [values, setValues] = useState(() => fromItem(item));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'discard' | 'remove'
  const [removeError, setRemoveError] = useState('');

  const initial = fromItem(item);
  const dirty = Object.keys(initial).some((k) => initial[k] !== values[k]);
  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }));
  const onText = (key) => (e) => set(key)(e.target.value);

  const requestClose = () => (dirty && !busy ? setConfirm('discard') : onClose());

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = 'Give it a name, love.';
    const price = values.price.trim() === '' ? null : Number(values.price);
    if (price !== null && (!Number.isInteger(price) || price < 0 || price > 99999)) next.price = 'That price looks off.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      name: values.name.trim(),
      doodle: values.doodle,
      lovedBy: values.lovedBy,
      place: values.place.trim() || null,
      pricePhp: price,
      note: values.note.trim() || null,
    };
    setBusy(true);
    try {
      if (item) await menu.updateItem(item.id, { ...payload, version: item.version });
      else await menu.createItem({ ...payload, afterId: null });
      addToast(item ? 'Saved.' : 'Added to the menu.', 'success');
      onClose();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) setConflict(true);
      else if (status === 404) {
        addToast('That one was taken off the menu.', 'info');
        onClose();
      } else setErrors({ form: err?.response?.data?.message || "Couldn't save that. Try again?" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setRemoveError('');
    try {
      await menu.deleteItem(item.id);
      addToast('Took it off the menu.', 'info');
      setConfirm(null);
      onClose();
    } catch (err) {
      if (err?.response?.status === 404) {
        setConfirm(null);
        onClose();
      } else setRemoveError("Couldn't remove it. Try again?");
    } finally {
      setBusy(false);
    }
  };

  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: keyFamilies.menuItems });
    onClose();
  };

  return (
    <>
      <Modal open onClose={requestClose} title={item ? 'Edit this usual' : 'Add to the menu'} size="md" locked={busy}>
        <form className={styles.form} onSubmit={submit} noValidate>
          <Field label="Name" required error={errors.name}>
            <input
              className={form.input}
              value={values.name}
              onChange={onText('name')}
              maxLength={60}
              placeholder="Mr. B bulalo"
              data-autofocus
            />
          </Field>

          <div>
            <p className={styles.legend}>Doodle</p>
            <RadioGroup
              label="Doodle"
              value={values.doodle}
              onChange={set('doodle')}
              options={DOODLE_OPTIONS}
              className={styles.doodleGrid}
            />
          </div>

          <div>
            <p className={styles.legend}>Who loves it?</p>
            <RadioGroup label="Who loves it?" value={values.lovedBy} onChange={set('lovedBy')} options={LOVED_BY} className={styles.lovedGrid} />
          </div>

          <Field label="Where?" hint="Optional">
            <input className={form.input} value={values.place} onChange={onText('place')} maxLength={80} />
          </Field>

          <Field label="Price" error={errors.price}>
            <div className={styles.priceWrap}>
              <span aria-hidden="true">₱</span>
              <input
                className={form.input}
                value={values.price}
                onChange={onText('price')}
                inputMode="numeric"
                maxLength={5}
                placeholder="0"
              />
            </div>
          </Field>

          <Field label="Note">
            <textarea
              className={`${form.textarea} ${styles.noteInput}`}
              value={values.note}
              onChange={onText('note')}
              maxLength={200}
              rows={2}
              placeholder="extra shot, no ice…"
            />
          </Field>

          {errors.form && <p className={styles.formError} role="alert">{errors.form}</p>}
          {conflict && (
            <p className={styles.formError} role="alert">
              Your love just changed this one. Reload to see their version?{' '}
              <Button size="sm" onClick={reload}>Reload</Button>
            </p>
          )}

          <div className={styles.formButtons}>
            <Button type="submit" variant="primary" loading={busy}>{busy ? 'Saving…' : 'Save to the menu'}</Button>
            <Button variant="ghost" onClick={requestClose} disabled={busy}>Cancel</Button>
            {item && (
              <Button variant="danger" onClick={() => setConfirm('remove')} disabled={busy}>Remove from the menu</Button>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm === 'discard'}
        title="Discard changes?"
        message="What you typed won't be saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={onClose}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'remove'}
        title="Take it off the menu?"
        message={`${item?.name ?? 'This'} will be gone for both of us.`}
        confirmLabel="Remove"
        busyLabel="Removing…"
        busy={busy}
        danger
        error={removeError}
        icon={item?.doodle}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}

export default function MenuItemForm({ open, item, onClose }) {
  if (!open) return null;
  return <FormBody key={item?.id ?? 'new'} item={item} onClose={onClose} />;
}
