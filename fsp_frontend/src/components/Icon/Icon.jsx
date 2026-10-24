import { GLYPHS } from './glyphs';

/**
 * Doodle icon from the for sneakypea kit (47 icons, ported from Icon.dc.html).
 *
 * name    one of ICON_NAMES
 * size    px, square
 * sticker white circle + ink border + solid offset shadow (big happy moments only)
 * tilt    degrees of rotation
 * label   accessible name. Without it the icon is decorative (aria-hidden).
 */
export default function Icon({ name, size = 24, sticker = false, tilt = 0, label, className, style }) {
  const glyph = GLYPHS[name];
  if (!glyph) return null;

  const border = Math.max(2, Math.round(size / 28));
  const wrapStyle = sticker
    ? {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        boxSizing: 'border-box',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--white)',
        border: `${border}px solid var(--ink)`,
        boxShadow: `${border}px ${border + 1}px 0 var(--ink)`,
        transform: `rotate(${tilt}deg)`,
      }
    : {
        display: 'inline-flex',
        flex: 'none',
        width: size,
        height: size,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
      };

  return (
    <span
      className={className}
      style={{ ...wrapStyle, ...style }}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <svg
        viewBox="0 0 64 64"
        width={sticker ? '72%' : '100%'}
        height={sticker ? '72%' : '100%'}
        style={{ display: 'block' }}
        fill="none"
        stroke="#172B70"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        aria-hidden="true"
      >
        {glyph}
      </svg>
    </span>
  );
}
