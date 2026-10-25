import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMenuItems } from '../../../queries/queries';
import Icon from '../../Icon';
import Button from '../../ui/Button/Button';
import MenuBook from '../MenuBook/MenuBook';
import styles from './UsualOrdersCounter.module.css';

function LovedDots({ lovedBy }) {
  const names = lovedBy === 'both' ? ['her', 'him'] : [lovedBy];
  return (
    <span className={styles.dots} aria-hidden="true">
      {names.map((n) => <i key={n} className={n === 'her' ? styles.dotHer : styles.dotHim} />)}
    </span>
  );
}

/** The counter scene on Home: an awning, a sign, and the menu folder that opens the shared menu. */
export default function UsualOrdersCounter() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const { data: items = [], isLoading, isError, refetch } = useMenuItems();

  const sign = isLoading ? '…' : isError ? 'closed for a sec' : items.length === 0 ? 'new menu' : 'open · all day';
  const caption = isError ? 'the menu is hiding' : items.length === 0 && !isLoading ? 'add our first usual' : 'tap the menu, love';
  const disabled = isLoading || isError;

  return (
    <div className={styles.wrap} aria-busy={isLoading || undefined}>
      <div className={styles.scene}>
        <div className={styles.awning} aria-hidden="true" />
        <p className={styles.sign}>{sign}</p>

        <div className={styles.counter}>
          <motion.button
            type="button"
            className={`${styles.folder} ${disabled ? styles.folderOff : ''}`}
            onClick={() => setOpen(true)}
            disabled={disabled}
            aria-label="Open our usual orders menu"
            initial={{ rotate: -4 }}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            whileHover={reduce ? undefined : { y: -6, rotate: 0 }}
            transition={{ duration: 0.08 }}
          >
            <span className={styles.folderInner}>
              <span className={styles.folderLabel}>menu</span>
            </span>
          </motion.button>
          <div className={styles.foods} aria-hidden="true">
            {items.slice(0, 3).map((item) => (
              <Icon key={item.id} name={item.doodle} size={36} />
            ))}
          </div>
        </div>
        <p className={styles.caption}>{caption}</p>
        {isError && (
          <Button size="sm" className={styles.retry} onClick={() => refetch()}>Try again</Button>
        )}
      </div>

      <div className={styles.preview}>
        <ul className={styles.previewList}>
          {items.slice(0, 4).map((item) => (
            <li key={item.id} className={styles.previewItem}>
              <Icon name={item.doodle} size={32} />
              <span className={styles.previewName}>{item.name}</span>
              <LovedDots lovedBy={item.lovedBy} />
            </li>
          ))}
        </ul>
        <Button variant="primary" onClick={() => setOpen(true)} disabled={disabled}>Open the menu</Button>
      </div>

      <MenuBook open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
