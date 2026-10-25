import SceneFrame, { Doodle, HEART_PATH } from './SceneFrame';
import s from './scenes.module.css';

const BITS = [
  { x: 38, d: 0, heart: true },
  { x: 52, d: 0.7, heart: false },
  { x: 64, d: 1.4, heart: true },
  { x: 46, d: 2.1, heart: false },
  { x: 58, d: 2.8, heart: true },
];

// Outline layer first, then the fills on top, so the two hearts read as one joined shape.
function HeartPair({ layer }) {
  const outline = layer === 'outline';
  const props = outline
    ? { fill: 'var(--icon-ink)', stroke: 'var(--icon-ink)', strokeWidth: 5, strokeLinejoin: 'round' }
    : { fill: 'var(--tomato)' };
  return (
    <>
      <g className={s.hLeft}><path d={HEART_PATH} transform="translate(5 8) scale(1.05)" {...props} /></g>
      <g className={s.hRight}><path d={HEART_PATH} transform="translate(45 8) scale(1.05)" {...props} /></g>
    </>
  );
}

export default function Scene7Continued() {
  return (
    <SceneFrame label="Two hearts joined into one, and a blank page with a pen" className={s.s7}>
      <div className={s.heartsBox}>
        <svg viewBox="0 0 90 60" focusable="false" className={s.hearts}>
          <g className={s.beat}>
            <HeartPair layer="outline" />
            <HeartPair layer="fill" />
          </g>
        </svg>
        {BITS.map((b, i) => (
          <span key={i} className={s.bit} style={{ left: `${b.x}%`, animationDelay: `${2.6 + b.d}s`, color: b.heart ? 'var(--tomato)' : 'var(--citrus)' }}>
            {b.heart ? '♥' : '✦'}
          </span>
        ))}
      </div>

      <div className={s.blankPage}>
        <div className={s.writing}>
          <span className={s.written}>to be continued...</span>
          <span className={s.penTrack}>
            <Doodle name="pen" w={11} className={s.pen} />
          </span>
        </div>
      </div>
    </SceneFrame>
  );
}
