import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import Modal from '../../ui/Modal/Modal';
import Button from '../../ui/Button/Button';
import IconButton from '../../ui/IconButton/IconButton';
import Icon from '../../Icon/Icon';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { STORY_PAGES } from '../../../constants/ourStory';
import styles from './StoryBook.module.css';

// First line of docs/our-story.md (via the constants copy), cut before the names: nothing reworded.
const FIRST_BODY = STORY_PAGES[0].body;
const FIRST_LINE = `${FIRST_BODY.slice(0, FIRST_BODY.indexOf(', Cj'))}…`;

// Where the book rests (bottom centre), in scene coordinates: on the far hill in the middle, clearly above the tallest name bubble (bubble tops: wide y 570, phone y 536) (LandingScene: 1200x760 wide, 400x800 phone, both "slice", bottom aligned).
const SPOTS = {
  wide: { w: 1200, h: 760, x: 600, y: 550, book: 150 },
  phone: { w: 400, h: 800, x: 200, y: 520, book: 110 },
};
const LABEL_H = 48; // the "psst" line and its arrow, upper-left of the book

const doodle = (size) => ({ width: size, height: size });

/** The cover, drawn with container units so it looks the same at 120px, 200px and 380px wide. */
function CoverArt() {
  return (
    <span className={styles.cover}>
      <span className={styles.spineLine} aria-hidden="true" />
      <span className={styles.pill}>
        <span className={styles.pair} aria-hidden="true">
          <Icon name="her" size={64} style={doodle('21cqw')} />
          <Icon name="him" size={64} style={doodle('21cqw')} />
        </span>
        <span className={styles.coverTitle}>Our story</span>
      </span>
      <span className={styles.since}>since 2023</span>
      {[styles.star1, styles.star2, styles.star3].map((c) => (
        <svg key={c} viewBox="-6 -6 12 12" className={`${styles.star} ${c}`} aria-hidden="true" focusable="false">
          <path d="M0 -5 L1.6 -1.6 L5 0 L1.6 1.6 L0 5 L-1.6 1.6 L-5 0 L-1.6 -1.6 Z" fill="var(--gelato)" />
        </svg>
      ))}
      <span className={styles.ribbon} aria-hidden="true" />
    </span>
  );
}

/** Left page: chapter one, the two of them on a little hill, a paper plane between them, 2023. */
function LeftPage() {
  return (
    <div className={`${styles.page} ${styles.pageLeft}`}>
      <p className={styles.chapter}>chapter one</p>
      <div className={styles.scene}>
        <p className={styles.year}>2023</p>
        <svg className={styles.hill} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <ellipse cx="50" cy="62" rx="74" ry="46" fill="var(--amalfi-tint)" stroke="var(--outline)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <Icon name="her" size={64} className={styles.sceneHer} style={doodle('24cqmin')} />
        <Icon name="him" size={64} className={styles.sceneHim} style={doodle('24cqmin')} />
        <span className={styles.flyX} aria-hidden="true">
          <span className={styles.flyY}>
            <Icon name="plane" size={64} style={doodle('15cqmin')} />
          </span>
        </span>
      </div>
    </div>
  );
}

function RightPage({ onContinue }) {
  return (
    <div className={`${styles.page} ${styles.pageRight}`}>
      <p className={styles.line}>{FIRST_LINE}</p>
      <Button variant="secondary" onClick={onContinue} className={styles.keep}>
        Keep reading inside
      </Button>
    </div>
  );
}

/** The opened book: the cover swings over to reveal the left page; the right page is already there. */
function Spread({ onClose, onContinue, reduce }) {
  const stacked = useMediaQuery('(max-width: 640px)');
  const axis = stacked ? 'rotateX' : 'rotateY';
  const end = stacked ? 180 : -180;

  return (
    <motion.div
      className={`${styles.spread} ${stacked ? styles.stacked : ''}`}
      data-theme="light"
      initial={{ opacity: reduce ? 0 : 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className={styles.leaf}
        initial={{ [axis]: reduce ? end : 0 }}
        animate={{ [axis]: end }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 16, delay: 0.25 }}
      >
        <div className={styles.faceFront}>
          <CoverArt />
        </div>
        <div className={styles.faceBack}>
          <LeftPage />
        </div>
      </motion.div>
      <RightPage onContinue={onContinue} />
      <IconButton label="Close the book" onClick={onClose} className={styles.close} data-autofocus>
        <X size={20} strokeWidth={2.6} aria-hidden="true" />
      </IconButton>
    </motion.div>
  );
}

/**
 * The landing storybook: a closed book resting on the hill (a real button), and the opened two-page
 * spread in a dialog. `hidden` fades the book out while the login card is open.
 */
export default function StoryBook({ phone = false, hidden = false, onContinue }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState(null);

  const place = useCallback(() => {
    const spot = phone ? SPOTS.phone : SPOTS.wide;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.max(vw / spot.w, vh / spot.h);
    const ox = (vw - spot.w * s) / 2;
    const oy = vh - spot.h * s;
    const size = spot.book;
    const height = size * 1.3;

    let left = ox + spot.x * s - size / 2;
    left = Math.max(10, Math.min(left, vw - size - 18));
    let top = oy + spot.y * s - height;

    // Never sit on the title or the button: if the hero reaches over here, drop below it.
    const hero = document.querySelector('[data-landing-hero]');
    if (hero) {
      const r = hero.getBoundingClientRect();
      const overlapsX = r.right > left - 8 && r.left < left + size + 8;
      if (overlapsX) top = Math.max(top, r.bottom + 12 + LABEL_H);
    }
    setBox({ left, top, size });
  }, [phone]);

  useLayoutEffect(() => {
    place();
    window.addEventListener('resize', place);
    // the hero settles a beat after mount (fonts, layout animation)
    const t = setTimeout(place, 700);
    return () => {
      window.removeEventListener('resize', place);
      clearTimeout(t);
    };
  }, [place]);

  useEffect(() => {
    if (!hidden) {
      const t = setTimeout(place, 650);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [hidden, place]);

  const keepReading = () => {
    setOpen(false);
    onContinue?.();
  };

  return (
    <>
      {box && (
        <div
          className={`${styles.spot} ${hidden ? styles.spotHidden : ''}`}
          style={{ left: box.left, top: box.top, width: box.size }}
        >
          <span className={styles.glow} aria-hidden="true" />
          <div className={styles.label} aria-hidden="true">
            <span className={styles.psst}>psst, we wrote it down</span>
            <svg viewBox="0 0 60 34" className={styles.arrow} focusable="false">
              <path d="M8 4 C 28 2 44 10 46 26 M46 26 L38 19 M46 26 L52 17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className={styles.contact} aria-hidden="true" />
          <div className={styles.floater}>
            <button type="button" className={styles.book} aria-label="Open our story book" onClick={() => setOpen(true)} tabIndex={hidden ? -1 : 0}>
              <span className={styles.pages} aria-hidden="true" />
              <CoverArt />
            </button>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Our story" size="lg" hideClose className={styles.sheet} bodyClassName={styles.sheetBody}>
        <Spread onClose={() => setOpen(false)} onContinue={keepReading} reduce={reduce} />
      </Modal>
    </>
  );
}
