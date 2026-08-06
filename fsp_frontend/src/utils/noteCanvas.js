import { DEFAULT_FONT_FAMILY } from '../constants/loveBoardConstants';

// Logical design-space size of a note's paper. Text box / attachment
// x/y/width/height all live in this coordinate space; renderers (the small
// on-board Note and the full-size editor) each apply their own uniform
// scale factor on top, so one set of coordinates works everywhere.
export const NOTE_CANVAS_WIDTH = 280;
export const NOTE_CANVAS_HEIGHT = 320;

// How large the note appears on the corkboard relative to the editor's
// full-size canvas (kept close to the pre-Phase-4 232x252 on-board size).
export const NOTE_BOARD_SCALE = 0.8;

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createTextBox(overrides = {}) {
  return {
    id: uid(),
    x: 40,
    y: 120,
    width: 200,
    height: 80,
    rotation: 0,
    zIndex: 1,
    text: '',
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: 18,
    fontWeight: 'normal',
    color: '#2b2b2b',
    align: 'center',
    lineHeight: 1.3,
    letterSpacing: 0,
    ...overrides,
  };
}

export function createAttachment(type, image, overrides = {}) {
  return {
    id: uid(),
    type,
    image,
    x: NOTE_CANVAS_WIDTH / 2,
    y: type === 'PIN' ? 14 : 10,
    rotation: type === 'TAPE' ? -12 : 0,
    scale: 1,
    zIndex: 1,
    ...overrides,
  };
}

/* ---------------------------------------------------------------
   JSON <-> array helpers. The backend stores contentBlocks/attachments
   as opaque JSON text (it never parses them), so all (de)serialization
   happens here.
--------------------------------------------------------------- */

export function parseJsonList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function stringifyJsonList(list) {
  return JSON.stringify(list || []);
}

/* ---------------------------------------------------------------
   Legacy fallback. Notes created before the multi-text-box editor only
   have a flat title/content/fontFamily/attachmentType. These turn that
   into the equivalent single-block representation so old notes keep
   rendering exactly as before until someone opens and re-saves them —
   at which point they get real contentBlocks/attachments and this path
   is no longer used for them.
--------------------------------------------------------------- */

export function getEffectiveTextBoxes(note) {
  const blocks = parseJsonList(note.contentBlocks);
  if (blocks.length > 0) return blocks;
  if (!note.content && !note.title) return [];

  return [
    createTextBox({
      id: 'legacy',
      x: 20,
      y: 24,
      width: NOTE_CANVAS_WIDTH - 40,
      height: NOTE_CANVAS_HEIGHT - 48,
      text: note.title ? `${note.title}\n\n${note.content || ''}` : note.content || '',
      fontFamily: note.fontFamily || DEFAULT_FONT_FAMILY,
      fontSize: note.fontSize || 18,
      color: note.fontColor || '#2b2b2b',
    }),
  ];
}

export function getEffectiveAttachments(note) {
  const attachments = parseJsonList(note.attachments);
  if (attachments.length > 0) return attachments;
  if (!note.attachmentType || note.attachmentType === 'NONE') return [];
  const image = note.attachmentType === 'PIN' ? note.pinImage : note.tapeImage;
  if (!image) return [];
  return [createAttachment(note.attachmentType, image, { id: 'legacy' })];
}

// Plain-text mirror of the text boxes, kept in the note's `content` field
// so the existing title/content search box keeps matching new-style notes.
export function deriveSearchableContent(textBoxes) {
  return textBoxes
    .map((b) => b.text || '')
    .join(' ')
    .trim();
}
