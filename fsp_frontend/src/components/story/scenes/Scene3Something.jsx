import SceneFrame, { Doodle } from './SceneFrame';
import s from './scenes.module.css';

const STARS = [
  [58, 10], [66, 22], [74, 8], [82, 18], [90, 10], [62, 40], [70, 52], [80, 36], [88, 46], [94, 30], [76, 66], [64, 70], [86, 64], [93, 78],
];
const MEMORIES = [
  { icon: 'camera', x: 30, delay: 0, dur: 8 },
  { icon: 'film', x: 41, delay: 2.4, dur: 9 },
  { icon: 'mic', x: 51, delay: 4.6, dur: 7.5 },
  { icon: 'matcha', x: 61, delay: 1.2, dur: 10 },
  { icon: 'cookie', x: 71, delay: 3.6, dur: 8.5 },
];

export default function Scene3Something() {
  return (
    <SceneFrame label="Chat bubbles turning into floating memories, sunny on one side and starry on the other" className={s.s3}>
      <Doodle name="sun" w={17} className={s.s3Sun} />

      {STARS.map(([x, y], i) => (
        <span key={i} className={s.dot} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.55}s`, animationDuration: `${2 + (i % 3)}s` }} />
      ))}
      <svg className={s.moon} viewBox="0 0 40 40" focusable="false">
        <path d="M26 6 A15 15 0 1 0 34 28 A12 12 0 0 1 26 6 Z" fill="var(--gelato)" stroke="#E8EEFF" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>

      {MEMORIES.map((m) => (
        <div key={m.icon} className={s.s3Lane} style={{ left: `${m.x}%`, animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }}>
          <div className={s.s3Sway} style={{ animationDuration: `${m.dur / 2}s`, animationDelay: `${m.delay}s` }}>
            <span className={s.s3Bubble} style={{ animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }} />
            <Doodle name={m.icon} w={11} className={s.s3Icon} style={{ animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }} />
          </div>
        </div>
      ))}
    </SceneFrame>
  );
}
