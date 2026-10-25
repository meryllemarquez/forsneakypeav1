import SceneFrame, { Doodle, Heart } from './SceneFrame';
import s from './scenes.module.css';

function Phone({ side, bubbles, typingAt }) {
  const left = side === 'l';
  return (
    <div className={`${s.phone} ${left ? s.phoneL : s.phoneR}`}>
      <div className={s.phoneNotch} />
      <div className={`${s.chat} ${left ? '' : s.chatR}`}>
        {bubbles.map((b, i) => (
          <span
            key={i}
            className={`${s.msg} ${left ? s.msgSea : s.msgGelato}`}
            style={{ width: `${b.w}%`, animationDelay: `${b.at}s` }}
          />
        ))}
        <span className={`${s.msg} ${s.typing} ${left ? s.msgSea : s.msgGelato}`} style={{ animationDelay: `${typingAt}s` }}>
          <i /><i /><i />
        </span>
      </div>
    </div>
  );
}

export default function Scene2Unexpected() {
  return (
    <SceneFrame label="Two phones exchanging messages while a paper plane carries a tiny heart" className={s.s2}>
      <svg className={s.fill} viewBox="0 0 100 75" preserveAspectRatio="none" focusable="false">
        <path className={s.trail} d="M28 38 Q50 20 72 38" fill="none" stroke="var(--icon-ink)" strokeWidth=".7" strokeDasharray="2 2.2" strokeLinecap="round" />
      </svg>

      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={s.floatBub} style={{ left: `${36 + i * 9}%`, animationDelay: `${i * 1.7}s` }} />
      ))}

      <Phone side="l" bubbles={[{ w: 62, at: 0 }, { w: 48, at: 2.4 }]} typingAt={3.6} />
      <Phone side="r" bubbles={[{ w: 52, at: 1.2 }, { w: 66, at: 3.6 }]} typingAt={2.4} />

      <div className={s.flyX}>
        <div className={s.flyY}>
          <div className={s.flip}>
            <Doodle name="plane" w={18} className={s.plane} />
            <div className={s.string}>
              <svg viewBox="0 0 4 12" focusable="false"><path d="M2 0 V11" stroke="var(--icon-ink)" strokeWidth=".7" fill="none" /></svg>
              <Heart size={5.5} className={s.dangle} />
            </div>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}
