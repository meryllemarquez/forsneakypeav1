// HAND-EDITED NOW. Started as a port of docs/rebrand/Icon.dc.html (viewBox 0 0 64 64), but the
// motmot, plush, ball (Skyrie), chimken and rorry drawings were redrawn by hand. Do NOT regenerate
// this file from Icon.dc.html: that would overwrite them.
// The wrapping <svg> (fill none, ink stroke 2.6, round caps/joins) lives in Icon.jsx.

// Rorry's body outline, shared with the landing scene (it draws both sides of the reversible plush).
export const RORRY_BODY =
  'M13 34 C13 12 51 12 51 34 C51 42 55 48 51 54 C48 58 44 54 43 49 C42 56 36 58 34 52 C33 58 27 58 26 52 C24 57 18 58 15 54 C11 48 13 42 13 34 Z';

export const GLYPHS = {
  motmot: (
    <>
      <circle cx="16" cy="47" r="8" fill="#5CB3FF" />
      <circle cx="50" cy="47" r="8" fill="#5CB3FF" />
      <circle cx="16" cy="47" r="2" fill="currentColor" />
      <circle cx="50" cy="47" r="2" fill="currentColor" />
      <path d="M5 42 C5 34 12 31 22 31 L31 33 L29 41 H5 Z" fill="#E0301A" />
      <path d="M28 41 H40 L39 45 H27 Z" fill="#E0301A" />
      <path d="M40 43 L37 22 C37 19 41 19 43 22 L48 38 L47 44 Z" fill="#E0301A" />
      <path d="M13 28 H30 C32 28 32 31 30 31 H13 C11 31 11 28 13 28 Z" fill="currentColor" />
      <path d="M43 22 L52 45" />
      <path d="M39 17 H48 M41 17 L42 21" />
      <circle cx="52" cy="25" r="2.6" fill="#FFE680" />
      <path d="M46 39 C50 35 58 37 58 42" fill="#E0301A" />
      <path d="M7 46 H19" />
    </>
  ),
  camera: (
    <>
      <rect x="10" y="22" width="48" height="32" rx="8" fill="#5CB3FF" stroke="none" />
      <circle cx="34" cy="38" r="10" fill="#FF9F1C" stroke="none" />
      <rect x="8" y="20" width="48" height="32" rx="8" />
      <path d="M22 20 L26 13 H38 L42 20" />
      <circle cx="32" cy="36" r="10" />
      <circle cx="32" cy="36" r="4.5" />
      <path d="M45 26 H50" />
    </>
  ),
  film: (
    <>
      <rect x="12" y="16" width="44" height="36" rx="5" fill="#FFE680" stroke="none" />
      <rect x="17" y="27" width="13" height="14" rx="2" fill="#E0301A" stroke="none" />
      <rect x="36" y="27" width="13" height="14" rx="2" fill="#5CB3FF" stroke="none" />
      <rect x="10" y="14" width="44" height="36" rx="5" />
      <path d="M10 22 H54 M10 42 H54" />
      <path d="M16 18 v0.1 M24 18 v0.1 M32 18 v0.1 M40 18 v0.1 M48 18 v0.1 M16 46 v0.1 M24 46 v0.1 M32 46 v0.1 M40 46 v0.1 M48 46 v0.1" strokeWidth="3.4" />
      <rect x="15" y="25" width="13" height="14" rx="2" />
      <rect x="34" y="25" width="13" height="14" rx="2" />
    </>
  ),
  star: (
    <>
      <path d="M34 10 L41 26 L58 27 L45 38 L49 55 L34 46 L19 55 L23 38 L10 27 L27 26 Z" fill="#FF9F1C" stroke="none" />
      <path d="M32 8 L39 24 L56 25 L43 36 L47 53 L32 44 L17 53 L21 36 L8 25 L25 24 Z" />
      <path d="M53 6 v6 M50 9 h6" />
    </>
  ),
  tulip: (
    <>
      <path d="M24 20 C24 32 30 34 34 34 C38 34 44 32 44 20 L39 25 L34 16 L29 25 Z" fill="#E0301A" stroke="none" />
      <path d="M34 52 C26 50 22 42 23 36 C30 38 34 44 34 52 Z" fill="#5CB3FF" stroke="none" />
      <path d="M34 48 C42 46 46 40 45 34 C38 36 34 42 34 48 Z" fill="#5CB3FF" stroke="none" />
      <path d="M32 58 V31" />
      <path d="M22 18 C22 30 28 32 32 32 C36 32 42 30 42 18 L37 23 L32 14 L27 23 Z" />
      <path d="M32 50 C24 48 20 40 21 34 C28 36 32 42 32 50" />
      <path d="M32 46 C40 44 44 38 43 32 C36 34 32 40 32 46" />
    </>
  ),
  daisy: (
    <>
      <path d="M32 46 V60 M32 54 C27 50 24 50 21 52" />
      <ellipse cx="32" cy="15" rx="5" ry="9" fill="#FFFFFF" transform="rotate(0 32 26)" />
      <ellipse cx="32" cy="15" rx="5" ry="9" fill="#FFFFFF" transform="rotate(45 32 26)" />
      <ellipse cx="32" cy="15" rx="5" ry="9" fill="#FFFFFF" transform="rotate(90 32 26)" />
      <ellipse cx="32" cy="15" rx="5" ry="9" fill="#FFFFFF" transform="rotate(135 32 26)" />
      <ellipse cx="32" cy="15" rx="5" ry="9" fill="#FFFFFF" transform="rotate(180 32 26)" />
      <ellipse cx="32" cy="15" rx="5" ry="9" fill="#FFFFFF" transform="rotate(225 32 26)" />
      <ellipse cx="32" cy="15" rx="5" ry="9" fill="#FFFFFF" transform="rotate(270 32 26)" />
      <ellipse cx="32" cy="15" rx="5" ry="9" fill="#FFFFFF" transform="rotate(315 32 26)" />
      <circle cx="33" cy="27" r="6.5" fill="#FF9F1C" stroke="none" />
      <circle cx="32" cy="26" r="6.5" />
    </>
  ),
  mic: (
    <>
      <circle cx="34" cy="21" r="10" fill="#5CB3FF" stroke="none" />
      <path d="M28 31 L31 56 H37 L40 31 Z" fill="#FF9F1C" stroke="none" />
      <circle cx="32" cy="19" r="10" />
      <path d="M26 29 L29 54 H35 L38 29" />
      <path d="M25 15 C29 18 35 18 39 15 M23 21 C29 24 35 24 41 21" />
      <path d="M47 10 c2 2 2 5 0 7 M51 7 c4 4 4 10 0 14" />
    </>
  ),
  car: (
    <>
      <path d="M10 44 V38 C10 34 13 32 17 32 H22 L28 22 H44 L51 32 H54 C57 32 59 35 59 38 V44 Z" fill="#E0301A" stroke="none" />
      <path d="M30 25 H42 L46 31 H26 Z" fill="#5CB3FF" stroke="none" />
      <path d="M8 42 V36 C8 32 11 30 15 30 H20 L26 20 H42 L49 30 H52 C55 30 57 33 57 36 V42 Z" />
      <path d="M28 23 H40 L44 29 H24 Z" />
      <circle cx="33" cy="36" r="3.5" />
      <circle cx="19" cy="44" r="6" fill="#FFFFFF" />
      <circle cx="46" cy="44" r="6" fill="#FFFFFF" />
      <circle cx="19" cy="44" r="1.4" />
      <circle cx="46" cy="44" r="1.4" />
    </>
  ),
  rc: (
    <>
      <rect x="14" y="26" width="40" height="28" rx="9" fill="#FF9F1C" stroke="none" />
      <rect x="12" y="24" width="40" height="28" rx="9" />
      <path d="M44 24 L50 9" />
      <circle cx="50" cy="8" r="2.2" />
      <circle cx="23" cy="38" r="5" fill="#5CB3FF" />
      <circle cx="41" cy="38" r="5" fill="#5CB3FF" />
      <path d="M30 31 h4" />
    </>
  ),
  dog: (
    <>
      <path d="M20 32 C20 22 26 18 34 18 C42 18 48 22 48 32 C48 44 42 52 34 52 C26 52 20 44 20 32 Z" fill="#FFE680" stroke="none" />
      <path d="M21 24 C14 24 10 34 14 42 C18 40 20 34 21 30 Z" fill="#FF9F1C" stroke="none" />
      <path d="M47 24 C54 24 58 34 54 42 C50 40 48 34 47 30 Z" fill="#FF9F1C" stroke="none" />
      <path d="M18 30 C18 20 24 16 32 16 C40 16 46 20 46 30 C46 42 40 50 32 50 C24 50 18 42 18 30 Z" />
      <path d="M19 22 C12 22 8 32 12 40 C16 38 18 32 19 28" />
      <path d="M45 22 C52 22 56 32 52 40 C48 38 46 32 45 28" />
      <circle cx="26" cy="30" r="1.8" fill="currentColor" />
      <circle cx="38" cy="30" r="1.8" fill="currentColor" />
      <ellipse cx="32" cy="37" rx="3.2" ry="2.2" fill="currentColor" />
      <path d="M28 41 C30 43.5 34 43.5 36 41" />
    </>
  ),
  plush: (
    <>
      <path d="M32 9 V4" stroke="#8B5A2B" strokeWidth="3.4" />
      <path d="M32 9 C42 9 46 23 50 36 C54 50 44 58 32 58 C20 58 10 50 14 36 C18 23 22 9 32 9 Z" fill="#7FB35A" />
      <ellipse cx="32" cy="45" rx="13" ry="11" fill="#FFF3C4" stroke="none" />
      <circle cx="32" cy="46" r="6" fill="#8B5A2B" />
      <ellipse cx="10.5" cy="40" rx="3.4" ry="2.4" fill="#8B5A2B" />
      <ellipse cx="53.5" cy="40" rx="3.4" ry="2.4" fill="#8B5A2B" />
      <ellipse cx="23" cy="58.5" rx="4" ry="2.4" fill="#8B5A2B" />
      <ellipse cx="41" cy="58.5" rx="4" ry="2.4" fill="#8B5A2B" />
      <circle cx="26" cy="27" r="1.7" fill="currentColor" />
      <circle cx="38" cy="27" r="1.7" fill="currentColor" />
      <circle cx="22" cy="31" r="2.6" fill="#FF8FA3" stroke="none" opacity="0.8" />
      <circle cx="42" cy="31" r="2.6" fill="#FF8FA3" stroke="none" opacity="0.8" />
      <path d="M29 31 c1.2 1.8 4.8 1.8 6 0" />
    </>
  ),
  ball: (
    <>
      <circle cx="14" cy="31" r="7" fill="#FFFFFF" />
      <circle cx="50" cy="31" r="7" fill="#FFFFFF" />
      <circle cx="14" cy="31" r="3.4" fill="#FFB3C7" stroke="none" />
      <circle cx="50" cy="31" r="3.4" fill="#FFB3C7" stroke="none" />
      <circle cx="32" cy="38" r="20" fill="#FFFFFF" />
      <circle cx="13" cy="44" r="6" fill="#FFFFFF" />
      <circle cx="51" cy="44" r="6" fill="#FFFFFF" />
      <circle cx="32" cy="38" r="19" fill="#FFFFFF" stroke="none" />
      <circle cx="13" cy="44" r="5" fill="#FFFFFF" stroke="none" />
      <circle cx="51" cy="44" r="5" fill="#FFFFFF" stroke="none" />
      <ellipse cx="24.5" cy="40" rx="4.4" ry="3.8" fill="#FFB3C7" />
      <ellipse cx="39.5" cy="40" rx="4.4" ry="3.8" fill="#FFB3C7" />
      <circle cx="24.5" cy="40" r="1.7" fill="currentColor" />
      <circle cx="39.5" cy="40" r="1.7" fill="currentColor" />
      <ellipse cx="32" cy="46" rx="3.2" ry="2.5" fill="currentColor" />
      <path d="M28 50 Q32 53.5 36 50" />
      <path d="M12 31 C12 4 52 4 52 31 Z" fill="#FF8FB1" />
      <path d="M12 31 C12 11 52 11 52 31 Z" fill="#FFE680" />
      <path d="M12 31 C12 17 52 17 52 31 Z" fill="#3FB8AF" />
      <path d="M12 31 C12 23 52 23 52 31 Z" fill="#FFC53D" />
      <rect x="10" y="29" width="44" height="6" rx="3" fill="#FFC53D" />
      <circle cx="32" cy="7" r="4.4" fill="#FF8FB1" />
      <path d="M21 16 C23 12 27 10 30 10" stroke="#FFFFFF" strokeWidth="2.4" />
    </>
  ),
  chimken: (
    <>
      <path d="M17 12 L14 6" stroke="#8B5A2B" strokeWidth="3.4" />
      <ellipse cx="32" cy="34" rx="28" ry="15" fill="#7FB35A" />
      <ellipse cx="29" cy="40" rx="19" ry="8" fill="#FFF3C4" stroke="none" />
      <circle cx="27" cy="41" r="4.2" fill="#8B5A2B" />
      <ellipse cx="46" cy="51" rx="3.6" ry="2.4" fill="#8B5A2B" />
      <ellipse cx="18" cy="51" rx="3.6" ry="2.4" fill="#8B5A2B" />
      <ellipse cx="56" cy="39" rx="2.4" ry="3.2" fill="#8B5A2B" />
      <circle cx="46" cy="30" r="1.6" fill="currentColor" />
      <circle cx="54" cy="30" r="1.6" fill="currentColor" />
      <circle cx="43" cy="35" r="2.3" fill="#FF8FA3" stroke="none" opacity="0.8" />
      <circle cx="57" cy="35" r="2.3" fill="#FF8FA3" stroke="none" opacity="0.8" />
      <path d="M48 34 c1 1.6 3 1.6 4 0" />
    </>
  ),
  rorry: (
    <>
      <path d="M13 34 C13 12 51 12 51 34 C51 42 55 48 51 54 C48 58 44 54 43 49 C42 56 36 58 34 52 C33 58 27 58 26 52 C24 57 18 58 15 54 C11 48 13 42 13 34 Z" fill="#3FB8AF" />
      <path d="M20 26 L29 29 M44 26 L35 29" />
      <circle cx="25" cy="33" r="1.8" fill="currentColor" />
      <circle cx="39" cy="33" r="1.8" fill="currentColor" />
      <path d="M26 43 Q32 38 38 43" />
    </>
  ),
  mountain: (
    <>
      <path d="M8 48 L24 24 L34 36 L42 26 L60 48 Z" fill="#5CB3FF" stroke="none" />
      <circle cx="50" cy="15" r="5.5" fill="#FF9F1C" stroke="none" />
      <path d="M6 46 L22 22 L32 34 L40 24 L58 46 Z" />
      <circle cx="48" cy="13" r="5.5" />
      <path d="M8 56 C16 51 24 57 32 52 C40 47 48 53 56 49" stroke="#1F55C9" />
    </>
  ),
  museum: (
    <>
      <path d="M10 26 L34 12 L58 26 Z" fill="#E0301A" stroke="none" />
      <rect x="12" y="50" width="46" height="7" rx="2" fill="#FFE680" stroke="none" />
      <path d="M8 24 L32 10 L56 24 Z" />
      <path d="M10 27 H54" />
      <path d="M16 30 V46 M26 30 V46 M38 30 V46 M48 30 V46" />
      <rect x="10" y="48" width="44" height="7" rx="2" />
      <circle cx="32" cy="18" r="2" />
    </>
  ),
  yogurt: (
    <>
      <path d="M20 26 H48 L44 56 H24 Z" fill="#5CB3FF" stroke="none" />
      <path d="M22 26 C22 18 30 16 34 18 C38 14 48 18 46 26 Z" fill="#FFFFFF" stroke="none" />
      <path d="M18 24 H46 L42 54 H22 Z" />
      <path d="M20 24 C20 16 28 14 32 16 C36 12 46 16 44 24" />
      <path d="M40 9 L45 20" />
      <path d="M24 36 H40" stroke="#1F55C9" />
    </>
  ),
  fries: (
    <>
      <path d="M23 30 L21 13 M29 30 L28 9 M35 30 L36 11 M41 30 L44 15" strokeWidth="7.6" />
      <path d="M23 30 L21 13 M29 30 L28 9 M35 30 L36 11 M41 30 L44 15" stroke="#FF9F1C" strokeWidth="3.2" />
      <path d="M16 28 H48 L44 56 H20 Z" fill="#E0301A" />
      <path d="M32 47 C28 44 27 41 29 39.5 C30.5 38.5 31.5 39 32 40.5 C32.5 39 33.5 38.5 35 39.5 C37 41 36 44 32 47 Z" fill="#FFFFFF" stroke="none" />
    </>
  ),
  churro: (
    <>
      <path d="M14 52 L50 14" strokeWidth="12" />
      <path d="M14 52 L50 14" stroke="#FF9F1C" strokeWidth="7" />
      <path d="M18 46 L21 49 M24 40 L27 43 M30 34 L33 37 M36 28 L39 31 M42 22 L45 25" strokeWidth="1.8" />
      <path d="M14 28 v0.1 M22 20 v0.1 M50 38 v0.1 M42 48 v0.1 M54 28 v0.1" strokeWidth="3.2" />
    </>
  ),
  matcha: (
    <>
      <path d="M16 28 H48 V41 C48 51 42 55 32 55 C22 55 16 51 16 41 Z" fill="#FFE680" stroke="none" />
      <path d="M14 26 H46 V39 C46 49 40 53 30 53 C20 53 14 49 14 39 Z" />
      <path d="M46 31 C53 31 53 41 46 41" />
      <path d="M24 20 c-3-4 3-6 0-10 M33 20 c-3-4 3-6 0-10" />
      <path d="M24 42 C24 35 32 33 35 30 C36 37 31 43 24 42 Z" fill="#5CB3FF" stroke="#1F55C9" />
      <path d="M24 42 L32 34" stroke="#1F55C9" />
    </>
  ),
  cookie: (
    <>
      <circle cx="34" cy="34" r="21" fill="#5CB3FF" stroke="none" />
      <circle cx="32" cy="32" r="21" fill="#1F55C9" />
      <path d="M24 22 l4 1 -1 4 -4 -1 Z M38 20 l4 2 -2 3 -3 -2 Z M20 36 h4 v4 h-4 Z M34 34 l5 1 -1 4 -4 -1 Z M42 42 l3 2 -2 3 -3 -2 Z M28 44 l4 1 -1 3 -4 -1 Z" fill="#FFFFFF" stroke="none" />
    </>
  ),
  lasagna: (
    <>
      <path d="M12 30 L34 20 L58 30 L36 40 Z" fill="#FFE680" stroke="none" />
      <path d="M12 30 V46 L36 56 V40 Z" fill="#E0301A" stroke="none" />
      <path d="M36 40 V56 L58 46 V30 Z" fill="#FF9F1C" stroke="none" />
      <path d="M12 37 L35 47 M37 47 L57 38" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M10 28 L32 18 L56 28 L34 38 Z" />
      <path d="M10 28 V44 L34 54 V38" />
      <path d="M34 54 L56 44 V28" />
      <path d="M22 24 c2 2 4 2 6 0 M36 24 c2 2 4 2 6 0" stroke="#E0301A" />
    </>
  ),
  pizza: (
    <>
      <path d="M14 18 C26 12 42 12 54 18 L34 58 Z" fill="#FF9F1C" stroke="none" />
      <path d="M12 16 C24 10 40 10 52 16" stroke="#E0301A" strokeWidth="6" />
      <path d="M12 16 C24 10 40 10 52 16 L32 56 Z" />
      <circle cx="25" cy="25" r="3.2" fill="#E0301A" />
      <circle cx="39" cy="24" r="3.2" fill="#E0301A" />
      <circle cx="32" cy="41" r="3" fill="#E0301A" />
      <path d="M34 31 c3-3 7-2 7 1 c-3 2-6 2-7-1 Z M23 33 c2-3 6-3 7 0 c-3 2-6 2-7 0 Z" fill="#1F55C9" stroke="none" />
    </>
  ),
  donut: (
    <>
      <circle cx="34" cy="34" r="21" fill="#FFE680" stroke="none" />
      <path d="M13 31 C13 20 21 11 32 11 C43 11 51 20 51 31 C48 34 46 29 42 33 C38 37 37 31 32 34 C27 37 26 31 22 34 C18 37 16 32 13 31 Z" fill="#E0301A" stroke="none" />
      <circle cx="32" cy="32" r="21" />
      <circle cx="32" cy="32" r="6" fill="#FFF8E8" />
      <path d="M22 20 l3 2 M38 17 l3 -1 M44 25 l1 3 M27 25 l-1 3" stroke="#FFFFFF" strokeWidth="2" />
    </>
  ),
  bowl: (
    <>
      <path d="M12 32 C16 24 24 22 30 26 C36 20 46 22 50 32 Z" fill="#E0301A" stroke="none" />
      <path d="M10 34 H58 C58 48 48 56 34 56 C20 56 10 48 10 34 Z" fill="#5CB3FF" stroke="none" />
      <path d="M8 32 H56 C56 46 46 54 32 54 C18 54 8 46 8 32 Z" />
      <path d="M12 32 C16 24 24 22 30 26 C36 20 46 22 50 32" />
      <path d="M24 18 c-3-4 3-6 0-10 M32 16 c-3-4 3-6 0-10 M40 18 c-3-4 3-6 0-10" />
      <path d="M18 40 c2 3 5 3 6 0 M28 44 c2 3 5 3 6 0 M38 40 c2 3 5 3 6 0" stroke="#1F55C9" />
    </>
  ),
  envelope: (
    <>
      <rect x="10" y="20" width="48" height="32" rx="5" fill="#FFE680" stroke="none" />
      <rect x="8" y="18" width="48" height="32" rx="5" />
      <path d="M9 21 L32 38 L55 21" />
      <path d="M32 47 C27 44 25 41 27.5 38.5 C29 37 31 37.5 32 39.5 C33 37.5 35 37 36.5 38.5 C39 41 37 44 32 47 Z" fill="#E0301A" />
    </>
  ),
  house: (
    <>
      <path d="M16 32 L34 15 L52 32 V56 H16 Z" fill="#5CB3FF" stroke="none" />
      <path d="M10 30 L32 11 L54 30" />
      <path d="M14 27 V54 H50 V27" />
      <path d="M27 54 V42 H37 V54" />
      <path d="M32 35 C29 33 28 31 29.5 29.5 C30.5 28.5 31.6 29 32 30 C32.4 29 33.5 28.5 34.5 29.5 C36 31 35 33 32 35 Z" fill="#E0301A" />
    </>
  ),
  heart: (
    <>
      <path d="M34 56 C16 44 10 34 14 24 C18 16 28 16 34 24 C40 16 50 16 54 24 C58 34 52 44 34 56 Z" fill="#E0301A" stroke="none" />
      <path d="M32 54 C14 42 8 32 12 22 C16 14 26 14 32 22 C38 14 48 14 52 22 C56 32 50 42 32 54 Z" />
      <path d="M18 24 C19 21 21 20 23 20" stroke="#FFFFFF" strokeWidth="2.4" />
    </>
  ),
  jorts: (
    <>
      <path d="M16 16 H52 L56 52 H38 L34 32 L30 52 H12 Z" fill="#5CB3FF" stroke="none" />
      <path d="M14 14 H50 L54 50 H36 L32 30 L28 50 H10 Z" />
      <path d="M14 20 H50" />
      <path d="M18 20 C18 26 22 28 26 28 M46 20 C46 26 42 28 38 28" />
      <path d="M12 50 l1 4 M16 50 l-1 4 M20 50 l1 4 M24 50 l-1 4 M40 50 l1 4 M44 50 l-1 4 M48 50 l1 4 M52 50 l-1 4" strokeWidth="1.8" />
    </>
  ),
  bell: (
    <>
      <path d="M22 46 V32 C22 24 28 18 34 18 C40 18 46 24 46 32 V46 L50 50 H18 Z" fill="#FF9F1C" stroke="none" />
      <path d="M20 44 V30 C20 22 26 16 32 16 C38 16 44 22 44 30 V44 L48 48 H16 Z" />
      <path d="M28 52 C28 56 36 56 36 52" />
      <path d="M32 16 V12" />
    </>
  ),
  sparkle: (
    <>
      <path d="M34 10 C36 26 42 32 58 34 C42 36 36 42 34 58 C32 42 26 36 10 34 C26 32 32 26 34 10 Z" fill="#FF9F1C" stroke="none" />
      <path d="M32 8 C34 24 40 30 56 32 C40 34 34 40 32 56 C30 40 24 34 8 32 C24 30 30 24 32 8 Z" />
    </>
  ),
  vinyl: (
    <>
      <circle cx="34" cy="34" r="22" fill="#5CB3FF" stroke="none" />
      <circle cx="32" cy="32" r="22" fill="currentColor" />
      <circle cx="32" cy="32" r="16" stroke="#5CB3FF" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="12" stroke="#5CB3FF" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="7" fill="#E0301A" stroke="none" />
      <circle cx="32" cy="32" r="1.6" fill="#FFF8E8" stroke="none" />
      <path d="M18 22 C20 19 23 17 26 16" stroke="#FFFFFF" strokeWidth="2.4" />
    </>
  ),
  cassette: (
    <>
      <rect x="10" y="18" width="48" height="32" rx="5" fill="#FF9F1C" stroke="none" />
      <rect x="8" y="16" width="48" height="32" rx="5" />
      <rect x="14" y="21" width="36" height="14" rx="3" fill="#FFFFFF" />
      <circle cx="23" cy="28" r="3.5" />
      <circle cx="41" cy="28" r="3.5" />
      <path d="M26.5 28 H37.5" />
      <path d="M18 48 L21 40 H43 L46 48" />
    </>
  ),
  videocam: (
    <>
      <rect x="10" y="24" width="36" height="28" rx="7" fill="#E0301A" stroke="none" />
      <rect x="8" y="22" width="36" height="28" rx="7" />
      <path d="M44 32 L56 25 V47 L44 40 Z" fill="#5CB3FF" />
      <circle cx="16" cy="30" r="2.4" fill="#FF9F1C" />
      <circle cx="16" cy="15" r="6" fill="#FFE680" />
      <circle cx="31" cy="14" r="7" fill="#FFE680" />
    </>
  ),
  meme: (
    <>
      <circle cx="34" cy="34" r="22" fill="#FF9F1C" stroke="none" />
      <circle cx="32" cy="32" r="22" />
      <path d="M21 27 L25 23.5 L29 27 M35 27 L39 23.5 L43 27" />
      <path d="M21 35 H43 C43 43 38 47 32 47 C26 47 21 43 21 35 Z" fill="#FFFFFF" />
      <path d="M13 29 C10 33 10 36 13 37 C16 36 16 33 13 29 Z M51 29 C48 33 48 36 51 37 C54 36 54 33 51 29 Z" fill="#5CB3FF" />
    </>
  ),
  tree: (
    <>
      <path d="M22 40 C14 40 14 28 22 28 C20 18 32 14 36 20 C42 14 52 20 48 28 C56 30 54 42 46 40 Z" fill="#5CB3FF" stroke="none" />
      <path d="M20 38 C12 38 12 26 20 26 C18 16 30 12 34 18 C40 12 50 18 46 26 C54 28 52 40 44 38 Z" />
      <path d="M32 38 V56 M32 47 L26 41 M32 45 L38 40" />
      <path d="M20 56 H44" />
      <circle cx="26" cy="27" r="2" fill="#E0301A" stroke="none" />
      <circle cx="40" cy="24" r="2" fill="#E0301A" stroke="none" />
    </>
  ),
  wheel: (
    <>
      <circle cx="34" cy="34" r="22" fill="#FFE680" stroke="none" />
      <circle cx="32" cy="32" r="22" />
      <circle cx="32" cy="32" r="17" />
      <circle cx="32" cy="32" r="6" fill="#E0301A" />
      <path d="M15 30 C21 28 25 29 26 31 M49 30 C43 28 39 29 38 31 M32 38 V49" />
    </>
  ),
  pin: (
    <>
      <path d="M34 58 C24 46 16 38 16 26 C16 16 24 10 34 10 C44 10 52 16 52 26 C52 38 44 46 34 58 Z" fill="#E0301A" stroke="none" />
      <path d="M32 56 C22 44 14 36 14 24 C14 14 22 8 32 8 C42 8 50 14 50 24 C50 36 42 44 32 56 Z" />
      <circle cx="32" cy="24" r="7" fill="#FFFFFF" />
      <path d="M22 60 H42" strokeWidth="2" />
    </>
  ),
  utensils: (
    <>
      <circle cx="34" cy="34" r="22" fill="#FFE680" stroke="none" />
      <ellipse cx="22" cy="18" rx="6" ry="9" fill="#FF9F1C" />
      <path d="M22 27 V56" />
      <path d="M38 8 V20 C38 25 46 25 46 20 V8 M42 8 V20 M42 24 V56" />
    </>
  ),
  bed: (
    <>
      <rect x="13" y="33" width="44" height="12" rx="3" fill="#FFFFFF" />
      <path d="M27 33 H57 V45 H27 Z" fill="#5CB3FF" />
      <rect x="15" y="25" width="12" height="8" rx="4" fill="#FFE680" />
      <path d="M10 18 V54 M56 45 V54 M10 45 H56" />
      <path d="M40 12 H46 L40 18 H46 M48 6 H52 L48 10 H52" strokeWidth="2" />
    </>
  ),
  claw: (
    <>
      <rect x="16" y="10" width="38" height="48" rx="6" fill="#5CB3FF" stroke="none" />
      <rect x="14" y="8" width="38" height="48" rx="6" />
      <rect x="19" y="13" width="28" height="25" rx="3" fill="#FFFFFF" />
      <path d="M33 13 V20 M29 24 C29 21 37 21 37 24 M29 24 L27 28 M37 24 L39 28" />
      <circle cx="25" cy="34" r="3" fill="#E0301A" />
      <circle cx="32" cy="35" r="3" fill="#FF9F1C" />
      <circle cx="40" cy="34" r="3" fill="#FFE680" />
      <rect x="21" y="43" width="10" height="7" rx="2" />
      <circle cx="42" cy="46" r="3" fill="#E0301A" />
    </>
  ),
  plane: (
    <>
      <path d="M12 32 L56 14 L42 54 L32 40 Z" fill="#5CB3FF" stroke="none" />
      <path d="M10 30 L54 12 L40 52 L30 38 Z" fill="#FFFFFF" />
      <path d="M30 38 L54 12" />
      <path d="M30 38 L29 50 L36 44" fill="#FFE680" />
      <path d="M6 48 c4 -3 6 2 10 -1 M10 56 c4 -3 6 2 10 -1" strokeWidth="2" />
    </>
  ),
  arena: (
    <>
      <path d="M10 44 C10 28 22 20 34 20 C46 20 58 28 58 44 Z" fill="#FF9F1C" stroke="none" />
      <path d="M8 42 C8 26 20 18 32 18 C44 18 56 26 56 42 Z" />
      <path d="M20 42 C20 30 26 22 32 18 M44 42 C44 30 38 22 32 18 M32 18 V42" strokeWidth="2" />
      <rect x="6" y="42" width="52" height="8" rx="2" fill="#FFFFFF" />
      <path d="M4 57 H60" />
      <path d="M10 57 h6 M26 57 h6 M42 57 h6" stroke="#FF9F1C" strokeWidth="3" />
    </>
  ),
  lechon: (
    <>
      <path d="M2 34 H62" strokeWidth="2" />
      <ellipse cx="36" cy="36" rx="21" ry="13" fill="#FF9F1C" stroke="none" />
      <path d="M21 46 v7 M29 47 v7 M39 47 v7 M47 45 v7" />
      <ellipse cx="34" cy="34" rx="21" ry="13" fill="#FFE680" />
      <path d="M24 26 C30 23 40 23 46 26" stroke="#FF9F1C" strokeWidth="3" />
      <path d="M20 23 L24 16 L27 23" />
      <path d="M19 30 l3 1" />
      <circle cx="11" cy="35" r="4.5" fill="#E0301A" />
      <path d="M11 30 c1 -3 3 -3 4 -4" strokeWidth="2" />
      <path d="M55 31 c4 -2 4 -6 1 -6" />
    </>
  ),
  ferris: (
    <>
      <circle cx="34" cy="30" r="18" fill="#5CB3FF" stroke="none" />
      <path d="M32 28 L22 56 M32 28 L42 56 M18 56 H46" />
      <circle cx="32" cy="28" r="18" fill="#FFFFFF" fillOpacity="0.001" />
      <path d="M14 28 H50 M32 10 V46 M19.3 15.3 L44.7 40.7 M44.7 15.3 L19.3 40.7" strokeWidth="1.6" />
      <circle cx="32" cy="10" r="3.4" fill="#E0301A" />
      <circle cx="44.7" cy="15.3" r="3.4" fill="#FF9F1C" />
      <circle cx="50" cy="28" r="3.4" fill="#FFE680" />
      <circle cx="44.7" cy="40.7" r="3.4" fill="#E0301A" />
      <circle cx="32" cy="46" r="3.4" fill="#FF9F1C" />
      <circle cx="19.3" cy="40.7" r="3.4" fill="#FFE680" />
      <circle cx="14" cy="28" r="3.4" fill="#E0301A" />
      <circle cx="19.3" cy="15.3" r="3.4" fill="#FF9F1C" />
      <circle cx="32" cy="28" r="3" fill="currentColor" />
    </>
  ),
  moon: (
    <>
      <path d="M44 9 A24 24 0 1 0 55 44 A19 19 0 0 1 44 9 Z" fill="#FFE680" />
      <path d="M25 33 c1.5 2 4.5 2 6 0" />
      <circle cx="49" cy="17" r="1.8" fill="#FFE680" />
      <circle cx="56" cy="27" r="1.4" fill="#FFE680" />
    </>
  ),
  sun: (
    <>
      <circle cx="34" cy="34" r="13" fill="#FF9F1C" stroke="none" />
      <circle cx="32" cy="32" r="13" fill="#FFE680" />
      <path d="M32 7 v7 M32 50 v7 M7 32 h7 M50 32 h7 M14.5 14.5 l5 5 M44.5 44.5 l5 5 M49.5 14.5 l-5 5 M19.5 44.5 l-5 5" />
      <circle cx="27.5" cy="30" r="1.6" fill="currentColor" />
      <circle cx="36.5" cy="30" r="1.6" fill="currentColor" />
      <path d="M27 35 c2 3 8 3 10 0" />
    </>
  ),
  her: (
    <>
      <path d="M16 62 C16 52 48 52 48 62" fill="#5CB3FF" />
      <path d="M14 50 C9 30 15 11 32 11 C49 11 55 30 50 50 C46 53 43 47 43 41 H21 C21 47 18 53 14 50 Z" fill="#E0301A" />
      <circle cx="32" cy="32" r="13" fill="#FFF3D6" />
      <path d="M19 31 C19 21 25 17 32 17 C39 17 45 21 45 31 C40 28 35 25 31 22 C28 26 24 29 19 31 Z" fill="#E0301A" />
      <circle cx="27" cy="34" r="1.7" fill="currentColor" />
      <circle cx="37" cy="34" r="1.7" fill="currentColor" />
      <circle cx="24" cy="38.5" r="2.4" fill="#FF9F1C" stroke="none" opacity="0.7" />
      <circle cx="40" cy="38.5" r="2.4" fill="#FF9F1C" stroke="none" opacity="0.7" />
      <path d="M29 39 c1.5 2 4.5 2 6 0" />
      <path d="M46 13 L47.6 17 L52 17.4 L48.6 20 L49.8 24.2 L46 21.8 L42.2 24.2 L43.4 20 L40 17.4 L44.4 17 Z" fill="#FFE680" strokeWidth="1.8" />
    </>
  ),
  him: (
    <>
      <path d="M14 62 C14 51 50 51 50 62" fill="#FF9F1C" />
      <circle cx="32" cy="33" r="14" fill="#FFF3D6" />
      <path d="M18 31 C17 18 25 13 33 13 C42 13 47 19 46 31 C43 25 37 23 30 24 C25 25 21 27 18 31 Z" fill="currentColor" />
      <circle cx="27" cy="33" r="1.7" fill="currentColor" />
      <circle cx="37" cy="33" r="1.7" fill="currentColor" />
      <path d="M26 40 C28 38 30 38 32 40 C34 38 36 38 38 40" strokeWidth="2.4" />
      <path d="M29 44 c1.5 1.5 4.5 1.5 6 0" />
      <circle cx="23.5" cy="38" r="2.2" fill="#E0301A" stroke="none" opacity="0.4" />
      <circle cx="40.5" cy="38" r="2.2" fill="#E0301A" stroke="none" opacity="0.4" />
    </>
  ),
  ticket: (
    <>
      <path d="M12 24 H56 V30 C52 30 52 38 56 38 V44 H12 V38 C16 38 16 30 12 30 Z" fill="#E0301A" stroke="none" />
      <path d="M10 22 H54 V28 C50 28 50 36 54 36 V42 H10 V36 C14 36 14 28 10 28 Z" fill="#FFE680" />
      <path d="M40 22 V42" strokeDasharray="3 4" />
      <path d="M17 29 H32 M17 35 H28" strokeWidth="2" />
      <path d="M47 28 L48.3 31 L51.5 31.3 L49 33.4 L49.8 36.5 L47 34.8 L44.2 36.5 L45 33.4 L42.5 31.3 L45.7 31 Z" fill="#FF9F1C" strokeWidth="1.6" />
    </>
  ),
  burger: (
    <>
      <path d="M12 32 C12 17 56 17 56 32 Z" fill="#FFC76B" stroke="none" />
      <path d="M10 30 C10 15 54 15 54 30 Z" fill="#FFC76B" />
      <path d="M23 23 l3 -1 M31 20 l3 0 M39 24 l3 1" strokeWidth="2" />
      <path d="M8 33 Q14 38 20 33 T32 33 T44 33 T56 33 V36 H8 Z" fill="#5E9B4E" />
      <rect x="9" y="37" width="46" height="7" rx="3.5" fill="#8A4B2A" />
      <path d="M14 44 L22 50 L30 44 Z" fill="#FFE680" />
      <path d="M10 46 H54 Q54 54 46 54 H18 Q10 54 10 46 Z" fill="#FFC76B" />
      <path d="M20 23 l2 -2" stroke="#FFFFFF" strokeWidth="2" />
    </>
  ),
  ramen: (
    <>
      <path d="M44 6 L30 27 M50 8 L36 28" />
      <path d="M20 31 Q24 22 28 31 M30 31 Q34 20 38 31 M40 31 Q44 23 48 31" />
      <path d="M10 33 H58 C58 47 48 56 34 56 C20 56 10 47 10 33 Z" fill="#5CB3FF" stroke="none" />
      <path d="M8 31 H56 C56 46 46 55 32 55 C18 55 8 46 8 31 Z" fill="#FFFFFF" />
      <path d="M10 31 C20 36 44 36 54 31" fill="#FF9F1C" />
      <path d="M36 28 a6 6 0 0 1 12 0" fill="#FFE680" />
      <circle cx="42" cy="28" r="2" fill="#FF9F1C" stroke="none" />
      <path d="M16 44 c3 3 7 3 10 0" stroke="#1F55C9" strokeWidth="2" />
    </>
  ),
  milkTea: (
    <>
      <path d="M38 4 L41 22" strokeWidth="7" />
      <path d="M38 4 L41 22" stroke="#E0301A" strokeWidth="3.4" />
      <path d="M18 22 L22 57 H46 L50 22 Z" fill="#5CB3FF" stroke="none" />
      <path d="M16 20 L20 56 H44 L48 20 Z" fill="#CDE7FF" />
      <path d="M18 32 L20 56 H44 L46 32 Z" fill="#C99A6B" />
      <path d="M14 20 C14 10 50 10 50 20 Z" fill="#FFFFFF" />
      <circle cx="26" cy="51" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="33" cy="52" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="39" cy="50" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="30" cy="46" r="2.4" fill="currentColor" stroke="none" />
      <path d="M21 16 C23 14 26 13 29 13" stroke="#FFFFFF" strokeWidth="2" />
    </>
  ),
  iceCream: (
    <>
      <path d="M20 31 L32 59 L44 31 Z" fill="#FFC76B" />
      <path d="M24 38 L38 38 M27 45 L37 45 M24 33 L35 55 M40 33 L29 55" strokeWidth="1.8" />
      <path d="M14 32 C12 16 52 16 50 32 C46 36 44 31 40 34 C36 37 34 32 32 34 C28 37 24 32 22 34 C18 36 16 33 14 32 Z" fill="#FF8FB1" />
      <path d="M22 20 C22 10 42 10 42 20 Z" fill="#FFFFFF" />
      <circle cx="32" cy="7" r="3.5" fill="#E0301A" />
      <path d="M32 3.5 C33 1 35 1 36 2" />
      <path d="M21 26 c1 -3 3 -4 5 -4" stroke="#FFFFFF" strokeWidth="2" />
    </>
  ),
  cake: (
    <>
      <ellipse cx="32" cy="55" rx="26" ry="5" fill="#CDE7FF" />
      <path d="M10 36 H54 V52 C54 54 10 54 10 52 Z" fill="#FFE680" />
      <path d="M10 43 C16 47 20 41 26 45 C32 49 38 41 44 45 C48 47 52 44 54 43" fill="#FFFFFF" />
      <path d="M10 36 C14 28 20 32 24 28 C30 32 36 28 40 32 C46 28 50 32 54 36 Z" fill="#FF8FB1" />
      <rect x="29" y="17" width="6" height="11" rx="1.5" fill="#5CB3FF" />
      <path d="M32 7 C36 11 35 14 32 14 C29 14 28 11 32 7 Z" fill="#FF9F1C" />
      <path d="M17 33 l3 -1" stroke="#FFFFFF" strokeWidth="2" />
    </>
  ),
  sushi: (
    <>
      <path d="M12 44 C12 34 56 34 56 44 C56 54 12 54 12 44 Z" fill="#5CB3FF" stroke="none" />
      <path d="M10 41 C10 31 54 31 54 41 C54 51 10 51 10 41 Z" fill="#FFFFFF" />
      <path d="M12 37 C20 25 44 25 52 37 C44 35 20 35 12 37 Z" fill="#FF9F1C" />
      <path d="M22 30 L25 34 M31 28 L33 34 M40 30 L42 34" stroke="#FFFFFF" strokeWidth="2" />
      <rect x="28" y="28" width="8" height="22" rx="1.5" fill="#1F55C9" />
      <circle cx="17" cy="43" r="1" fill="currentColor" stroke="none" />
      <circle cx="46" cy="45" r="1" fill="currentColor" stroke="none" />
      <circle cx="22" cy="47" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  coffee: (
    <>
      <path d="M22 18 C18 12 26 10 22 4 M32 18 C28 12 36 10 32 4" />
      <path d="M14 26 H46 V46 C46 54 40 58 30 58 C20 58 14 54 14 46 Z" fill="#5CB3FF" stroke="none" />
      <path d="M12 24 H44 V44 C44 52 38 56 28 56 C18 56 12 52 12 44 Z" fill="#FFFFFF" />
      <path d="M44 28 C54 28 54 42 44 42" />
      <ellipse cx="28" cy="24" rx="16" ry="3.5" fill="#8A4B2A" />
      <path d="M28 26 C25 24 25 22 26.5 22 C27.5 22 28 23 28 23 C28 23 28.5 22 29.5 22 C31 22 31 24 28 26 Z" fill="#FFE680" stroke="none" />
      <path d="M8 60 H50" />
    </>
  ),
  siomai: (
    <>
      <ellipse cx="32" cy="50" rx="26" ry="8" fill="#C99A6B" />
      <path d="M12 49 C20 54 44 54 52 49" strokeWidth="1.8" />
      <path d="M26 54 V57 M38 54 V57" strokeWidth="1.8" />
      <path d="M32 40 C32 30 40 27 44 30 C48 27 54 31 54 40 Z" fill="#FFE680" />
      <path d="M12 46 C12 32 24 28 30 32 C36 28 48 32 48 46 Z" fill="#FFE680" />
      <path d="M20 35 L21 42 M26 33 L26 42 M32 34 L31 42 M38 33 L37 42" strokeWidth="1.8" />
      <circle cx="30" cy="31" r="2.6" fill="#FF9F1C" />
    </>
  ),
};

export const ICON_NAMES = Object.keys(GLYPHS);
