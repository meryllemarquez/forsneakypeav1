import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDaysTogether } from '../../constants/relationship';
import styles from './AnniversaryCounter.module.css';

// Animates a count-up from 0 to the real day count on mount/entry — a small,
// premium touch rather than just printing the number instantly.
export default function AnniversaryCounter() {
  const target = getDaysTogether();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId;
    const durationMs = 900;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * target));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return (
    <motion.div className={styles.card} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <span className={styles.label}>Together for</span>
      <span className={styles.value}>{displayValue.toLocaleString()}</span>
      <span className={styles.unit}>Days ❤️</span>
    </motion.div>
  );
}
