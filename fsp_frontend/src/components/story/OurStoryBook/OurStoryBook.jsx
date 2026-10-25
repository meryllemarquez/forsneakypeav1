import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Modal from '../../ui/Modal/Modal';
import IconButton from '../../ui/IconButton/IconButton';
import Icon from '../../Icon/Icon';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { PHONE_NAV_QUERY } from '../../../constants/nav';
import { STORY_PAGES, STORY_TITLE } from '../../../constants/ourStory';
import { SCENES } from '../scenes';
import PageTurn from './PageTurn';
import styles from './OurStoryBook.module.css';

const LAST = STORY_PAGES.length; // index 0 is the cover, 1..LAST are the pages
const SLIDE = { type: 'spring', stiffness: 300, damping: 32 };

function ScenePage({ i }) {
  const Scene = SCENES[i - 1];
  return (
    <div className={styles.slot}>
      <Scene />
    </div>
  );
}

/** The text plate: label, heading, one paragraph, optional signature. Scrolls (with a fade) when it overflows. */
function TextPlate({ page, headingRef }) {
  const scrollRef = useRef(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const check = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      ro?.disconnect();
    };
  }, [page.id]);

  return (
    <div className={`${styles.plate} ${more ? styles.more : ''}`}>
      <div className={styles.plateScroll} ref={scrollRef}>
        <p className={styles.pageLabel}>Page {page.number}</p>
        <h2 ref={headingRef} tabIndex={-1} className={styles.heading}>
          {page.title}
        </h2>
        <p className={styles.body}>{page.body}</p>
        {page.signature && <p className={styles.signature}>{page.signature}</p>}
      </div>
      <span className={styles.corner} aria-hidden="true">
        {page.number}
      </span>
    </div>
  );
}

function Cover({ onOpen, desktop, reduce }) {
  let exit;
  if (reduce) exit = { opacity: 0, transition: { duration: 0.15 } };
  else if (desktop) exit = { rotateY: -170, transition: { type: 'spring', stiffness: 90, damping: 16 } };
  else exit = { scale: 1.08, opacity: 0, transition: { duration: 0.4 } };

  return (
    <motion.button
      type="button"
      className={styles.cover}
      data-autofocus
      aria-label="Open the book"
      onClick={onOpen}
      style={{ x: '-50%', y: '-50%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
      exit={exit}
      transition={{ duration: 0.2 }}
    >
      <span className={styles.stitchTop} aria-hidden="true" />
      <span className={styles.stitchBottom} aria-hidden="true" />
      <span className={styles.ribbon} aria-hidden="true" />
      <span className={styles.coverPlate}>{STORY_TITLE}</span>
      <span className={styles.coverStickers} aria-hidden="true">
        <Icon name="her" size={64} sticker tilt={-6} />
        <Icon name="him" size={64} sticker tilt={5} />
      </span>
      <span className={styles.coverHint} aria-hidden="true">
        tap to open
      </span>
    </motion.button>
  );
}

function Dots({ index, onGo }) {
  return (
    <nav className={styles.dots} aria-label="Pages">
      {Array.from({ length: LAST + 1 }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`${styles.dot} ${i === index ? styles.dotOn : ''}`}
          aria-label={i === 0 ? 'Go to the cover' : `Go to page ${i}: ${STORY_PAGES[i - 1].title}`}
          aria-current={i === index ? 'page' : undefined}
          onClick={() => onGo(i)}
        >
          <span />
        </button>
      ))}
    </nav>
  );
}

/** Desktop two-page spread: scene on the left, text on the right, curl between pages. */
function Spread({ index, flip, headingRef, onTurnDone }) {
  const forward = flip ? flip.to > flip.from : true;
  // Going forward, the next illustration is mounted (hidden) under the leaf so it keeps its entry animation
  // running and is simply revealed when the turn ends instead of restarting.
  const leftPages = flip ? (forward ? [flip.from, flip.to] : [flip.to]) : [index];
  const rightPage = flip ? (forward ? flip.to : flip.from) : index;

  return (
    <div className={styles.spread}>
      <div className={styles.half}>
        {leftPages.map((i) => (
          <div key={i} className={styles.layer} style={{ visibility: flip && forward && i === flip.to ? 'hidden' : 'visible' }}>
            <div className={styles.pageScene}>
              <ScenePage i={i} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.half}>
        <div className={styles.pageText}>
          <TextPlate page={STORY_PAGES[rightPage - 1]} headingRef={flip ? undefined : headingRef} />
        </div>
      </div>
      <span className={styles.spine} aria-hidden="true" />
      {flip && (
        <PageTurn
          direction={forward ? 1 : -1}
          onDone={onTurnDone}
          front={
            forward ? (
              <div className={styles.pageText}>
                <TextPlate page={STORY_PAGES[flip.from - 1]} />
              </div>
            ) : (
              <div className={styles.pageScene}>
                <ScenePage i={flip.from} />
              </div>
            )
          }
          back={
            forward ? (
              <div className={styles.pageScene}>
                <ScenePage i={flip.to} />
              </div>
            ) : (
              <div className={styles.pageText}>
                <TextPlate page={STORY_PAGES[flip.to - 1]} />
              </div>
            )
          }
        />
      )}
    </div>
  );
}

/** Phone: one page at a time, sliding, draggable. */
// `custom` (the direction) is supplied by AnimatePresence so the leaving page uses the *current* direction.
const VARIANTS = {
  enter: ({ dir, reduce }) => (reduce ? { opacity: 0 } : { x: `${dir * 100}%`, rotateY: dir * -12, scale: 0.94 }),
  center: { x: 0, rotateY: 0, scale: 1, opacity: 1 },
  exit: ({ dir, reduce }) => (reduce ? { opacity: 0 } : { x: `${dir * -100}%`, rotateY: dir * 12, scale: 0.94 }),
};

function PhonePage({ index, dir, reduce, go, headingRef }) {
  const page = STORY_PAGES[index - 1];
  const settle = (offset, velocity) => {
    if (offset < -70 || velocity < -450) go(index + 1);
    else if (offset > 70 || velocity > 450) go(index - 1);
  };

  return (
    <motion.div
      key={index}
      className={styles.phoneCard}
      custom={{ dir, reduce }}
      variants={VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      transition={reduce ? { duration: 0.15 } : SLIDE}
      drag={reduce ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => settle(info.offset.x, info.velocity.x)}
      onPanEnd={reduce ? (_, info) => settle(info.offset.x, info.velocity.x) : undefined}
      style={{ touchAction: 'pan-y' }}
    >
      <div className={styles.phoneScene}>
        <ScenePage i={index} />
        <button type="button" tabIndex={-1} aria-hidden="true" className={`${styles.edge} ${styles.edgeL}`} onClick={() => go(index - 1)} />
        <button type="button" tabIndex={-1} aria-hidden="true" className={`${styles.edge} ${styles.edgeR}`} onClick={() => go(index + 1)} />
      </div>
      <TextPlate page={page} headingRef={headingRef} />
    </motion.div>
  );
}

/**
 * The storybook: cover + 7 illustrated pages in a full-screen modal.
 * Desktop (> 900px): two-page spread with a 3D curl. Phone: single page that slides and follows the finger.
 * Reduced motion: crossfade only. Text comes from constants/ourStory.js (copy of docs/our-story.md).
 */
export default function OurStoryBook({ open, onClose }) {
  const reduce = useReducedMotion();
  const phone = useMediaQuery(PHONE_NAV_QUERY);
  const desktop = !phone;

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [flip, setFlip] = useState(null);
  const headingRef = useRef(null);

  useEffect(() => {
    if (open) {
      setIndex(0);
      setFlip(null);
      setDir(1);
    }
  }, [open]);

  const go = useCallback(
    (to) => {
      const target = Math.max(0, Math.min(LAST, to));
      if (target === index || flip) return;
      setDir(target > index ? 1 : -1);
      if (desktop && !reduce && index > 0 && target > 0) {
        setFlip({ from: index, to: target });
      } else {
        setIndex(target);
      }
    },
    [index, flip, desktop, reduce],
  );

  const finishTurn = useCallback(() => {
    setFlip((f) => {
      if (f) setIndex(f.to);
      return null;
    });
  }, []);

  // Keys: arrows / Page keys turn, Home / End jump. Escape is handled by Modal.
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  });
  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  });
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const i = indexRef.current;
      let to = null;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') to = i + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') to = i - 1;
      else if (e.key === 'Home') to = 1;
      else if (e.key === 'End') to = LAST;
      if (to === null) return;
      e.preventDefault();
      goRef.current(to);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Each committed page change: move focus to the page heading.
  useEffect(() => {
    if (open && !flip && index > 0) headingRef.current?.focus({ preventScroll: true });
  }, [open, index, flip]);

  const page = index > 0 ? STORY_PAGES[index - 1] : null;
  const announce = page ? `Page ${page.number} of ${LAST}: ${page.title}` : '';

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Our story" size="xl" hideClose className={styles.shell} bodyClassName={styles.shellBody}>
      <div className={styles.root}>
        <div className={styles.top}>
          <IconButton label="Close the book" onClick={onClose} className={index === LAST ? styles.pulse : ''}>
            <X size={20} strokeWidth={2.6} aria-hidden="true" />
          </IconButton>
          {page && (
            <span className={styles.count} aria-hidden="true">
              Page {page.number} of {LAST}
            </span>
          )}
        </div>
        <p className={styles.srOnly} aria-live="polite">
          {announce}
        </p>

        <div className={styles.row}>
          {desktop && (
            <IconButton label="Previous page" onClick={() => go(index - 1)} disabled={index === 0 || !!flip} className={styles.arrow}>
              <ChevronLeft size={22} strokeWidth={2.6} aria-hidden="true" />
            </IconButton>
          )}

          <div className={`${styles.stage} ${desktop ? styles.stageDesk : styles.stagePhone}`}>
            <AnimatePresence>{index === 0 && <Cover key="cover" onOpen={() => go(1)} desktop={desktop} reduce={reduce} />}</AnimatePresence>

            {index > 0 && desktop && (
              <motion.div className={styles.fillAll} initial={{ opacity: reduce ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} key={reduce ? index : 'spread'}>
                <Spread index={index} flip={flip} headingRef={headingRef} onTurnDone={finishTurn} />
              </motion.div>
            )}

            {index > 0 && phone && (
              <div className={styles.phoneStack}>
                <AnimatePresence initial={false} custom={{ dir, reduce }}>
                  <PhonePage key={index} index={index} dir={dir} reduce={reduce} go={go} headingRef={headingRef} />
                </AnimatePresence>
              </div>
            )}
          </div>

          {desktop && (
            <IconButton label="Next page" onClick={() => go(index + 1)} disabled={index === LAST || !!flip} className={styles.arrow}>
              <ChevronRight size={22} strokeWidth={2.6} aria-hidden="true" />
            </IconButton>
          )}
        </div>

        <div className={styles.bottom}>
          {phone && (
            <IconButton label="Previous page" onClick={() => go(index - 1)} disabled={index === 0}>
              <ChevronLeft size={22} strokeWidth={2.6} aria-hidden="true" />
            </IconButton>
          )}
          <Dots index={index} onGo={go} />
          {phone && (
            <IconButton label="Next page" onClick={() => go(index + 1)} disabled={index === LAST}>
              <ChevronRight size={22} strokeWidth={2.6} aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </div>
    </Modal>
  );
}
