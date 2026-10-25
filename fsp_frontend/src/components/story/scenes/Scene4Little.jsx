import SceneFrame, { Doodle, Heart } from './SceneFrame';
import s from './scenes.module.css';

const STARS = [[6, 8], [16, 20], [27, 6], [38, 16], [47, 5], [55, 24], [63, 10], [72, 20], [84, 8], [92, 22], [10, 34], [44, 32]];
const FOOD = ['fries', 'yogurt', 'churro'];
const DROPS = [83, 85, 87, 89, 91, 84, 88, 92];

function Lamp({ side }) {
  const left = side === 'l';
  return (
    <div className={`${s.lamp} ${left ? s.lampL : s.lampR}`}>
      <span className={s.halo} style={{ animationDelay: left ? '0s' : '-2s' }} />
      <svg viewBox="0 0 40 120" focusable="false">
        <path d={left ? 'M10 120 V14 Q10 6 20 6 H34' : 'M30 120 V14 Q30 6 20 6 H6'} fill="none" stroke="var(--icon-ink)" strokeWidth="3" strokeLinecap="round" />
        <rect x={left ? 28 : 0} y="6" width="12" height="7" rx="3" fill="var(--glow)" stroke="var(--icon-ink)" strokeWidth="1.6" />
      </svg>
    </div>
  );
}

export default function Scene4Little() {
  return (
    <SceneFrame
      label="Motmot parked by the highway at night with the two of them sitting together, food around and a rain cloud with a heart umbrella"
      className={s.s4}
    >
      {STARS.map(([x, y], i) => (
        <span key={i} className={s.dot} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 4) * 0.7}s`, animationDuration: `${2.4 + (i % 3)}s` }} />
      ))}

      <div className={s.road}><span className={s.lane} /></div>
      <Lamp side="l" />
      <Lamp side="r" />

      <div className={s.sign}>
        <span className={s.signPlate}>NLEX</span>
        <span className={s.signPost} />
      </div>

      <Doodle name="motmot" w={37} className={s.s4Car} />

      <div className={s.pair}>
        <Doodle name="her" w={14} className={`${s.lean} ${s.leanA}`} />
        <Doodle name="him" w={14} className={`${s.lean} ${s.leanB}`} />
      </div>

      {FOOD.map((name, i) => (
        <div key={name} className={s.orbit}>
          <div className={s.orbX} style={{ '--i': i, animationDelay: `${-i * 6}s` }}>
            <div className={s.orbY} style={{ animationDelay: `${-i * 6 - 4.5}s` }}>
              <Doodle name={name} w={11} />
            </div>
          </div>
        </div>
      ))}

      <svg className={s.cloud4} viewBox="0 0 130 66" focusable="false">
        <path d="M20 60 Q4 60 6 44 Q8 30 24 32 Q28 14 48 16 Q60 4 78 14 Q96 6 106 24 Q124 24 124 44 Q124 60 108 60 Z" fill="var(--sea-tint)" stroke="var(--icon-ink)" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
      {DROPS.map((x, i) => (
        <span key={i} className={s.drop} style={{ left: `${x}%`, animationDelay: `${(i * 0.37) % 1.1}s` }} />
      ))}

      <div className={s.umbrella}>
        <svg viewBox="0 0 120 84" focusable="false">
          <path d="M60 44 V74 Q60 82 52 80" fill="none" stroke="var(--icon-ink)" strokeWidth="3" strokeLinecap="round" />
          <path d="M4 44 Q60 -14 116 44 Q102 36 88 44 Q74 36 60 44 Q46 36 32 44 Q18 36 4 44 Z" fill="var(--citrus)" stroke="var(--icon-ink)" strokeWidth="2.6" strokeLinejoin="round" />
        </svg>
        <Heart size={5} className={s.umbHeart} />
      </div>
    </SceneFrame>
  );
}
