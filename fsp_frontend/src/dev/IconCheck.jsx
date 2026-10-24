// Development-only visual check of the doodle kit, served at /dev/icons.
// App.jsx only registers the route when import.meta.env.DEV is true, so this file
// never reaches the production bundle.
import Icon, { ICON_NAMES } from '../components/Icon';

const STICKERS = [
  ['her', 92, -6],
  ['motmot', 110, -4],
  ['him', 92, 6],
  ['lechon', 86, -8],
  ['ferris', 84, 6],
  ['vinyl', 78, 0],
  ['heart', 66, 10],
];

export default function IconCheck() {
  return (
    <div style={{ padding: 32, background: 'var(--paper)', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, margin: '0 0 16px' }}>Icon check ({ICON_NAMES.length})</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {ICON_NAMES.map((name) => (
          <div key={name} style={{ background: 'var(--white)', border: '2px solid var(--ink)', borderRadius: 20, padding: '12px 6px', textAlign: 'center' }}>
            <Icon name={name} size={64} />
            <div style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: 19 }}>{name}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-around', marginTop: 28, padding: 28, border: '2px solid var(--ink)', borderRadius: 28, background: 'var(--gelato)' }}>
        {STICKERS.map(([name, size, tilt]) => (
          <Icon key={name} name={name} size={size} sticker tilt={tilt} />
        ))}
      </div>
    </div>
  );
}
