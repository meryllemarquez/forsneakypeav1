import { motion } from 'framer-motion';
import styles from './PinIndicator.module.css';

export default function PinIndicator({
  length = 4,
  value = '',
  hasError = false,
  isMasked = true
}) {
  const digits = Array.from({ length }, (_, index) => value[index] || '');

  return (
    <div className={`${styles.container} ${hasError ? styles.errorShake : ''}`}>
      {digits.map((digit, idx) => {
        const isFilled = digit !== '';
        return (
          <motion.div
            key={idx}
            className={`${styles.pinBox} ${isFilled ? styles.filled : ''} ${hasError ? styles.boxError : ''}`}
            initial={{ scale: 1 }}
            animate={{ scale: isFilled ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.2 }}
          >
            {isFilled ? (isMasked ? '●' : digit) : ''}
          </motion.div>
        );
      })}
    </div>
  );
}