import { useState } from 'react';
import { Type, Pin as PinIcon, Trash2, AlignLeft, AlignCenter, AlignRight, Bold } from 'lucide-react';
import TextBoxHandle from './TextBoxHandle';
import AttachmentHandle from './AttachmentHandle';
import FontPicker from './FontPicker';
import { Chip, PillButton, RoundButton } from '../common/lbUi';
import { NOTE_CANVAS_WIDTH, NOTE_CANVAS_HEIGHT, createTextBox, createAttachment } from '../../../utils/noteCanvas';
import { FONT_COLOR_SWATCHES } from '../../../constants/loveBoardConstants';
import { PIN_COLORS, TAPE_COLORS, pinValue, tapeValue } from '../../../constants/loveBoardCatalog';
import { LbPaper, LbAttachment } from '../common/lbGraphics';

export default function NoteCanvasEditor({ paper, textBoxes, attachments, onChangeTextBoxes, onChangeAttachments }) {
  const [selection, setSelection] = useState(null); // { type: 'text' | 'attachment', id } | null
  const [editingTextId, setEditingTextId] = useState(null);
  const [replacingId, setReplacingId] = useState(null);

  const selectedBlock = selection?.type === 'text' ? textBoxes.find((b) => b.id === selection.id) : null;
  const selectedAttachment = selection?.type === 'attachment' ? attachments.find((a) => a.id === selection.id) : null;

  const updateBlock = (id, patch) => onChangeTextBoxes(textBoxes.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeBlock = (id) => {
    onChangeTextBoxes(textBoxes.filter((b) => b.id !== id));
    setSelection((s) => (s?.type === 'text' && s.id === id ? null : s));
  };
  const addBlock = () => {
    const block = createTextBox({ x: 40, y: 130, zIndex: textBoxes.length + attachments.length + 1 });
    onChangeTextBoxes([...textBoxes, block]);
    setSelection({ type: 'text', id: block.id });
    setEditingTextId(block.id);
  };

  const updateAttachment = (id, patch) => onChangeAttachments(attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const removeAttachment = (id) => {
    onChangeAttachments(attachments.filter((a) => a.id !== id));
    setSelection((s) => (s?.type === 'attachment' && s.id === id ? null : s));
  };
  const addAttachment = (type) => {
    const image = type === 'PIN' ? pinValue(PIN_COLORS[0].id) : tapeValue(TAPE_COLORS[0].id);
    const attachment = createAttachment(type, image, { zIndex: textBoxes.length + attachments.length + 1 });
    onChangeAttachments([...attachments, attachment]);
    setSelection({ type: 'attachment', id: attachment.id });
  };

  const replacingType = replacingId ? attachments.find((a) => a.id === replacingId)?.type : null;
  const replaceOptions =
    replacingType === 'PIN'
      ? PIN_COLORS.map((c) => ({ value: pinValue(c.id), label: `${c.label} pin` }))
      : replacingType === 'TAPE'
        ? TAPE_COLORS.map((c) => ({ value: tapeValue(c.id), label: `${c.label} tape` }))
        : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <PillButton onClick={addBlock} className="flex-1">
          <Type size={16} strokeWidth={2.6} aria-hidden="true" />
          Add Text Box
        </PillButton>
        <PillButton onClick={() => addAttachment('PIN')} className="flex-1">
          <PinIcon size={16} strokeWidth={2.6} aria-hidden="true" />
          Add Pin
        </PillButton>
        <PillButton onClick={() => addAttachment('TAPE')} className="flex-1">
          Add Tape
        </PillButton>
      </div>

      <div
        className="relative mx-auto overflow-hidden rounded-lg border-2 border-solid border-(--outline) shadow-[5px_5px_0_var(--sea)]"
        style={{ width: NOTE_CANVAS_WIDTH, height: NOTE_CANVAS_HEIGHT }}
        onClick={() => setSelection(null)}
      >
        <LbPaper value={paper} />

        {textBoxes.map((block) => (
          <TextBoxHandle
            key={block.id}
            block={block}
            scale={1}
            isSelected={selection?.type === 'text' && selection.id === block.id}
            isEditing={editingTextId === block.id}
            onSelect={() => setSelection({ type: 'text', id: block.id })}
            onStartEdit={() => {
              setSelection({ type: 'text', id: block.id });
              setEditingTextId(block.id);
            }}
            onStopEdit={() => setEditingTextId(null)}
            onChange={(patch) => updateBlock(block.id, patch)}
          />
        ))}

        {attachments.map((attachment) => (
          <AttachmentHandle
            key={attachment.id}
            attachment={attachment}
            scale={1}
            isSelected={selection?.type === 'attachment' && selection.id === attachment.id}
            onSelect={() => setSelection({ type: 'attachment', id: attachment.id })}
            onChange={(patch) => updateAttachment(attachment.id, patch)}
            onReplace={() => setReplacingId(attachment.id)}
            onRemove={() => removeAttachment(attachment.id)}
          />
        ))}
      </div>

      {replacingId && (
        <div className="rounded-2xl border-2 border-solid border-(--outline) bg-(--white) p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="m-0 text-sm font-extrabold">Choose replacement</p>
            <PillButton onClick={() => setReplacingId(null)} className="!min-h-11 !px-4">
              Done
            </PillButton>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {replaceOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  updateAttachment(replacingId, { image: opt.value });
                  setReplacingId(null);
                }}
                className="lb-focus min-h-11 cursor-pointer appearance-none rounded-xl border-2 border-solid border-(--outline) bg-(--paper) p-1 hover:bg-(--gelato-tint)"
                aria-label={`Use ${opt.label}`}
                title={opt.label}
              >
                <span className="relative block aspect-square w-full">
                  <LbAttachment type={replacingType} value={opt.value} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedBlock && (
        <div className="space-y-3 rounded-2xl border-2 border-solid border-(--outline) bg-(--white) p-4">
          <div className="flex items-center justify-between">
            <p className="m-0 font-caveat text-2xl leading-none font-bold text-(--tomato)">Text style</p>
            <RoundButton label="Delete text box" onClick={() => removeBlock(selectedBlock.id)}>
              <Trash2 size={18} strokeWidth={2.6} aria-hidden="true" />
            </RoundButton>
          </div>

          <FontPicker value={selectedBlock.fontFamily} onChange={(fontFamily) => updateBlock(selectedBlock.id, { fontFamily })} />

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-h-11 items-center gap-2 text-sm font-extrabold">
              Size
              <input
                type="range"
                min={10}
                max={48}
                value={selectedBlock.fontSize}
                onChange={(e) => updateBlock(selectedBlock.id, { fontSize: Number(e.target.value) })}
                className="lb-focus h-11 accent-(--amalfi)"
              />
            </label>

            <Chip
              active={selectedBlock.fontWeight === 'bold'}
              onClick={() => updateBlock(selectedBlock.id, { fontWeight: selectedBlock.fontWeight === 'bold' ? 'normal' : 'bold' })}
              aria-label="Bold"
            >
              <Bold size={18} strokeWidth={2.8} aria-hidden="true" />
            </Chip>

            <div className="flex items-center gap-1" role="group" aria-label="Alignment">
              {[
                { value: 'left', Icon: AlignLeft },
                { value: 'center', Icon: AlignCenter },
                { value: 'right', Icon: AlignRight },
              ].map(({ value, Icon }) => (
                <Chip
                  key={value}
                  active={selectedBlock.align === value}
                  onClick={() => updateBlock(selectedBlock.id, { align: value })}
                  aria-label={`Align ${value}`}
                  className="!px-3"
                >
                  <Icon size={18} strokeWidth={2.6} aria-hidden="true" />
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Text colour">
            {FONT_COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => updateBlock(selectedBlock.id, { color })}
                style={{ backgroundColor: color }}
                aria-label={`Text colour ${color}`}
                aria-pressed={selectedBlock.color === color}
                className={`lb-focus size-11 cursor-pointer appearance-none rounded-full border-2 border-solid border-(--ink) ${
                  selectedBlock.color === color ? 'shadow-[0_0_0_3px_white,0_0_0_5px_var(--outline)]' : ''
                }`}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <label className="flex min-h-11 items-center gap-2 text-sm font-extrabold">
              Line height
              <input
                type="range"
                min={1}
                max={2.2}
                step={0.1}
                value={selectedBlock.lineHeight ?? 1.3}
                onChange={(e) => updateBlock(selectedBlock.id, { lineHeight: Number(e.target.value) })}
                className="lb-focus h-11 accent-(--amalfi)"
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-extrabold">
              Letter spacing
              <input
                type="range"
                min={-1}
                max={8}
                step={0.5}
                value={selectedBlock.letterSpacing ?? 0}
                onChange={(e) => updateBlock(selectedBlock.id, { letterSpacing: Number(e.target.value) })}
                className="lb-focus h-11 accent-(--amalfi)"
              />
            </label>
          </div>
        </div>
      )}

      {selectedAttachment && (
        <p className="m-0 text-center text-sm text-(--ink-soft)">Drag to move, use the corner handle to resize, or the top handle to rotate.</p>
      )}
    </div>
  );
}
