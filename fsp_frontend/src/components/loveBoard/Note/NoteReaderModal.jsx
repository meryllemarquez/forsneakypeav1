import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, Heart, Archive, ArchiveRestore, Pencil, Trash2, Image, Smile, EyeOff } from 'lucide-react';
import PaperPicker from '../Composer/PaperPicker';
import MoodPicker from '../Composer/MoodPicker';
import NoteCanvasEditor from '../Composer/NoteCanvasEditor';
import NoteCanvasPreview from './NoteCanvasPreview';
import CollapsibleSection from '../common/CollapsibleSection';
import { MOOD_OPTIONS } from '../../../constants/loveBoardConstants';
import { getEffectiveTextBoxes, getEffectiveAttachments, deriveSearchableContent, stringifyJsonList } from '../../../utils/noteCanvas';

function byFilename(list = []) {
  return Object.fromEntries(list.map((item) => [item.filename, item.url]));
}

export default function NoteReaderModal({ note, assets, onClose, onSave, onToggleFavorite, onToggleArchive, onDelete, saving }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(() => ({
    title: note.title || '',
    paperImage: note.paperImage,
    textBoxes: getEffectiveTextBoxes(note),
    attachments: getEffectiveAttachments(note),
    mood: note.mood,
    isPrivate: note.isPrivate,
  }));

  const papers = useMemo(() => byFilename(assets?.papers), [assets]);
  const pins = useMemo(() => byFilename(assets?.pins), [assets]);
  const tapes = useMemo(() => byFilename(assets?.tapes), [assets]);
  const moodInfo = MOOD_OPTIONS.find((m) => m.value === note.mood);

  const handleSave = async () => {
    await onSave({
      title: form.title,
      paperImage: form.paperImage,
      content: deriveSearchableContent(form.textBoxes),
      contentBlocks: stringifyJsonList(form.textBoxes),
      attachments: stringifyJsonList(form.attachments),
      mood: form.mood,
      isPrivate: form.isPrivate,
    });
    setEditMode(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.div
        className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e7d8c2]/60 bg-[#fffaf1] shadow-2xl"
        style={{ transformPerspective: 1200 }}
        initial={{ opacity: 0, scale: 0.55, y: 60, rotateX: -22 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.6, y: 40, rotateX: 18 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url(${papers[note.paperImage] || ''})`,
            backgroundSize: 'cover',
          }}
        />

        <div className="relative flex items-center justify-between border-b border-[#e7d8c2] bg-white/60 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-[#8a7360]">
            <span>{note.isMine ? 'You' : note.authorName}</span>
            <span>·</span>
            <span>{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : ''}</span>
            {note.isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f3e3cf] px-2 py-0.5">
                <Lock size={11} strokeWidth={2.25} />
                Private
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="appearance-none rounded-full border-0 bg-transparent p-1.5 text-[#8a7360] transition hover:bg-black/5 hover:text-[#3a2b1e]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <motion.div
          className="relative flex-1 overflow-y-auto px-8 py-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
        >
          {!editMode ? (
            <div className="flex flex-col items-center text-center">
              {note.title && <h2 className="mb-3 text-2xl font-bold text-[#3a2b1e]">{note.title}</h2>}
              <NoteCanvasPreview
                note={note}
                paperUrl={papers[note.paperImage]}
                pins={pins}
                tapes={tapes}
                className="shadow-[0_12px_24px_-8px_rgba(40,25,10,0.35)]"
              />
              {moodInfo && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#8a7360]">
                  <moodInfo.icon size={16} strokeWidth={2} />
                  {moodInfo.label}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-left">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8a7360]">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Shown in Archive & Layers, not on the paper"
                  className="w-full rounded-lg border border-[#e2d4bf] bg-white px-3 py-2 text-sm"
                />
              </div>

              <NoteCanvasEditor
                paperUrl={papers[form.paperImage]}
                assets={assets}
                textBoxes={form.textBoxes}
                attachments={form.attachments}
                onChangeTextBoxes={(textBoxes) => setForm((f) => ({ ...f, textBoxes }))}
                onChangeAttachments={(attachments) => setForm((f) => ({ ...f, attachments }))}
              />

              <div className="space-y-2 pt-1">
                <CollapsibleSection title="Paper" icon={<Image size={13} />}>
                  <PaperPicker papers={assets?.papers} value={form.paperImage} onChange={(paperImage) => setForm((f) => ({ ...f, paperImage }))} />
                </CollapsibleSection>

                <CollapsibleSection title="Mood" icon={<Smile size={13} />}>
                  <MoodPicker value={form.mood} onChange={(mood) => setForm((f) => ({ ...f, mood }))} />
                </CollapsibleSection>

                <CollapsibleSection title="Privacy" icon={<EyeOff size={13} />}>
                  <label className="flex items-center gap-2 text-sm text-[#4a3a2c]">
                    <input
                      type="checkbox"
                      checked={!!form.isPrivate}
                      onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
                    />
                    Keep this letter private (only I can see it)
                  </label>
                </CollapsibleSection>
              </div>
            </div>
          )}
        </motion.div>

        <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-[#e7d8c2] bg-white/70 px-6 py-3 backdrop-blur">
          {!editMode ? (
            <>
              <div className="flex gap-2">
                <ActionButton onClick={onToggleFavorite} active={note.isFavorite} icon={<Heart size={13} className={note.isFavorite ? 'fill-current' : ''} />}>
                  {note.isFavorite ? 'Favorited' : 'Favorite'}
                </ActionButton>
                <ActionButton onClick={onToggleArchive} icon={note.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}>
                  {note.isArchived ? 'Unarchive' : 'Archive'}
                </ActionButton>
              </div>
              <div className="flex gap-2">
                <ActionButton onClick={() => setEditMode(true)} icon={<Pencil size={13} />}>
                  Edit
                </ActionButton>
                <ActionButton danger onClick={onDelete} icon={<Trash2 size={13} />}>
                  Delete
                </ActionButton>
              </div>
            </>
          ) : (
            <div className="ml-auto flex gap-2">
              <ActionButton onClick={() => setEditMode(false)} disabled={saving}>
                Cancel
              </ActionButton>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="appearance-none rounded-full border-0 bg-[#a8391f] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#8c2c16] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Letter'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActionButton({ children, onClick, active, danger, disabled, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex appearance-none items-center gap-1.5 rounded-full border-0 px-3.5 py-2 text-xs font-medium transition disabled:opacity-50 ${
        danger
          ? 'bg-[#f4e1da] text-[#a8391f] hover:bg-[#eccbc0]'
          : active
            ? 'bg-[#a8391f] text-white'
            : 'bg-[#ece1d2] text-[#4a3a2c] hover:bg-[#e2d4bf]'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
