import { useRef } from 'react';
import { motion } from 'framer-motion';
import Modal from '../../ui/Modal/Modal';
import Button from '../../ui/Button/Button';
import Icon, { ICON_NAMES } from '../../Icon';
import styles from './ResultCard.module.css';

/**
 * The "and the winner is" card. No close X: leave with "Spin again" or "Let's go"
 * (Escape / backdrop still dismiss it without choosing).
 */
export default function ResultCard({ open, wheelName, choice, reduced = false, onSpinAgain, onAccept, onClose }) {
  // Keep the last choice on screen while the modal animates out.
  const shown = useRef(choice);
  if (choice) shown.current = choice;
  const current = shown.current;
  const doodle = current?.doodle && ICON_NAMES.includes(current.doodle) ? current.doodle : 'wheel';

  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose ariaLabel="Result" className={styles.modal}>
      <motion.div
        className={styles.card}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 18 }}
      >
        <Icon name={doodle} size={96} sticker tilt={-4} />
        <p className={styles.lead}>{wheelName ? `${wheelName} gets…` : 'And the winner is…'}</p>
        <h2 className={styles.result} tabIndex={-1} data-autofocus>
          {current?.label}
        </h2>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onSpinAgain}>
            Spin again
          </Button>
          <Button variant="primary" onClick={onAccept}>
            Let&apos;s go
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
}
