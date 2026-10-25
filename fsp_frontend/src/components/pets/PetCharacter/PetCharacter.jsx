import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import PetArt from './petArt';
import { MoodBadge, ReactionFx, WalkDust } from './PetFx';
import { RORRY_FLIP_IN, REACTION_MS, REDUCED_MS, bodyMotion, rorryFlipOut, travelMotion } from './reactions';
import { DOG_FOODS, FALLBACK_LINES, PET_BY_ID, PLUSH_FOODS, faceForMood } from '../../../constants/pets';
import styles from './PetCharacter.module.css';

const REST = { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0 };
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * One of the nine little ones, drawn from the icon kit / landing scene art.
 *
 * id               zizi | loafie | zoey | tato | cooper | junebug | chimken | rorry | skyrie
 * mood             happy | sleepy | hungry | playful (or a server mood: so_happy, content, peckish, ...)
 * size             px, square. The spec's stage size is 160 (phone) / 200 (desktop)
 * reaction         { id, kind, line? } - play a reaction by passing a NEW object (new id) with kind one of
 *                  ate | already_full | played | too_sleepy | hugged | walked (what the actions API returns)
 * idle             breathing / tail wag / sway. Turn off for pets that are not selected
 * onReactionEnd    called with the reaction when it has finished (re-enable the action buttons here)
 *
 * The figure is decorative (aria-hidden); the reaction line is also announced via a polite live region.
 * Reduced motion: no movement at all, a heart or sparkle fades in and the bubble shows for ~1.6s.
 */
export default function PetCharacter({ id, mood = 'happy', size = 160, reaction = null, idle = true, onReactionEnd, className }) {
  const pet = PET_BY_ID[id];
  const reduce = useReducedMotion();
  const face = faceForMood(mood);
  const body = useAnimationControls();
  const travel = useAnimationControls();
  const [fx, setFx] = useState(null);
  const [flips, setFlips] = useState(0);
  const endRef = useRef(onReactionEnd);
  endRef.current = onReactionEnd;

  // Rorry shows the happy pink side when content and the teal grumpy side otherwise; playing flips it.
  const basePink = face === 'happy' || face === 'playful';
  const pink = basePink !== (flips % 2 === 1);
  useEffect(() => setFlips(0), [face]);

  const reactionId = reaction?.id;
  useEffect(() => {
    if (!reaction) return undefined;
    const { kind } = reaction;
    const ms = reduce ? REDUCED_MS : REACTION_MS[kind] || REDUCED_MS;
    let live = true;
    body.set(REST);
    travel.set({ x: 0 });
    setFx({
      ...reaction,
      line: reaction.line || FALLBACK_LINES[kind],
      food: pick(pet?.kind === 'dog' ? DOG_FOODS : PLUSH_FOODS),
    });

    const run = async () => {
      if (reduce) return;
      if (kind === 'played' && id === 'rorry') {
        await body.start(rorryFlipOut(size));
        if (!live) return;
        setFlips((n) => n + 1);
        await body.start(RORRY_FLIP_IN);
        return;
      }
      const m = bodyMotion(kind, id, size);
      if (m) body.start(m.animate, m.transition);
      if (kind === 'walked' && pet?.kind === 'dog') {
        const t = travelMotion(size);
        travel.set(t.from);
        await travel.start(t.to);
        if (live) await travel.start(t.rest);
      }
    };
    run();

    const timer = setTimeout(() => {
      setFx(null);
      endRef.current?.(reaction);
    }, ms);
    return () => {
      live = false;
      clearTimeout(timer);
      body.stop();
      travel.stop();
    };
    // a new reaction is a new id; the other inputs are stable for its duration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactionId]);

  if (!pet) return null;
  const blush = fx?.kind === 'hugged';
  const walking = fx?.kind === 'walked' && !reduce && pet.kind === 'dog';

  return (
    <div
      className={`${styles.root} ${className || ''}`}
      style={{ width: size, height: size }}
      data-kind={pet.kind}
      data-mood={face}
      data-idle={idle && !fx ? 'true' : 'false'}
    >
      <span className={styles.shadow} aria-hidden="true" />
      <motion.div className={styles.fill} animate={travel} aria-hidden="true">
        <motion.div className={styles.fill} animate={body} style={{ transformOrigin: '50% 100%' }}>
          <svg className={styles.svg} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <PetArt id={id} mood={face} blush={blush} pink={pink} />
          </svg>
        </motion.div>
        {walking ? <WalkDust size={size} /> : null}
      </motion.div>

      <div className={styles.fx} aria-hidden="true">
        {fx ? <ReactionFx key={fx.id} fx={fx} size={size} reduce={reduce} /> : <MoodBadge face={face} size={size} />}
      </div>

      <AnimatePresence>
        {fx ? (
          <motion.div
            key={fx.id}
            className={styles.bubble}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.9 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: reduce ? 0.12 : 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {fx.line}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <span className={styles.srOnly} role="status" aria-live="polite">
        {fx ? `${pet.name} says: ${fx.line}` : ''}
      </span>
    </div>
  );
}
