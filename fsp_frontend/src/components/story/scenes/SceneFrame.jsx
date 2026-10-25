import Icon from '../../Icon/Icon';
import { usePageVisible } from '../../../hooks/usePageVisible';
import s from './scenes.module.css';

/**
 * Shared box for a story scene: 4:3 by default, labelled as one image, children are decorative.
 * Sizes inside a scene are in cqw (1cqw = 1% of the frame width), so a scene scales as a unit.
 * Ambient loops pause while the tab is hidden and stop entirely under prefers-reduced-motion.
 */
export default function SceneFrame({ label, className = '', children }) {
  const visible = usePageVisible();
  return (
    <div className={`${s.frame} ${className}`} role="img" aria-label={label} data-paused={!visible}>
      <div className={s.inner} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/** An Icon sized in cqw. Position/animate it with `className`. */
export function Doodle({ name, w, className, style }) {
  return <Icon name={name} size={64} className={className} style={{ width: `${w}cqw`, height: `${w}cqw`, ...style }} />;
}

/** Tomato heart path in a 40x40 box. */
export const HEART_PATH = 'M20 35 C4 24 2 14 8 9 C13 5 19 8 20 13 C21 8 27 5 32 9 C38 14 36 24 20 35 Z';

export function Heart({ size, className, style }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={{ width: `${size}cqw`, height: `${size}cqw`, ...style }} focusable="false">
      <path d={HEART_PATH} fill="var(--tomato)" stroke="var(--icon-ink)" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}
