// src/components/welcome/CustomKeypad/CustomKeypad.jsx
import { motion } from 'framer-motion';
import styles from './CustomKeypad.module.css';

export default function CustomKeypad({ onKeyPress, onDelete, disabled = false }) {
  // Keypad order: 7-8-9, 4-5-6, 1-2-3
  const keyRows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  return (
    <div className={styles.keypadGrid}>
      {keyRows.map((row) =>
        row.map((digit) => (
          <motion.button
            key={digit}
            type="button"
            disabled={disabled}
            className={styles.keyButton}
            whileTap={{ scale: 0.94 }}
            onClick={() => onKeyPress(digit)}
          >
            {digit}
          </motion.button>
        ))
      )}

      {/* Bottom row: '.' , '0' , Backspace '⌫' */}
      <motion.button
        type="button"
        disabled={disabled}
        className={styles.keyButton}
        whileTap={{ scale: 0.94 }}
        onClick={() => onKeyPress('.')}
      >
        .
      </motion.button>

      <motion.button
        type="button"
        disabled={disabled}
        className={styles.keyButton}
        whileTap={{ scale: 0.94 }}
        onClick={() => onKeyPress('0')}
      >
        0
      </motion.button>

      <motion.button
        type="button"
        disabled={disabled}
        className={`${styles.keyButton} ${styles.deleteButton}`}
        whileTap={{ scale: 0.94 }}
        onClick={onDelete}
        aria-label="Delete"
      >
        ⌫
      </motion.button>
    </div>
  );
}