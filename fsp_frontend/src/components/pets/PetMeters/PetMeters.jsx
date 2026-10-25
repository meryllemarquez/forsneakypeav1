import Icon from '../../Icon';
import { energyWord, fullnessWord, joyWord } from '../../../constants/pets';
import styles from './PetMeters.module.css';

const METERS = [
  { key: 'fullness', label: 'Fullness', icon: 'bowl', word: fullnessWord },
  { key: 'energy', label: 'Energy', icon: 'bed', word: energyWord },
  { key: 'joy', label: 'Joy', icon: 'heart', word: joyWord },
];

/**
 * The three soft meters. Each says its state in words and has an icon, so nothing relies on
 * colour alone; role="meter" carries the value for assistive tech. Never red, never alarming.
 */
export default function PetMeters({ pet }) {
  return (
    <ul className={styles.list}>
      {METERS.map(({ key, label, icon, word }) => {
        const value = pet.stats[key];
        const words = word(value);
        return (
          <li key={key} className={styles.row}>
            <span className={styles.label}>
              <Icon name={icon} size={22} />
              {label}
            </span>
            <span
              className={`${styles.track} ${styles[key]}`}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              aria-valuetext={words}
              aria-label={`${pet.name}'s ${label.toLowerCase()}: ${words}`}
            >
              <span className={styles.fill} style={{ width: `${Math.max(4, value)}%` }} />
            </span>
            <span className={styles.word}>{words}</span>
          </li>
        );
      })}
    </ul>
  );
}
