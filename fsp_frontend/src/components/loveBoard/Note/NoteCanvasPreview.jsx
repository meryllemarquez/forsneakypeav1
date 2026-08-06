import { NOTE_CANVAS_WIDTH, NOTE_CANVAS_HEIGHT, getEffectiveTextBoxes, getEffectiveAttachments } from '../../../utils/noteCanvas';

const ATTACHMENT_BASE_SIZE = 34;

export default function NoteCanvasPreview({ note, paperUrl, pins, tapes, scale = 1, className = '' }) {
  const textBoxes = getEffectiveTextBoxes(note);
  const attachments = getEffectiveAttachments(note);

  return (
    <div className={`relative ${className}`} style={{ width: NOTE_CANVAS_WIDTH * scale, height: NOTE_CANVAS_HEIGHT * scale }}>
      <img src={paperUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill" draggable={false} />

      {attachments.map((a) => {
        const src = a.type === 'PIN' ? pins?.[a.image] : tapes?.[a.image];
        if (!src) return null;
        const size = ATTACHMENT_BASE_SIZE * (a.scale || 1) * scale;
        return (
          <img
            key={a.id}
            src={src}
            alt=""
            className="pointer-events-none absolute object-contain drop-shadow"
            style={{
              left: a.x * scale,
              top: a.y * scale,
              width: size,
              height: size,
              transform: `translate(-50%, -50%) rotate(${a.rotation || 0}deg)`,
            }}
            draggable={false}
          />
        );
      })}

      {textBoxes.map((b) => (
        <div
          key={b.id}
          className="absolute overflow-hidden p-1 break-words whitespace-pre-wrap"
          style={{
            left: b.x * scale,
            top: b.y * scale,
            width: b.width * scale,
            height: b.height * scale,
            transform: `rotate(${b.rotation || 0}deg)`,
            fontFamily: b.fontFamily,
            fontSize: b.fontSize * scale,
            fontWeight: b.fontWeight || 'normal',
            color: b.color,
            textAlign: b.align || 'center',
            lineHeight: b.lineHeight ?? 1.3,
            letterSpacing: `${b.letterSpacing ?? 0}px`,
          }}
        >
          {b.text}
        </div>
      ))}
    </div>
  );
}
