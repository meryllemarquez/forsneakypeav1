import { GLYPHS, RORRY_BODY } from '../../Icon/glyphs';
import styles from './PetCharacter.module.css';

const INK = 'var(--icon-ink)';

// Dog drawings are the landing scene's (components/landing/LandingScene.jsx), kept in step by hand
// because that file does not export them. Five dogs, told apart by fur, ears and collar.
const DOG_EARS = {
  floppy: (c) => <path d="M19 19 C9 19 7 33 12 40 C18 38 20 30 21 23 Z" fill={c} />,
  pointy: (c) => <path d="M19 20 L17 3 L31 14 Z" fill={c} />,
  round: (c) => <circle cx="18" cy="17" r="7" fill={c} />,
  long: (c) => <path d="M20 18 C7 20 4 42 12 52 C19 48 21 36 22 25 Z" fill={c} />,
  folded: (c) => (
    <>
      <path d="M19 21 L19 5 L27 8 L31 15 Z" fill={c} />
      <path d="M19 5 L24 11" />
    </>
  ),
};

const DOGS = {
  zizi: { fur: '#F5D68C', belly: '#FFF3D6', ear: 'floppy', earColor: '#D99A4E', collar: '#E0301A' },
  loafie: { fur: '#FFFDF5', belly: '#FFE9D2', ear: 'round', earColor: '#F2C9A0', collar: '#5CB3FF', bodyRx: 21 },
  zoey: { fur: '#B9784A', belly: '#F0D2A8', ear: 'pointy', earColor: '#8A5530', collar: '#FF9F1C' },
  tato: { fur: '#454663', belly: '#D2A070', ear: 'long', earColor: '#2C2D45', collar: '#9DB0FF' },
  cooper: { fur: '#B3BDD1', belly: '#FFFFFF', ear: 'folded', earColor: '#7F8AA3', collar: '#3FB8AF', spot: '#5E6985' },
};

// Mood touches drawn over the dog's own face.
function DogFace({ fur, mood, blush }) {
  const cheeks = mood === 'happy' || mood === 'playful' || blush;
  const opacity = blush ? 0.75 : 0.45;
  return (
    <>
      {cheeks ? (
        <>
          <circle cx="21" cy="32" r="2.8" fill="#FF8FB1" stroke="none" opacity={opacity} />
          <circle cx="43" cy="32" r="2.8" fill="#FF8FB1" stroke="none" opacity={opacity} />
        </>
      ) : null}
      {mood === 'sleepy' ? (
        <>
          <circle cx="25" cy="26" r="2.6" fill={fur} stroke="none" />
          <circle cx="39" cy="26" r="2.6" fill={fur} stroke="none" />
          <path d="M22.4 26 Q25 28.4 27.6 26 M36.4 26 Q39 28.4 41.6 26" />
        </>
      ) : null}
      {mood === 'hungry' ? <path d="M22 22.6 L27.2 23.8 M42 22.6 L36.8 23.8" strokeWidth="1.8" /> : null}
      {mood === 'playful' ? (
        <>
          <circle cx="25.8" cy="25.2" r="0.7" fill="#fff" stroke="none" />
          <circle cx="39.8" cy="25.2" r="0.7" fill="#fff" stroke="none" />
          <path d="M30.4 36.6 Q32 42 33.6 36.6 Z" fill="#FF8FB1" strokeWidth="1.6" />
        </>
      ) : null}
    </>
  );
}

function DogArt({ id, mood, blush }) {
  const { fur, belly, ear, earColor, collar, spot, bodyRx = 17 } = DOGS[id];
  return (
    <>
      <path className={styles.tail} d="M46 50 C55 48 59 40 55 33 C52 40 49 44 44 46 Z" fill={fur} />
      <ellipse cx="32" cy="50" rx={bodyRx} ry="11" fill={fur} />
      <ellipse cx="25" cy="60" rx="5" ry="3" fill={fur} />
      <ellipse cx="39" cy="60" rx="5" ry="3" fill={fur} />
      {DOG_EARS[ear](earColor)}
      <g transform="translate(64 0) scale(-1 1)">{DOG_EARS[ear](earColor)}</g>
      <circle cx="32" cy="28" r="15" fill={fur} />
      {spot ? <circle cx="39" cy="25" r="5.4" fill={spot} stroke="none" /> : null}
      <ellipse cx="32" cy="34" rx="8" ry="6" fill={belly} stroke="none" />
      <circle cx="25" cy="26" r="1.8" fill={INK} stroke="none" />
      <circle cx="39" cy="26" r="1.8" fill={INK} stroke="none" />
      <ellipse cx="32" cy="31.5" rx="2.8" ry="2" fill={INK} stroke="none" />
      <path d="M28.5 36 Q32 39.5 35.5 36" />
      <path d="M19 41 Q32 49 45 41" stroke={collar} strokeWidth="4.6" />
      <circle cx="32" cy="46.5" r="2.2" fill="#FFE680" strokeWidth="1.6" />
      <DogFace fur={fur} mood={mood} blush={blush} />
    </>
  );
}

// Rorry is reversible: teal grumpy side or pink happy side (same drawing as the landing scene).
function RorryArt({ pink }) {
  return (
    <>
      <path d={RORRY_BODY} fill={pink ? '#FF8FB1' : '#3FB8AF'} />
      <path d="M22 18 C26 14 32 13 38 14" stroke="#fff" strokeWidth="2.4" opacity="0.6" />
      {pink ? (
        <>
          <path d="M21.5 32 Q25 27.5 28.5 32 M35.5 32 Q39 27.5 42.5 32" />
          <circle cx="20" cy="38" r="3" fill="#FF5F8F" stroke="none" opacity="0.55" />
          <circle cx="44" cy="38" r="3" fill="#FF5F8F" stroke="none" opacity="0.55" />
          <path d="M26 39.5 Q32 47 38 39.5" />
        </>
      ) : (
        <>
          <path d="M20 26 L29 29 M44 26 L35 29" />
          <circle cx="25" cy="33" r="1.8" fill={INK} stroke="none" />
          <circle cx="39" cy="33" r="1.8" fill={INK} stroke="none" />
          <path d="M26 43 Q32 38 38 43" />
        </>
      )}
    </>
  );
}

const PLUSH_GLYPH = { junebug: 'plush', chimken: 'chimken', skyrie: 'ball' };

/** The 64x64 drawing for a pet, with its mood touches. `pink` is Rorry's current side. */
export default function PetArt({ id, mood, blush, pink }) {
  if (DOGS[id]) return <DogArt id={id} mood={mood} blush={blush} />;
  if (id === 'rorry') return <RorryArt pink={pink} />;
  return GLYPHS[PLUSH_GLYPH[id]] || null;
}
