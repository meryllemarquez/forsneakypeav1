import { useId } from 'react';
import SceneFrame, { Doodle } from './SceneFrame';
import s from './scenes.module.css';

// "2023" as star points on a 36x64 grid per digit.
const DIGITS = [
  [[0, 6], [18, 0], [36, 10], [30, 30], [0, 64], [36, 64]],
  [[18, 0], [36, 16], [36, 48], [18, 64], [0, 48], [0, 16], [18, 0]],
  [[0, 6], [18, 0], [36, 10], [30, 30], [0, 64], [36, 64]],
  [[0, 2], [36, 2], [16, 30], [36, 44], [26, 62], [0, 58]],
];
const START_X = 94;
const STEP = 56;
const TOP = 28;
const STAR = 'M0 -5 L1.5 -1.6 L5 -1.5 L2.3 0.8 L3.1 4.4 L0 2.4 L-3.1 4.4 L-2.3 0.8 L-5 -1.5 L-1.5 -1.6 Z';

const pointsOf = (pts, d) => pts.map(([x, y]) => `${START_X + d * STEP + x},${TOP + y}`).join(' ');

export default function Scene1Beginning() {
  const uid = useId().replace(/:/g, '');
  let starIndex = 0;

  return (
    <SceneFrame label="Two figures far apart on a hill under a 2023 constellation" className={s.s1}>
      <div className={`${s.cloud} ${s.cloudA}`} />
      <div className={`${s.cloud} ${s.cloudB}`} />

      <svg className={s.fill} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          {DIGITS.map((pts, d) => (
            <mask id={`${uid}m${d}`} key={d}>
              <polyline
                className={s.draw}
                style={{ animationDelay: `${d * 0.35}s` }}
                points={pointsOf(pts, d)}
                pathLength="100"
                fill="none"
                stroke="#fff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </mask>
          ))}
        </defs>

        {DIGITS.map((pts, d) => (
          <polyline
            key={d}
            mask={`url(#${uid}m${d})`}
            points={pointsOf(pts, d)}
            fill="none"
            stroke="var(--icon-ink)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="0.1 5"
          />
        ))}

        {DIGITS.map((pts, d) =>
          pts.map(([x, y], i) => {
            const n = starIndex++;
            return (
              <g key={`${d}-${i}`} transform={`translate(${START_X + d * STEP + x} ${TOP + y})`}>
                <g className={s.starPop} style={{ animationDelay: `${n * 0.08}s` }}>
                  <path
                    className={s.twinkle}
                    style={{ animationDuration: `${2 + (n % 3)}s`, animationDelay: `${1.6 + (n % 5) * 0.3}s` }}
                    d={STAR}
                    fill="var(--gelato)"
                    stroke="var(--icon-ink)"
                    strokeWidth="1.1"
                    strokeLinejoin="round"
                  />
                </g>
              </g>
            );
          }),
        )}

        <ellipse cx="200" cy="330" rx="320" ry="130" fill="var(--amalfi-tint)" stroke="var(--outline)" strokeWidth="2" />
        <path d="M70 240 q12 -6 24 0 M290 252 q12 -6 24 0 M180 262 q12 -6 24 0" fill="none" stroke="var(--outline)" strokeWidth="1.6" strokeLinecap="round" opacity=".45" />
      </svg>

      <div className={`${s.s1Fig} ${s.s1Her}`}>
        <Doodle name="her" w={21} className={s.bobA} />
      </div>
      <div className={`${s.s1Fig} ${s.s1Him}`}>
        <Doodle name="him" w={21} className={s.bobB} />
      </div>
    </SceneFrame>
  );
}
