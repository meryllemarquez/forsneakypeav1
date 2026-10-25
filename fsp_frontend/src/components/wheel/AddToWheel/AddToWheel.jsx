import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWheels } from '../../../queries/queries';
import { useWheelMutations } from '../../../queries/mutations';
import { useNotification } from '../../../hooks/useNotification';
import { WHEEL_LIMITS, lastWheelId, newChoiceId, nextWheelColor, rememberWheel } from '../../../constants/wheelOptions';
import Modal from '../../ui/Modal/Modal';
import Button from '../../ui/Button/Button';
import RadioGroup from '../../ui/RadioGroup/RadioGroup';
import styles from './AddToWheel.module.css';

/**
 * "Spin for it": adds a menu food to a wheel. Mount it only while a food is chosen. If the last
 * wheel you used still exists the food goes straight in; otherwise a small picker asks which wheel.
 */
export default function AddToWheel({ food, onClose }) {
  const { addToast } = useNotification();
  const { data: wheels, isLoading, isError } = useWheels();
  const { updateWheel } = useWheelMutations();
  const [pick, setPick] = useState(null);
  const [busy, setBusy] = useState(false);
  const tried = useRef(false);

  const addTo = async (wheel) => {
    if (wheel.choices.length >= WHEEL_LIMITS.maxChoices) {
      addToast('12 is the max, love.', 'error');
      return false;
    }
    setBusy(true);
    try {
      await updateWheel(wheel.id, {
        name: wheel.name,
        version: wheel.version,
        choices: [
          ...wheel.choices,
          { id: newChoiceId(), label: food.name.trim().slice(0, WHEEL_LIMITS.maxLabel), color: nextWheelColor(wheel.choices), doodle: food.doodle || null },
        ],
      });
      rememberWheel(wheel.id);
      addToast(`Added ${food.name} to ${wheel.name}`, 'success');
      onClose();
      return true;
    } catch (err) {
      addToast(err?.response?.status === 409 ? 'That wheel just changed. Try again.' : "Couldn't add that to the wheel.", 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  // One shot: skip the picker when the last-used wheel is still there.
  useEffect(() => {
    if (tried.current || !wheels) return;
    tried.current = true;
    const remembered = wheels.find((w) => w.id === lastWheelId());
    if (remembered) addTo(remembered).then((done) => done || onClose());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wheels]);

  const showPicker = !isLoading && wheels && !wheels.find((w) => w.id === lastWheelId());
  const chosen = pick || wheels?.[0]?.id;

  return (
    <Modal open={Boolean(showPicker || isError)} onClose={onClose} title="Add to which wheel?" size="sm" locked={busy}>
      {isError && <p role="alert">Couldn&apos;t load your wheels.</p>}
      {showPicker && wheels.length === 0 && (
        <div className={styles.empty}>
          <p>You don&apos;t have a wheel yet.</p>
          <Link to="/wheel" className={styles.link}>Make one</Link>
        </div>
      )}
      {showPicker && wheels.length > 0 && (
        <div className={styles.body}>
          <RadioGroup
            label="Wheels"
            variant="tile"
            value={chosen}
            onChange={setPick}
            options={wheels.map((w) => ({ value: w.id, label: w.name, content: <span className={styles.name}>{w.name}</span> }))}
            className={styles.group}
          />
          <div className={styles.actions}>
            <Button onClick={onClose} disabled={busy}>Cancel</Button>
            <Button variant="primary" loading={busy} onClick={() => addTo(wheels.find((w) => w.id === chosen))}>
              Add {food.name}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
