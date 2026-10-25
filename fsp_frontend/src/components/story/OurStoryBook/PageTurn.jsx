import { motion } from 'framer-motion';
import styles from './OurStoryBook.module.css';

const TURN = { duration: 0.8, ease: [0.65, 0, 0.35, 1] };

/**
 * Desktop page curl. One leaf rotates around the spine, lifts a little, and carries a moving shadow
 * (strongest at 90 degrees). Going forward the leaf is the right page (front = its text, back = the next
 * illustration); going back it is the left page (front = its illustration, back = the previous text).
 * Mounted only for the length of a turn, so will-change / 3D cost is not paid the rest of the time.
 */
export default function PageTurn({ direction, front, back, onDone }) {
  const forward = direction > 0;
  const angle = forward ? -180 : 180;

  return (
    <motion.div
      className={`${styles.leaf} ${forward ? styles.leafRight : styles.leafLeft}`}
      initial={{ rotateY: 0, z: 0 }}
      animate={{ rotateY: angle, z: [0, 40, 0] }}
      transition={{ rotateY: TURN, z: { ...TURN, times: [0, 0.5, 1] } }}
      onAnimationComplete={onDone}
    >
      <div className={`${styles.face} ${styles.front}`}>
        {front}
        <motion.span
          className={styles.curlShadow}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ ...TURN, times: [0, 0.5, 1] }}
        />
      </div>
      <div className={`${styles.face} ${styles.back}`}>{back}</div>
    </motion.div>
  );
}
