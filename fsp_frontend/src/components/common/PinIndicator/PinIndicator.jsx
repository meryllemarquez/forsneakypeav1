import { motion } from 'framer-motion';
import styles from './PinIndicator.module.css';

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 },
  },
};

export default function PinIndicator({ length = 4, value = '', hasError = false }) {
  const boxes = Array.from({ length });

  return (
    <motion.div
      className={styles.indicatorContainer}
      variants={shakeVariants}
      animate={hasError ? 'shake' : 'idle'}
    >
      {boxes.map((_, index) => {
        const isFilled = index < value.length;
        return (
          <div
            key={index}
            className={`${styles.box} ${hasError ? styles.errorBox : ''}`}
          >
            {isFilled && <span className={styles.dot}>●</span>}
          </div>
        );
      })}
    </motion.div>
  );
}