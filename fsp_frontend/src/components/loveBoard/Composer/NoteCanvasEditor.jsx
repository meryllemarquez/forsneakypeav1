import { useMemo, useState } from 'react';
import { Type, Pin as PinIcon, Trash2, AlignLeft, AlignCenter, AlignRight, Bold } from 'lucide-react';
import TextBoxHandle from './TextBoxHandle';
import AttachmentHandle from './AttachmentHandle';
import FontPicker from './FontPicker';
import { NOTE_CANVAS_WIDTH, NOTE_CANVAS_HEIGHT, createTextBox, createAttachment } from '../../../utils/noteCanvas';
import { FONT_COLOR_SWATCHES } from '../../../constants/loveBoardConstants';

function byFilename(list = []) {
  return Object.fromEntries(list.map((item) => [item.filename, item.url]));
}

export default function NoteCanvasEditor({ paperUrl, assets, textBoxes, attachments, onChangeTextBoxes, onChangeAttachments }) {
  const [selection, setSelection] = useState(null); // { type: 'text' | 'attachment', id } | null
  const [editingTextId, setEditingTextId] = useState(null);
  const [replacingId, setReplacingId] = useState(null);

  const pins = useMemo(() => byFilename(assets?.pins), [assets]);
  const tapes = useMemo(() => byFilename(assets?.tapes), [assets]);

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
    const list = type === 'PIN' ? assets?.pins : assets?.tapes;
    const image = list?.[0]?.filename;
    if (!image) return;
    const attachment = createAttachment(type, image, { zIndex: textBoxes.length + attachments.length + 1 });
    onChangeAttachments([...attachments, attachment]);
    setSelection({ type: 'attachment', id: attachment.id });
  };

  const replaceOptions = replacingId
    ? (attachments.find((a) => a.id === replacingId)?.type === 'PIN' ? assets?.pins : assets?.tapes) || []
    : [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addBlock}
          className="inline-flex flex-1 appearance-none items-center justify-center gap-1.5 rounded-lg border-0 bg-[#ece1d2] py-2 text-xs font-medium text-[#4a3a2c] transition hover:bg-[#e2d4bf]"
        >
          <Type size={13} />
          Add Text Box
        </button>
        <button
          type="button"
          onClick={() => addAttachment('PIN')}
          className="inline-flex flex-1 appearance-none items-center justify-center gap-1.5 rounded-lg border-0 bg-[#ece1d2] py-2 text-xs font-medium text-[#4a3a2c] transition hover:bg-[#e2d4bf]"
        >
          <PinIcon size={13} />
          Add Pin
        </button>
        <button
          type="button"
          onClick={() => addAttachment('TAPE')}
          className="inline-flex flex-1 appearance-none items-center justify-center gap-1.5 rounded-lg border-0 bg-[#ece1d2] py-2 text-xs font-medium text-[#4a3a2c] transition hover:bg-[#e2d4bf]"
        >
          Add Tape
        </button>
      </div>

      <div
        className="relative mx-auto overflow-hidden rounded-lg shadow-[0_12px_24px_-8px_rgba(40,25,10,0.4)]"
        style={{ width: NOTE_CANVAS_WIDTH, height: NOTE_CANVAS_HEIGHT }}
        onClick={() => setSelection(null)}
      >
        <img src={paperUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill" draggable={false} />

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
            imageUrl={attachment.type === 'PIN' ? pins[attachment.image] : tapes[attachment.image]}
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
        <div className="rounded-lg border border-[#e2d4bf] bg-white p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="m-0 text-[11px] font-semibold tracking-wide text-[#8a7360] uppercase">Choose Replacement</p>
            <button type="button" onClick={() => setReplacingId(null)} className="appearance-none rounded border-0 bg-transparent text-xs text-[#8a7360]">
              Done
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {replaceOptions.map((opt) => (
              <button
                key={opt.filename}
                type="button"
                onClick={() => {
                  updateAttachment(replacingId, { image: opt.filename });
                  setReplacingId(null);
                }}
                className="appearance-none rounded border-0 bg-[#f4ece0] p-1"
                title={opt.label}
              >
                <img src={opt.url} alt={opt.label} className="aspect-square w-full object-contain" />
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedBlock && (
        <div className="space-y-2.5 rounded-lg border border-[#e2d4bf] bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="m-0 text-[11px] font-semibold tracking-wide text-[#8a7360] uppercase">Text Style</p>
            <button
              type="button"
              onClick={() => removeBlock(selectedBlock.id)}
              className="appearance-none rounded border-0 bg-transparent p-1 text-[#a8391f] transition hover:bg-[#f4e1da]"
              title="Delete text box"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <FontPicker value={selectedBlock.fontFamily} onChange={(fontFamily) => updateBlock(selectedBlock.id, { fontFamily })} />

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[10px] font-semibold tracking-wide text-[#8a7360] uppercase">
              Size
              <input
                type="range"
                min={10}
                max={48}
                value={selectedBlock.fontSize}
                onChange={(e) => updateBlock(selectedBlock.id, { fontSize: Number(e.target.value) })}
                className="ml-2 align-middle accent-[#a8391f]"
              />
            </label>

            <button
              type="button"
              onClick={() => updateBlock(selectedBlock.id, { fontWeight: selectedBlock.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`appearance-none rounded border-0 p-1.5 transition ${
                selectedBlock.fontWeight === 'bold' ? 'bg-[#a8391f] text-white' : 'bg-[#ece1d2] text-[#4a3a2c] hover:bg-[#e2d4bf]'
              }`}
              title="Bold"
            >
              <Bold size={13} />
            </button>

            <div className="flex items-center gap-1 rounded border border-[#e2d4bf] p-0.5">
              {[
                { value: 'left', Icon: AlignLeft },
                { value: 'center', Icon: AlignCenter },
                { value: 'right', Icon: AlignRight },
              ].map(({ value, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateBlock(selectedBlock.id, { align: value })}
                  className={`appearance-none rounded border-0 p-1 transition ${
                    selectedBlock.align === value ? 'bg-[#a8391f] text-white' : 'text-[#8a7360] hover:bg-[#ece1d2]'
                  }`}
                >
                  <Icon size={13} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {FONT_COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateBlock(selectedBlock.id, { color })}
                  style={{ backgroundColor: color }}
                  className={`h-5 w-5 appearance-none rounded-full border-0 ${
                    selectedBlock.color === color ? 'ring-2 ring-[#a8391f] ring-offset-1' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-[10px] font-semibold tracking-wide text-[#8a7360] uppercase">
              Line Height
              <input
                type="range"
                min={1}
                max={2.2}
                step={0.1}
                value={selectedBlock.lineHeight ?? 1.3}
                onChange={(e) => updateBlock(selectedBlock.id, { lineHeight: Number(e.target.value) })}
                className="ml-2 align-middle accent-[#a8391f]"
              />
            </label>
            <label className="text-[10px] font-semibold tracking-wide text-[#8a7360] uppercase">
              Letter Spacing
              <input
                type="range"
                min={-1}
                max={8}
                step={0.5}
                value={selectedBlock.letterSpacing ?? 0}
                onChange={(e) => updateBlock(selectedBlock.id, { letterSpacing: Number(e.target.value) })}
                className="ml-2 align-middle accent-[#a8391f]"
              />
            </label>
          </div>
        </div>
      )}

      {selectedAttachment && (
        <p className="m-0 text-center text-[11px] text-[#8a7360]">Drag to move, use the corner handle to resize, or the top handle to rotate.</p>
      )}
    </div>
  );
}
