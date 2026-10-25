import { motion } from 'framer-motion';
import Icon from '../../Icon/Icon';
import styles from './PetCharacter.module.css';

// Particles are positioned from the centre of the pet's box (x/y in px, w = their size).
function Particle({ size, x, y, w, children, ...motionProps }) {
  return (
    <span className={styles.particle} style={{ left: size / 2 + x - w / 2, top: size / 2 + y - w / 2, width: w, height: w }}>
      <motion.span className={styles.particleInner} {...motionProps}>
        {children}
      </motion.span>
    </span>
  );
}

const CRUMB_DX = [-0.08, 0.02, 0.1];

/** Everything that flies around the pet during one reaction (hearts, food, crumbs, ball, Zzz...). */
export function ReactionFx({ fx, size, reduce }) {
  const s = size;

  // Reduced motion: one soft icon fades in over the pet, nothing travels.
  if (reduce) {
    const icon = { ate: 'heart', hugged: 'heart', played: 'sparkle', walked: 'sparkle' }[fx.kind];
    if (!icon) return null;
    return (
      <Particle size={s} x={0} y={-0.3 * s} w={0.22 * s} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 1.6 }}>
        <Icon name={icon} size={0.22 * s} />
      </Particle>
    );
  }

  switch (fx.kind) {
    case 'ate':
      return (
        <>
          <Particle
            size={s}
            x={0}
            y={0}
            w={0.22 * s}
            initial={{ opacity: 0 }}
            animate={{ x: [-0.6 * s, -0.3 * s, 0], y: [-0.2 * s, -0.55 * s, 0.02 * s], opacity: [0, 1, 1, 0], scale: [1, 1, 0.8, 0.4] }}
            transition={{ duration: 0.5, ease: 'easeIn' }}
          >
            <Icon name={fx.food} size={0.22 * s} />
          </Particle>
          {CRUMB_DX.map((dx, i) => (
            <Particle
              key={dx}
              size={s}
              x={0}
              y={0.04 * s}
              w={0.045 * s}
              initial={{ opacity: 0 }}
              animate={{ x: [0, dx * s], y: [0, 0.2 * s], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.07, ease: 'easeOut' }}
            >
              <span className={styles.crumb} />
            </Particle>
          ))}
        </>
      );
    case 'hugged':
      return [-0.3, -0.1, 0.1, 0.3].map((dx, i) => (
        <Particle
          key={dx}
          size={s}
          x={dx * s}
          y={-0.3 * s}
          w={0.16 * s}
          initial={{ opacity: 0 }}
          animate={{ y: [0, -0.5 * s], opacity: [0, 1, 0], scale: [0.6, 1, 1] }}
          transition={{ duration: 1.2, delay: i * 0.12, ease: 'easeOut' }}
        >
          <Icon name="heart" size={0.16 * s} />
        </Particle>
      ));
    case 'played':
      return (
        <Particle
          size={s}
          x={0.58 * s}
          y={0.3 * s}
          w={0.16 * s}
          initial={{ opacity: 0 }}
          animate={{ y: [0, -0.35 * s, 0, -0.2 * s, 0, -0.08 * s, 0], opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <span className={styles.ball} />
        </Particle>
      );
    case 'too_sleepy':
      return [0, 1, 2].map((i) => (
        <Particle
          key={i}
          size={s}
          x={0.2 * s + i * 0.08 * s}
          y={-0.3 * s}
          w={0.14 * s}
          initial={{ opacity: 0 }}
          animate={{ y: [0, -0.4 * s], x: [0, 0.05 * s, -0.02 * s], opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, delay: i * 0.35, ease: 'easeOut' }}
        >
          <span className={styles.zzz} style={{ fontSize: (0.13 + i * 0.03) * s }}>
            z
          </span>
        </Particle>
      ));
    case 'walked':
      return [-0.32, -0.1, 0.12, 0.34].map((dx, i) => (
        <Particle
          key={dx}
          size={s}
          x={dx * s}
          y={-0.28 * s + (i % 2) * 0.1 * s}
          w={0.14 * s}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.15, 0.8] }}
          transition={{ duration: 0.7, delay: 2.2 + i * 0.1 }}
        >
          <Icon name="sparkle" size={0.14 * s} />
        </Particle>
      ));
    default:
      return null;
  }
}

/** Little dust puffs that trail a walking dog (rendered inside the travelling wrapper). */
export function WalkDust({ size }) {
  return [0, 1, 2, 3, 4, 5].map((i) => (
    <Particle
      key={i}
      size={size}
      x={-0.34 * size}
      y={0.44 * size}
      w={0.09 * size}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.7, 0], scale: [0.4, 1.2], x: -0.08 * size }}
      transition={{ duration: 0.5, delay: 0.25 * i + 0.1 }}
    >
      <span className={styles.dust} />
    </Particle>
  ));
}

/**
 * Soft, ambient hints of how the pet feels. Loops are CSS and stop with reduced motion.
 * Nothing here is alarming: sleepy gets a few "z", hungry a small thought of a snack.
 */
export function MoodBadge({ face, size }) {
  if (face === 'sleepy') {
    return (
      <span className={styles.badge} style={{ left: size * 0.68, top: size * 0.04 }} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.zzzLoop} style={{ animationDelay: `${i * 0.9}s`, fontSize: size * (0.1 + i * 0.03) }}>
            z
          </span>
        ))}
      </span>
    );
  }
  if (face === 'hungry') {
    return (
      <span className={styles.thought} style={{ left: size * 0.66, top: size * 0.0 }} aria-hidden="true">
        <Icon name="bowl" size={size * 0.17} />
      </span>
    );
  }
  if (face === 'playful') {
    return (
      <span className={styles.badge} style={{ left: size * 0.68, top: size * 0.06 }} aria-hidden="true">
        <span className={styles.twinkle}>
          <Icon name="sparkle" size={size * 0.14} />
        </span>
        <span className={styles.twinkle} style={{ animationDelay: '0.6s', marginLeft: size * 0.04 }}>
          <Icon name="sparkle" size={size * 0.09} />
        </span>
      </span>
    );
  }
  return null;
}
