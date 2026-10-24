import { useState } from 'react';
import { Lock, Archive, ArchiveRestore, Pencil, Trash2, Image, Smile, EyeOff, Heart } from 'lucide-react';
import Icon from '../../Icon';
import Button from '../../ui/Button/Button';
import Modal from '../../ui/Modal/Modal';
import PaperPicker from '../Composer/PaperPicker';
import MoodPicker from '../Composer/MoodPicker';
import NoteCanvasEditor from '../Composer/NoteCanvasEditor';
import NoteCanvasPreview from './NoteCanvasPreview';
import CollapsibleSection from '../common/CollapsibleSection';
import { inputClass, labelClass } from '../common/lbUi';
import { MOOD_OPTIONS } from '../../../constants/loveBoardConstants';
import { getEffectiveTextBoxes, getEffectiveAttachments, deriveSearchableContent, stringifyJsonList } from '../../../utils/noteCanvas';

const formFromNote = (note) => ({
  title: note.title || '',
  paperImage: note.paperImage,
  textBoxes: getEffectiveTextBoxes(note),
  attachments: getEffectiveAttachments(note),
  mood: note.mood,
  isPrivate: note.isPrivate,
});

/**
 * Reader / editor for one letter. `note` is null while closed. The last note is kept while the
 * dialog slides out, and the edit form starts fresh each time a different letter is opened.
 */
export default function NoteReaderModal({ note, onClose, onSave, onToggleFavorite, onToggleArchive, onDelete, saving }) {
  const [shown, setShown] = useState(note);
  const [trackedId, setTrackedId] = useState(note?.id ?? null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(() => (note ? formFromNote(note) : null));

  if ((note?.id ?? null) !== trackedId) {
    setTrackedId(note?.id ?? null);
    if (note) {
      setShown(note);
      setEditMode(false);
      setForm(formFromNote(note));
    }
  } else if (note && note !== shown) {
    setShown(note);
  }


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

  const current = shown;
  const moodInfo = current && MOOD_OPTIONS.find((m) => m.value === current.mood);

  const footer = current && (
    editMode ? (
      <>
        <Button onClick={() => setEditMode(false)} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save letter'}
        </Button>
      </>
    ) : (
      <>
        <Button size="sm" onClick={onToggleFavorite} aria-pressed={!!current.isFavorite}>
          {current.isFavorite ? <Icon name="heart" size={26} /> : <Heart size={18} strokeWidth={2.6} aria-hidden="true" />}
          {current.isFavorite ? 'Favorited' : 'Favorite'}
        </Button>
        <Button size="sm" onClick={onToggleArchive}>
          {current.isArchived ? <ArchiveRestore size={18} strokeWidth={2.6} aria-hidden="true" /> : <Archive size={18} strokeWidth={2.6} aria-hidden="true" />}
          {current.isArchived ? 'Unarchive' : 'Archive'}
        </Button>
        <Button size="sm" onClick={() => setEditMode(true)}>
          <Pencil size={18} strokeWidth={2.6} aria-hidden="true" />
          Edit
        </Button>
        <Button size="sm" onClick={onDelete}>
          <Trash2 size={18} strokeWidth={2.6} aria-hidden="true" />
          Delete
        </Button>
      </>
    )
  );

  return (
    <Modal
      open={!!note}
      onClose={onClose}
      title={current ? current.title || (editMode ? 'Edit letter' : 'A letter for us') : undefined}
      ariaLabel="Letter"
      size="lg"
      locked={!!saving}
      footer={footer}
    >
      {current && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-(--ink-soft)">
            <span>{current.isMine ? 'You' : current.authorName}</span>
            <span aria-hidden="true">·</span>
            <span>{current.updatedAt ? new Date(current.updatedAt).toLocaleDateString() : ''}</span>
            {current.isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-solid border-(--ink) bg-(--gelato) px-2.5 py-0.5 text-(--ink)">
                <Lock size={14} strokeWidth={2.6} aria-hidden="true" />
                Private
              </span>
            )}
          </div>

          {!editMode ? (
            <div className="flex flex-col items-center text-center">
              <NoteCanvasPreview
                note={current}
                className="drop-shadow-[4px_5px_0_rgba(23,43,112,0.22)]"
              />
              {moodInfo && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-(--ink)">
                  <moodInfo.icon size={18} strokeWidth={2.4} aria-hidden="true" />
                  {moodInfo.label}
                </p>
              )}
            </div>
          ) : (
            form && (
              <div className="space-y-4 text-left">
                <div>
                  <label htmlFor="lb-edit-title" className={labelClass}>Title</label>
                  <input
                    id="lb-edit-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Shown in Archive & Layers, not on the paper"
                    className={inputClass}
                  />
                </div>

                <NoteCanvasEditor
                  paper={form.paperImage}
                  textBoxes={form.textBoxes}
                  attachments={form.attachments}
                  onChangeTextBoxes={(textBoxes) => setForm((f) => ({ ...f, textBoxes }))}
                  onChangeAttachments={(attachments) => setForm((f) => ({ ...f, attachments }))}
                />

                <div className="space-y-2.5 pt-1">
                  <CollapsibleSection title="Paper" icon={<Image size={18} strokeWidth={2.6} aria-hidden="true" />}>
                    <PaperPicker value={form.paperImage} onChange={(paperImage) => setForm((f) => ({ ...f, paperImage }))} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Mood" icon={<Smile size={18} strokeWidth={2.6} aria-hidden="true" />}>
                    <MoodPicker value={form.mood} onChange={(mood) => setForm((f) => ({ ...f, mood }))} />
                  </CollapsibleSection>

                  <CollapsibleSection title="Privacy" icon={<EyeOff size={18} strokeWidth={2.6} aria-hidden="true" />}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold text-(--ink)">
                      <input
                        type="checkbox"
                        checked={!!form.isPrivate}
                        onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
                        className="lb-focus size-6 accent-(--tomato)"
                      />
                      Keep this letter private (only I can see it)
                    </label>
                  </CollapsibleSection>
                </div>
              </div>
            )
          )}
        </>
      )}
    </Modal>
  );
}
