import SceneFrame, { Doodle } from './SceneFrame';
import s from './scenes.module.css';

const WAVE = 'M0 30 Q100 0 200 30 T400 30 T600 30 T800 30';
const FOLLOWERS = [
  { name: 'dog', dx: -24 },
  { name: 'plush', dx: 22 },
  { name: 'ball', dx: -12 },
  { name: 'chimken', dx: 12 },
  { name: 'rorry', dx: 0 },
];

function Hills({ fill, className }) {
  return (
    <div className={`${s.hills} ${className}`}>
      <svg viewBox="0 0 800 100" preserveAspectRatio="none" focusable="false">
        <path d={`${WAVE} L800 100 L0 100 Z`} fill={fill} />
        <path d={WAVE} fill="none" stroke="var(--outline)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export default function Scene6Memory() {
  return (
    <SceneFrame label="A road that goes on over the hills with Motmot riding toward the horizon and the dogs and plushies running along" className={s.s6}>
      <div className={s.sunRays}>
        <svg viewBox="-50 -50 100 100" focusable="false">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="0" y1="-30" x2="0" y2="-47" transform={`rotate(${i * 30})`} stroke="var(--citrus)" strokeWidth="3" strokeLinecap="round" />
          ))}
        </svg>
        <Doodle name="sun" w={17} className={s.s6Sun} />
      </div>

      <Hills fill="var(--amalfi-tint)" className={s.hillBack} />
      <Hills fill="var(--sea-tint)" className={s.hillMid} />
      <Hills fill="var(--paper)" className={s.hillFront} />

      <svg className={s.fill} viewBox="0 0 400 300" preserveAspectRatio="none" focusable="false">
        <path d="M60 300 C120 260 150 210 197 172 L207 172 C230 215 300 260 350 300 Z" fill="#3A3F85" stroke="var(--outline)" strokeWidth="2" strokeLinejoin="round" />
        <path className={s.laneDash} d="M202 172 C200 215 205 260 205 300" fill="none" stroke="var(--gelato)" strokeWidth="4" strokeDasharray="12 16" />
      </svg>

      {FOLLOWERS.map((f, i) => (
        <div key={f.name} className={s.rider} style={{ '--dx': `${f.dx}cqw`, animationDelay: `${0.9 + i * 0.45}s` }}>
          <Doodle name={f.name} w={12} className={s.hop} style={{ animationDelay: `${i * 0.12}s` }} />
        </div>
      ))}
      <div className={`${s.rider} ${s.riderCar}`} style={{ '--dx': '0cqw' }}>
        <Doodle name="motmot" w={27} />
      </div>
    </SceneFrame>
  );
}
