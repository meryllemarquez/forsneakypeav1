import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, Reorder, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical } from 'lucide-react';
import { useMenuItems } from '../../../queries/queries';
import { useMenuMutations } from '../../../queries/mutations';
import { useNotification } from '../../../hooks/useNotification';
import { MENU_FILTERS, formatPrice } from '../../../constants/menuOptions';
import Icon from '../../Icon';
import Modal from '../../ui/Modal/Modal';
import Button from '../../ui/Button/Button';
import IconButton from '../../ui/IconButton/IconButton';
import Chip from '../../ui/Chip/Chip';
import MenuItemForm from './MenuItemForm';
import styles from './MenuBook.module.css';

const SAVE_DELAY = 600; // ms of no change (button reorders) before the order is sent
const STAGGER_CAP = 12;

function LovedBadge({ lovedBy }) {
  const names = lovedBy === 'both' ? ['her', 'him'] : [lovedBy];
  const label = { her: 'Loved by her', him: 'Loved by him', both: 'Loved by both of us' }[lovedBy];
  return (
    <span className={styles.badge} role="img" aria-label={label}>
      {names.map((n) => <Icon key={n} name={n} size={28} />)}
    </span>
  );
}

function RowText({ item }) {
  const line = [item.place, item.pricePhp != null ? formatPrice(item.pricePhp) : null].filter(Boolean).join(' · ');
  return (
    <span className={styles.text}>
      <span className={styles.name}>{item.name}</span>
      {line && <span className={styles.line}>{line}</span>}
      {item.note && <span className={styles.note}>{item.note}</span>}
    </span>
  );
}

/** The menu sheet: folder cover swings open, foods pop in one by one, add / edit / reorder. */
export default function MenuBook({ open, onClose }) {
  const reduce = useReducedMotion();
  const { addToast } = useNotification();
  const { data: items = [], isLoading, isError, refetch } = useMenuItems();
  const menu = useMenuMutations();

  const [filter, setFilter] = useState('all');
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [intro, setIntro] = useState(true);
  const [announce, setAnnounce] = useState('');
  const dragging = useRef(false);
  const timer = useRef(null);
  const latest = useRef([]);

  // Keep the local reorder list in step with the server list unless a drag is in flight.
  useEffect(() => {
    if (!dragging.current) setOrder(items);
  }, [items]);

  useEffect(() => {
    latest.current = order;
  }, [order]);

  useEffect(() => {
    if (!open) return undefined;
    setIntro(true);
    const t = setTimeout(() => setIntro(false), 1700);
    return () => clearTimeout(t);
  }, [open]);

  const commit = useCallback(async () => {
    clearTimeout(timer.current);
    timer.current = null;
    try {
      await menu.reorderItems(latest.current.map((i) => i.id));
    } catch {
      addToast("Couldn't save the new order.", 'error');
    }
  }, [menu, addToast]);

  const flush = () => {
    if (timer.current) commit();
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const move = (index, delta) => {
    const next = [...order];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    latest.current = next;
    setOrder(next);
    setAnnounce(`Moved ${delta < 0 ? 'up' : 'down'}, position ${target + 1} of ${next.length}`);
    clearTimeout(timer.current);
    timer.current = setTimeout(commit, SAVE_DELAY);
  };

  const toggleReorder = () => {
    if (reordering) flush();
    setReordering((r) => !r);
  };

  const close = () => {
    flush();
    setReordering(false);
    setFilter('all');
    onClose();
  };

  const visible = filter === 'all' ? items : items.filter((i) => i.lovedBy === filter);
  const filtered = filter !== 'all';
  const canReorder = !filtered;

  const rowMotion = (i) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14, scale: 0.94, rotate: -1.5 },
          animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },
          transition: {
            type: 'spring',
            stiffness: 380,
            damping: 20,
            delay: intro ? 0.35 + Math.min(i, STAGGER_CAP) * 0.09 : 0,
          },
        };

  const empty = !isLoading && !isError && items.length === 0;

  return (
    <>
      <Modal open={open} onClose={close} title="Our usual orders" size="lg" className={styles.panel} bodyClassName={styles.body}>
        <motion.div
          className={styles.book}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0.15 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {!reduce && (
            <motion.div
              className={styles.cover}
              aria-hidden="true"
              initial={{ rotateY: 0, opacity: 1 }}
              animate={{ rotateY: -160, opacity: 0 }}
              transition={{
                rotateY: { type: 'spring', stiffness: 120, damping: 16 },
                opacity: { delay: 0.7, duration: 0.2 },
              }}
            >
              <span className={styles.coverLabel}>menu</span>
            </motion.div>
          )}

          <header className={styles.head}>
            <Icon name="utensils" size={32} />
            <p className={styles.sub}>what we always end up ordering</p>
          </header>

          <div className={styles.toolbar}>
            <div className={styles.chips} role="radiogroup" aria-label="Who loves it">
              {MENU_FILTERS.map((f) => (
                <Chip
                  key={f.value}
                  radio
                  active={filter === f.value}
                  onClick={() => {
                    if (reordering && f.value !== 'all') return;
                    setFilter(f.value);
                  }}
                >
                  {f.label}
                </Chip>
              ))}
            </div>
            <div className={styles.actions}>
              <IconButton
                label={reordering ? 'Done reordering' : 'Reorder'}
                variant={reordering ? 'primary' : 'secondary'}
                disabled={!canReorder || items.length < 2}
                onClick={toggleReorder}
                aria-pressed={reordering}
              >
                <ArrowUpDown size={20} aria-hidden="true" />
              </IconButton>
              <Button size="sm" variant="primary" onClick={() => setEditing('new')}>Add to the menu</Button>
            </div>
          </div>
          {!canReorder && items.length > 1 && <p className={styles.hint}>Switch to All to reorder</p>}

          {isLoading && (
            <ul className={styles.list} aria-busy="true">
              {[0, 1, 2, 3].map((i) => <li key={i} className={`${styles.row} ${styles.skeleton}`} />)}
            </ul>
          )}

          {isError && (
            <div className={styles.state} role="alert">
              <p className={styles.stateTitle}>Couldn&rsquo;t open the menu.</p>
              <Button size="sm" onClick={() => refetch()}>Try again</Button>
            </div>
          )}

          {empty && (
            <div className={styles.state}>
              <Icon name="utensils" size={96} />
              <p className={styles.stateTitle}>The menu is empty.</p>
              <p className={styles.stateHand}>what do we always order?</p>
              <Button variant="primary" onClick={() => setEditing('new')}>Add our first usual</Button>
            </div>
          )}

          {!isLoading && !isError && reordering && (
            <Reorder.Group axis="y" values={order} onReorder={setOrder} className={styles.list}>
              {order.map((item, i) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className={`${styles.row} ${styles.rowStatic}`}
                  whileDrag={{ scale: 1.03, boxShadow: '6px 6px 0 var(--outline)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  onDragStart={() => { dragging.current = true; }}
                  onDragEnd={() => { dragging.current = false; commit(); }}
                >
                  <GripVertical className={styles.grip} size={22} aria-hidden="true" />
                  <Icon name={item.doodle} size={52} sticker tilt={i % 2 ? 4 : -4} />
                  <RowText item={item} />
                  <span className={styles.moves}>
                    <IconButton label={`Move ${item.name} up`} size="md" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp size={18} aria-hidden="true" />
                    </IconButton>
                    <IconButton label={`Move ${item.name} down`} size="md" disabled={i === order.length - 1} onClick={() => move(i, 1)}>
                      <ArrowDown size={18} aria-hidden="true" />
                    </IconButton>
                  </span>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}

          {!isLoading && !isError && !reordering && visible.length > 0 && (
            <ul className={styles.list}>
              {visible.map((item, i) => (
                <motion.li key={item.id} className={styles.row} {...rowMotion(i)}>
                  <button type="button" className={styles.rowBtn} onClick={() => setEditing(item)}>
                    <Icon name={item.doodle} size={52} sticker tilt={i % 2 ? 4 : -4} />
                    <RowText item={item} />
                    <LovedBadge lovedBy={item.lovedBy} />
                    <span className={styles.srOnly}>Edit {item.name}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          )}

          {!isLoading && !isError && !reordering && filtered && visible.length === 0 && items.length > 0 && (
            <p className={styles.stateHand}>Nothing here yet, love.</p>
          )}

          <div className={styles.srOnly} role="status" aria-live="polite">{announce}</div>
        </motion.div>
      </Modal>

      <MenuItemForm
        item={editing && editing !== 'new' ? editing : null}
        open={!!editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
