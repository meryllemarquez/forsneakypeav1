import SceneFrame, { Doodle } from './SceneFrame';
import s from './scenes.module.css';

const TINTS = ['var(--citrus-tint)', 'var(--sea-tint)', 'var(--gelato-tint)', 'var(--amalfi-tint)'];
// Rows bottom to top; a brick with `word` carries one of the four values.
const ROWS = [
  { y: 232, bricks: [{ x: 80, w: 160, word: 'understanding' }, { x: 240, w: 80 }] },
  { y: 192, bricks: [{ x: 80, w: 60 }, { x: 140, w: 110, word: 'patience' }, { x: 250, w: 70 }] },
  { y: 152, bricks: [{ x: 80, w: 90, word: 'trust' }, { x: 170, w: 80 }, { x: 250, w: 70 }] },
  { y: 112, bricks: [{ x: 80, w: 80 }, { x: 160, w: 100, word: 'growth' }, { x: 260, w: 60 }] },
];

export default function Scene5Real() {
  return (
    <SceneFrame label="A little house being built brick by brick; the bricks read understanding, patience, trust and growth" className={s.s5}>
      <svg className={s.fill} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" focusable="false">
        <rect x="-10" y="270" width="420" height="40" fill="#5E9B4E" stroke="var(--outline)" strokeWidth="2" />

        {ROWS.map((row, r) =>
          row.bricks.map((b, c) => (
            <g key={`${r}-${c}`} className={s.brick} style={{ animationDelay: `${0.3 + r * 0.55 + c * 0.15}s` }}>
              <rect x={b.x} y={row.y} width={b.w} height="38" rx="6" fill={b.word ? TINTS[r] : 'var(--white)'} stroke="var(--outline)" strokeWidth="2" />
              {b.word && (
                <text x={b.x + b.w / 2} y={row.y + 25} textAnchor="middle" className={s.brickWord}>
                  {b.word}
                </text>
              )}
            </g>
          )),
        )}

        <g className={s.roof} style={{ animationDelay: '2.7s' }}>
          <rect x="268" y="52" width="24" height="40" fill="var(--citrus-tint)" stroke="var(--outline)" strokeWidth="2" />
          <path d="M62 112 L200 36 L338 112 Z" fill="var(--citrus)" stroke="var(--outline)" strokeWidth="2.4" strokeLinejoin="round" />
        </g>
        <g className={s.roof} style={{ animationDelay: '3.2s' }}>
          <rect x="262" y="222" width="42" height="48" rx="5" fill="var(--sea)" stroke="var(--outline)" strokeWidth="2" />
          <circle cx="296" cy="248" r="2.4" fill="var(--outline)" />
        </g>

        {[0, 1, 2].map((i) => (
          <circle key={i} className={s.smoke} cx="280" cy="48" r={6 + i} style={{ animationDelay: `${3.8 + i * 1.3}s` }} />
        ))}
      </svg>
      <Doodle name="house" w={15} className={s.s5House} />
    </SceneFrame>
  );
}
