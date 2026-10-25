// Body motion per reaction (framer-motion keyframes) and how long each reaction lasts.
// Values come from the pets spec / the landing scene; `size` is the pet's pixel size (160 = spec).

export const REACTION_MS = {
  ate: 1600,
  already_full: 1500,
  played: 1700,
  too_sleepy: 1900,
  hugged: 1500,
  walked: 2900,
};
// With reduced motion nothing moves: a heart or sparkle fades in and the bubble stays ~1.6s.
export const REDUCED_MS = 1700;

/** Keyframes for the pet's body, or null when it does not move (Rorry's flip is sequenced in the component). */
export function bodyMotion(kind, petId, size) {
  const s = size / 160;
  switch (kind) {
    case 'ate':
      return {
        animate: { scaleY: [1, 0.88, 1, 0.9, 1], scaleX: [1, 1.08, 1, 1.06, 1] },
        transition: { duration: 0.9, delay: 0.5, ease: 'easeOut' },
      };
    case 'already_full':
      return { animate: { rotate: [0, -6, -6, 0] }, transition: { duration: 1.2, times: [0, 0.25, 0.75, 1], ease: 'easeInOut' } };
    case 'too_sleepy':
      return { animate: { scale: [1, 0.95, 0.95, 1], y: [0, 3 * s, 3 * s, 0] }, transition: { duration: 1.6, times: [0, 0.25, 0.8, 1] } };
    case 'hugged':
      return {
        animate: { scaleX: [1, 1.14, 1.02, 1.1, 1], scaleY: [1, 0.88, 1, 0.92, 1] },
        transition: { duration: 0.8, ease: 'easeOut' },
      };
    case 'walked':
      // the hop cadence; the left-to-right travel is a separate motion (travelMotion)
      return { animate: { y: [0, -8 * s, 0] }, transition: { duration: 0.25, repeat: 8, ease: 'easeOut' } };
    case 'played':
      if (petId === 'skyrie') {
        const h = 0.5625 * size; // H = 90 at 160px
        return {
          animate: {
            y: [0, -h, 0, -h * 0.43, 0, -h * 0.15, 0],
            scaleY: [1, 1.1, 0.68, 1.05, 0.84, 1.02, 1],
            scaleX: [1, 0.92, 1.26, 0.97, 1.12, 0.99, 1],
          },
          transition: { duration: 1.6, times: [0, 0.3, 0.44, 0.62, 0.76, 0.9, 1], ease: 'easeOut' },
        };
      }
      if (petId === 'chimken') {
        return { animate: { rotate: [0, 6, -6, 4, 0], scaleX: [1, 1.1, 1.1, 1.06, 1] }, transition: { duration: 1.2, ease: 'easeInOut' } };
      }
      if (petId === 'junebug') {
        return { animate: { rotate: [0, 360], y: [0, -22 * s, 0] }, transition: { duration: 0.9, ease: 'easeOut' } };
      }
      if (petId === 'rorry') return null;
      return {
        animate: { y: [0, -34 * s, 0, -18 * s, 0, -8 * s, 0], scaleY: [1, 1.1, 0.82, 1.04, 0.9, 1, 1] },
        transition: { duration: 1.2, ease: 'easeOut' },
      };
    default:
      return null;
  }
}

/** Dogs trot from -40% to +40% of their size, then settle back. */
export function travelMotion(size) {
  return {
    from: { x: -0.4 * size },
    to: { x: 0.4 * size, transition: { duration: 2.2, ease: 'easeInOut' } },
    rest: { x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };
}

// Rorry's flip, same timings as the landing scene.
export const rorryFlipOut = (size) => ({ scaleX: 0, y: -0.1 * size, transition: { duration: 0.17, ease: 'easeIn' } });
export const RORRY_FLIP_IN = { scaleX: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } };
