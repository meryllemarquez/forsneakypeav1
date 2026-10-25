import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useWheelMutations } from '../../../queries/mutations';
import { useNotification } from '../../../hooks/useNotification';
import {
  WHEEL_COLORS,
  WHEEL_DOODLES,
  WHEEL_LIMITS,
  choicesFromMenu,
  newChoiceId,
  nextWheelColor,
} from '../../../constants/wheelOptions';
import Icon, { ICON_NAMES } from '../../Icon';
import Button from '../../ui/Button/Button';
import IconButton from '../../ui/IconButton/IconButton';
import Field from '../../ui/Field/Field';
import RadioGroup, { ColorSwatchGroup } from '../../ui/RadioGroup/RadioGroup';
import ConfirmDialog from '../../ui/ConfirmDialog/ConfirmDialog';
import form from '../../ui/FormControls.module.css';
import styles from './ChoiceEditor.module.css';

const SAVE_DELAY = 700;
const SWATCHES = WHEEL_COLORS.map((c) => ({ value: c.value, name: c.name, color: c.hex }));
const DOODLE_OPTIONS = [
  { value: '', label: 'No doodle', content: <span className={styles.noDoodle}>none</span> },
  ...WHEEL_DOODLES.filter((d) => ICON_NAMES.includes(d)).map((d) => ({
    value: d,
    label: d,
    content: <Icon name={d} size={32} />,
  })),
];

const colorHex = (key) => WHEEL_COLORS.find((c) => c.value === key)?.hex;
const isValid = (name, choices) =>
  name.trim().length > 0 &&
  choices.length >= WHEEL_LIMITS.minChoices &&
  choices.length <= WHEEL_LIMITS.maxChoices &&
  choices.every((c) => c.label.trim().length > 0);

/**
 * Inline editor for one wheel: name, choices (label, colour, doodle), add / remove, delete.
 * Valid changes autosave 700ms after the last edit; the wheel redraws live through `onDraft`.
 * Re-mount it (key) to reset it to the server copy.
 */
export default function ChoiceEditor({ wheel, menuItems = [], onDraft, onDeleted, onReload }) {
  const { addToast } = useNotification();
  const { updateWheel, deleteWheel } = useWheelMutations();

  const [name, setName] = useState(wheel.name);
  const [choices, setChoices] = useState(wheel.choices);
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error | conflict
  const [colorFor, setColorFor] = useState(null);
  const [doodleFor, setDoodleFor] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const live = useRef({ name, choices });
  const versionRef = useRef(wheel.version);
  const timer = useRef(null);
  const inflight = useRef(false);
  const again = useRef(false);
  const alive = useRef(true);
  const addRef = useRef(null);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    timer.current = null;
    const { name: n, choices: c } = live.current;
    if (!isValid(n, c)) return;
    if (inflight.current) {
      again.current = true;
      return;
    }
    inflight.current = true;
    if (alive.current) setStatus('saving');
    try {
      const saved = await updateWheel(wheel.id, {
        name: n.trim(),
        choices: c.map((x) => ({ ...x, label: x.label.trim() })),
        version: versionRef.current,
      });
      versionRef.current = saved.version;
      if (alive.current) setStatus('saved');
    } catch (err) {
      again.current = false;
      if (alive.current) setStatus(err?.response?.status === 409 ? 'conflict' : 'error');
    } finally {
      inflight.current = false;
    }
    if (again.current) {
      again.current = false;
      save();
    }
  }, [updateWheel, wheel.id]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (timer.current) save(); // don't lose an edit made in the last 700ms
    };
  }, [save]);

  useEffect(() => {
    onDraft?.({ wheelId: wheel.id, name, choices });
  }, [onDraft, wheel.id, name, choices]);

  const edit = (nextName, nextChoices) => {
    setName(nextName);
    setChoices(nextChoices);
    live.current = { name: nextName, choices: nextChoices };
    clearTimeout(timer.current);
    timer.current = null;
    if (isValid(nextName, nextChoices)) {
      timer.current = setTimeout(save, SAVE_DELAY);
    } else {
      setStatus('idle');
    }
  };

  const patch = (id, change) => edit(name, choices.map((c) => (c.id === id ? { ...c, ...change } : c)));

  const addChoice = () => {
    const label = newLabel.trim();
    if (!label || choices.length >= WHEEL_LIMITS.maxChoices) return;
    edit(name, [...choices, { id: newChoiceId(), label: label.slice(0, WHEEL_LIMITS.maxLabel), color: nextWheelColor(choices), doodle: null }]);
    setNewLabel('');
    addRef.current?.focus();
  };

  const remove = (id) => {
    if (choices.length <= WHEEL_LIMITS.minChoices) return;
    setColorFor(null);
    setDoodleFor(null);
    edit(name, choices.filter((c) => c.id !== id));
  };

  const confirmRemoval = async () => {
    setDeleting(true);
    try {
      await deleteWheel(wheel.id);
      setConfirmDelete(false);
      onDeleted?.();
    } catch {
      addToast("Couldn't delete that wheel. Try again.", 'error');
    } finally {
      setDeleting(false);
    }
  };

  const full = choices.length >= WHEEL_LIMITS.maxChoices;
  const atMin = choices.length <= WHEEL_LIMITS.minChoices;
  const valid = isValid(name, choices);
  const canFill = menuItems.length > 0 && choices.length <= WHEEL_LIMITS.minChoices;

  return (
    <div className={styles.editor}>
      <div className={styles.top}>
        <Field label="Wheel name" className={styles.nameField}>
          <input
            className={form.input}
            value={name}
            maxLength={WHEEL_LIMITS.maxName}
            onChange={(e) => edit(e.target.value, choices)}
          />
        </Field>
        <p className={styles.status} aria-live="polite">
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved'}
          {status === 'error' && (
            <>
              Couldn&apos;t save ·{' '}
              <button type="button" className={styles.link} onClick={save}>Retry</button>
            </>
          )}
          {status === 'conflict' && (
            <>
              Someone changed this wheel.{' '}
              <button type="button" className={styles.link} onClick={onReload}>Load their version</button>
            </>
          )}
        </p>
      </div>

      {!valid && (
        <p className={styles.notSaved}>Not saved yet: a wheel needs a name and 2 or more named choices.</p>
      )}

      <ul className={styles.rows}>
        {choices.map((choice, i) => {
          const dupe = choices.findIndex((c) => c.label.trim().toLowerCase() === choice.label.trim().toLowerCase());
          const isDupe = choice.label.trim() !== '' && dupe !== i;
          const empty = choice.label.trim() === '';
          return (
            <li key={choice.id} className={styles.rowWrap}>
              <div className={styles.row}>
                <button
                  type="button"
                  className={styles.dotBtn}
                  aria-label={`Colour for choice ${i + 1}`}
                  aria-expanded={colorFor === choice.id}
                  onClick={() => {
                    setDoodleFor(null);
                    setColorFor(colorFor === choice.id ? null : choice.id);
                  }}
                >
                  <span className={styles.dot} style={{ backgroundColor: colorHex(choice.color) }} />
                </button>
                <input
                  className={`${form.input} ${styles.labelInput}`}
                  aria-label={`Choice ${i + 1}`}
                  aria-invalid={empty || undefined}
                  placeholder="Where to?"
                  maxLength={WHEEL_LIMITS.maxLabel}
                  value={choice.label}
                  onChange={(e) => patch(choice.id, { label: e.target.value })}
                />
                <button
                  type="button"
                  className={styles.doodleBtn}
                  aria-label={`Doodle for choice ${i + 1}`}
                  aria-expanded={doodleFor === choice.id}
                  onClick={() => {
                    setColorFor(null);
                    setDoodleFor(doodleFor === choice.id ? null : choice.id);
                  }}
                >
                  {choice.doodle && ICON_NAMES.includes(choice.doodle) ? (
                    <Icon name={choice.doodle} size={28} />
                  ) : (
                    <span className={styles.noDoodle}>+</span>
                  )}
                </button>
                <IconButton
                  label={`Remove ${choice.label.trim() || `choice ${i + 1}`}`}
                  variant="ghost"
                  disabled={atMin}
                  onClick={() => remove(choice.id)}
                >
                  <X size={18} aria-hidden="true" />
                </IconButton>
              </div>
              {empty && <p className={styles.rowError} role="alert">Give it a name</p>}
              {isDupe && <p className={styles.dupe}>same as #{dupe + 1}</p>}
              {colorFor === choice.id && (
                <ColorSwatchGroup
                  label={`Colour for choice ${i + 1}`}
                  value={choice.color}
                  colors={SWATCHES}
                  onChange={(color) => patch(choice.id, { color })}
                  className={styles.picker}
                />
              )}
              {doodleFor === choice.id && (
                <RadioGroup
                  label={`Doodle for choice ${i + 1}`}
                  value={choice.doodle || ''}
                  options={DOODLE_OPTIONS}
                  onChange={(value) => patch(choice.id, { doodle: value || null })}
                  className={styles.picker}
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.addRow}>
        <input
          ref={addRef}
          className={`${form.input} ${styles.labelInput}`}
          aria-label="Add a choice"
          placeholder="Add a choice…"
          maxLength={WHEEL_LIMITS.maxLabel}
          value={newLabel}
          disabled={full}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addChoice();
            }
          }}
        />
        <Button size="sm" onClick={addChoice} disabled={full || !newLabel.trim()}>
          Add
        </Button>
      </div>
      {full && <p className={styles.hint}>12 is the max, love.</p>}
      {atMin && !full && <p className={styles.hint}>A wheel needs at least 2.</p>}

      <div className={styles.footer}>
        {canFill && (
          <Button size="sm" onClick={() => edit(name, choicesFromMenu(menuItems, choices))}>
            Fill from our usual orders
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
          Delete wheel
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        danger
        icon="wheel"
        title={`Delete '${name.trim() || wheel.name}'`}
        message="Its spin history goes too."
        confirmLabel="Delete"
        busy={deleting}
        busyLabel="Deleting…"
        onConfirm={confirmRemoval}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
