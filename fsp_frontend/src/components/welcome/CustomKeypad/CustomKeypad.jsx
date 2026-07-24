import { motion } from 'framer-motion';
import styles from './CustomKeypad.module.css';

const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DELETE'];

export default function CustomKeypad({ onKeyPress, onDelete, disabled }) {
  return (
    <div className={styles.keypadGrid}>
      {KEYPAD_DIGITS.map((key, index) => {
        if (key === '') {
          return <div key={`empty-${index}`} className={styles.emptySpace} />;
        }

        const isDelete = key === 'DELETE';

        return (
          <motion.button
            key={key}
            type="button"
            className={`${styles.keyButton} ${isDelete ? styles.deleteBtn : ''}`}
            onClick={() => (isDelete ? onDelete() : onKeyPress(key))}
            disabled={disabled}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            {isDelete ? (
              <span className={styles.deleteIcon}>⌫</span>
            ) : (
              <span className={styles.digitText}>{key}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}