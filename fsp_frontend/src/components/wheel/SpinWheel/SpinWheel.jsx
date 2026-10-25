import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import Button from '../../ui/Button/Button';
import IconButton from '../../ui/IconButton/IconButton';
import Icon, { ICON_NAMES } from '../../Icon';
import ResultCard from '../ResultCard/ResultCard';
import { useNotification } from '../../../hooks/useNotification';
import { WHEEL_COLOR_BY_KEY, WHEEL_COLORS, defaultWheelColors } from '../../../constants/wheelOptions';
import {
  labelFontSize,
  norm,
  pickWinner,
  polar,
  randomInt,
  rotationFor,
  segmentStep,
  segmentUnderPointer,
  slicePath,
  truncateLabel,
} from '../../../utils/wheelMath';
import styles from './SpinWheel.module.css';

const VIEW = 400;
const C = VIEW / 2;
const SLICE_R = 194; // slices; the 6-unit rim outside is the ink ring
const HUB_R = 22;
const EASE = [0.12, 0.72, 0.12, 1];
const SOUND_KEY = 'fsp-wheel-sound';
const CONFETTI_COUNT = 28;
const CONFETTI_HEARTS = 4;
const CONFETTI_POOL = ['star', 'sparkle', 'daisy', 'tulip'];
const TAU = [0, 0.25, 0.5, 0.75, 1];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hasDoodle = (name) => Boolean(name) && ICON_NAMES.includes(name);

function readSound() {
  try {
    return localStorage.getItem(SOUND_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSound(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? '1' : '0');
  } catch {
    /* private mode: the toggle just won't be remembered */
  }
}

/** 28 pieces: up to 4 hearts, 4 of the winner's doodle, the rest star / sparkle / daisy / tulip. */
function buildConfetti(doodle) {
  const icons = Array(CONFETTI_HEARTS).fill('heart');
  if (hasDoodle(doodle)) icons.push(...Array(4).fill(doodle));
  while (icons.length < CONFETTI_COUNT) icons.push(CONFETTI_POOL[randomInt(CONFETTI_POOL.length)]);
  return icons.map((icon, id) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 220 + Math.random() * 200;
    return {
      id,
      icon,
      size: 22 + Math.round(Math.random() * 8),
      scale: 0.6 + Math.random() * 0.4,
      rotate: (Math.random() * 2 - 1) * 180,
      // Ballistic path sampled at five points: constant velocity plus 260px of gravity.
      x: TAU.map((t) => Math.cos(angle) * speed * t),
      y: TAU.map((t) => Math.sin(angle) * speed * t + 260 * t * t),
    };
  });
}

/**
 * A decision wheel: 2-12 slices, ticking pointer, wobble, doodle confetti and a result card.
 *
 * name      shown on the result card ("Saan kakain? gets...")
 * choices   [{ id, label, color, doodle }]; blank labels are ignored
 * size      CSS length for the wheel diameter (default min(88vw, 340px))
 * onResult  (choice) when the wheel has landed; the winner is decided before the animation
 * onAccept  (choice) when "Let's go" is pressed
 */
export default function SpinWheel({ name = '', choices = [], size, onResult, onAccept, className = '' }) {
  const reduce = useReducedMotion();
  const { addToast } = useNotification();

  const slices = useMemo(() => {
    const valid = choices.filter((c) => c && c.label && c.label.trim());
    const fallback = defaultWheelColors(valid.length);
    return valid.map((c, i) => ({
      ...c,
      label: c.label.trim(),
      color: WHEEL_COLOR_BY_KEY[c.color] ? c.color : fallback[i],
    }));
  }, [choices]);
  const count = slices.length;
  const canSpin = count >= 2;
  const signature = slices.map((s) => `${s.id}:${s.label}:${s.color}`).join('|');

  const rotate = useMotionValue(0);
  const wobble = useMotionValue(0);
  const pointer = useMotionValue(0);
  const wheelRotation = useTransform([rotate, wobble], ([r, w]) => r + w);

  const [spinning, setSpinning] = useState(false);
  const [squashed, setSquashed] = useState(false);
  const [winner, setWinner] = useState(null); // { index, signature }
  const [result, setResult] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [confetti, setConfetti] = useState(null);
  const [hubTurns, setHubTurns] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [sound, setSound] = useState(readSound);

  const live = useRef({});
  live.current = { count, reduce, sound, slices, name, onResult };
  const spinningRef = useRef(false);
  const mountedRef = useRef(true);
  const lastIndexRef = useRef(0);
  const lastTickRef = useRef(0);
  const audioRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    const pending = timers.current;
    return () => {
      mountedRef.current = false;
      pending.forEach(clearTimeout);
      rotate.stop();
      wobble.stop();
      pointer.stop();
      audioRef.current?.close?.().catch(() => {});
    };
  }, [rotate, wobble, pointer]);

  const later = useCallback((fn, ms) => {
    timers.current.push(setTimeout(() => mountedRef.current && fn(), ms));
  }, []);

  const click = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx || ctx.state === 'closed') return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 1400;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    } catch {
      /* audio is a nicety */
    }
  }, []);

  // Pointer flick whenever a slice boundary passes under it. Rate-limited to one per 40ms.
  useEffect(
    () =>
      rotate.on('change', (value) => {
        const { count: n, reduce: still, sound: soundOn } = live.current;
        if (!spinningRef.current || n < 2) return;
        const index = segmentUnderPointer(value, n);
        if (index === lastIndexRef.current) return;
        lastIndexRef.current = index;
        if (still) return;
        const now = performance.now();
        if (now - lastTickRef.current < 40) return;
        lastTickRef.current = now;
        pointer.set(-22);
        animate(pointer, 0, { type: 'spring', stiffness: 600, damping: 18 });
        navigator.vibrate?.(6);
        if (soundOn) click();
      }),
    [rotate, pointer, click]
  );

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    writeSound(next);
  };

  const ensureAudio = () => {
    if (!live.current.sound || audioRef.current) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioRef.current = new Ctx(); // created inside the Spin tap, as browsers require
    } catch {
      audioRef.current = null;
    }
    audioRef.current?.resume?.().catch(() => {});
  };

  const spin = useCallback(async () => {
    const { count: n, reduce: still, slices: snapshot } = live.current;
    if (spinningRef.current || n < 2) return;
    spinningRef.current = true;
    setSpinning(true);
    setCardOpen(false);
    setResult(null);
    setWinner(null);
    setConfetti(null);
    setAnnouncement('');
    ensureAudio();

    // The result is decided first; the animation only reveals it.
    const sig = snapshot.map((s) => `${s.id}:${s.label}:${s.color}`).join('|');
    const { index, angle } = pickWinner(n);
    const chosen = snapshot[index];
    const current = rotate.get();
    const turns = 5 + randomInt(4);
    const target = rotationFor(current, angle, turns);
    lastIndexRef.current = segmentUnderPointer(current, n);

    if (still) {
      rotate.set(target);
    } else {
      setSquashed(true);
      animate(rotate, current - 8, { type: 'spring', stiffness: 300, damping: 22 });
      await sleep(120);
      if (!mountedRef.current) return;
      setSquashed(false);
      await animate(rotate, target, { duration: Math.min(5.4, 4.6 + 0.2 * (turns - 5)), ease: EASE });
      if (!mountedRef.current) return;
    }
    rotate.set(norm(rotate.get()));

    setWinner({ index, signature: sig });
    setAnnouncement(`Result: ${chosen.label}`);
    if (!still) {
      setHubTurns((t) => t + 1);
      setConfetti(buildConfetti(chosen.doodle));
      later(() => setConfetti(null), 1600);
      await animate(wobble, [0, 2.5, -1.2, 0.5, 0], { duration: 0.55, ease: 'easeOut' });
      if (!mountedRef.current) return;
    }
    spinningRef.current = false;
    setSpinning(false);
    live.current.onResult?.(chosen);
    later(
      () => {
        setResult(chosen);
        setCardOpen(true);
      },
      still ? 0 : 350
    );
  }, [rotate, wobble, later]);

  const accept = () => {
    setCardOpen(false);
    onAccept?.(result);
    addToast('Enjoy, love.', 'success');
  };

  const spinAgain = () => {
    setCardOpen(false);
    spin();
  };

  const activeWinner = winner && winner.signature === signature ? winner.index : null;
  const step = segmentStep(count || 1);
  const ariaLabel = canSpin
    ? `Wheel${name ? ` ${name}` : ''} with ${count} choices: ${slices.map((s) => s.label).join(', ')}`
    : 'Empty wheel. Add at least 2 choices.';

  return (
    <div className={`${styles.root} ${className}`} style={size ? { '--wheel-size': typeof size === 'number' ? `${size}px` : size } : undefined}>
      <div className={styles.tools}>
        <IconButton
          label={sound ? 'Turn tick sound off' : 'Turn tick sound on'}
          variant="ghost"
          aria-pressed={sound}
          onClick={toggleSound}
        >
          {sound ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
        </IconButton>
      </div>

      <div className={styles.stage}>
        <motion.div className={styles.pointer} style={{ rotate: pointer }} aria-hidden="true">
          <svg viewBox="0 0 28 34">
            <path className={styles.pointerBody} d="M3 5 Q14 -1 25 5 L14 31 Z" />
            <circle className={styles.pointerPin} cx="14" cy="8" r="3" />
          </svg>
        </motion.div>

        <motion.div className={styles.rotor} style={{ rotate: wheelRotation }}>
          <svg className={styles.svg} viewBox={`0 0 ${VIEW} ${VIEW}`} role="img" aria-label={ariaLabel}>
            <circle className={styles.ring} cx={C} cy={C} r={C} />
            {Array.from({ length: 12 }, (_, i) => {
              const p = polar(C, C, SLICE_R + 3, i * 30 + 15);
              return <circle key={i} className={styles.stud} cx={p.x} cy={p.y} r="1.6" />;
            })}

            {!canSpin && (
              <>
                <circle className={styles.empty} cx={C} cy={C} r={SLICE_R} />
                <text className={styles.emptyText} x={C} y={C + 70}>
                  add 2+ choices
                </text>
              </>
            )}

            {canSpin &&
              slices.map((slice, i) => {
                const a0 = i * step;
                const a1 = (i + 1) * step;
                const color = WHEEL_COLOR_BY_KEY[slice.color] || WHEEL_COLORS[0];
                const doodle = hasDoodle(slice.doodle);
                const text = truncateLabel(slice.label, count);
                const textEnd = doodle ? 146 : 176;
                const length = textEnd - (HUB_R + 18);
                const font = labelFontSize(text.length, length, textEnd - length / 2, count);
                const isWinner = activeWinner === i;
                return (
                  <g key={slice.id ?? i}>
                    <motion.path
                      className={`${styles.slice} ${isWinner && reduce ? styles.sliceWinner : ''}`}
                      d={slicePath(C, C, SLICE_R, a0, a1)}
                      style={{ fill: color.hex, transformOrigin: `${C}px ${C}px` }}
                      animate={isWinner && !reduce ? { scale: [1, 1.04, 1], strokeWidth: [3, 3, 2] } : { scale: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                    <text
                      className={styles.label}
                      transform={`rotate(${a0 + step / 2 - 90} ${C} ${C})`}
                      x={C + textEnd}
                      y={C}
                      textAnchor="end"
                      dominantBaseline="central"
                      fontSize={font}
                      style={{ fill: color.darkFill ? '#FFFFFF' : 'var(--on-bright)' }}
                    >
                      {text}
                    </text>
                  </g>
                );
              })}
          </svg>

          {canSpin && (
            <div className={styles.doodles} aria-hidden="true">
              {slices.map((slice, i) => {
                if (!hasDoodle(slice.doodle)) return null;
                const mid = i * step + step / 2;
                const p = polar(50, 50, (168 / VIEW) * 100, mid);
                return (
                  <div
                    key={slice.id ?? i}
                    className={styles.doodle}
                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) rotate(${mid}deg)` }}
                  >
                    <Icon name={slice.doodle} size="100%" />
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div className={styles.hub} animate={{ rotate: hubTurns * 360 }} transition={{ duration: 0.5, ease: 'easeOut' }} aria-hidden="true">
          <Icon name="sparkle" size="62%" />
        </motion.div>

        {confetti && (
          <div className={styles.confetti} aria-hidden="true">
            {confetti.map((p) => (
              <motion.div
                key={p.id}
                className={styles.piece}
                style={{ width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2 }}
                initial={{ x: 0, y: 0, rotate: 0, scale: p.scale, opacity: 1 }}
                animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: [1, 1, 0] }}
                transition={{
                  duration: 1.4,
                  ease: 'linear',
                  x: { times: TAU, duration: 1.4, ease: 'linear' },
                  y: { times: TAU, duration: 1.4, ease: 'linear' },
                  opacity: { times: [0, 0.7, 1], duration: 1.4, ease: 'linear' },
                }}
              >
                <Icon name={p.icon} size="100%" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <motion.div
        className={styles.spinWrap}
        animate={{ scaleX: squashed ? 1.06 : 1, scaleY: squashed ? 0.92 : 1 }}
        transition={{ duration: 0.12 }}
      >
        <Button variant="primary" className={styles.spin} disabled={!canSpin || spinning} onClick={spin}>
          {spinning ? 'Spinning…' : 'Spin!'}
        </Button>
      </motion.div>
      {!canSpin && <p className={styles.hint}>Add at least 2 choices</p>}

      <div className={styles.srOnly} aria-live="assertive" role="status">
        {announcement}
      </div>

      <ResultCard
        open={cardOpen}
        wheelName={name}
        choice={result}
        reduced={Boolean(reduce)}
        onSpinAgain={spinAgain}
        onAccept={accept}
        onClose={() => setCardOpen(false)}
      />
    </div>
  );
}
