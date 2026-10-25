import { useState } from 'react';
import Button from '../../ui/Button/Button';
import Modal from '../../ui/Modal/Modal';
import PaperPicker from './PaperPicker';
import MoodPicker from './MoodPicker';
import NoteCanvasEditor from './NoteCanvasEditor';
import { inputClass, labelClass } from '../common/lbUi';
import { LbPaperThumb } from '../common/lbGraphics';
import { PAPERS, paperValue } from '../../../constants/loveBoardCatalog';
import { deriveSearchableContent, stringifyJsonList } from '../../../utils/noteCanvas';

const STEPS = ['Choose paper', 'Design it'];

const emptyForm = () => ({
  paperImage: paperValue(PAPERS[0].id),
  title: '',
  textBoxes: [],
  attachments: [],
  mood: null,
  isPrivate: false,
});

export default function NoteComposerModal({ open, onClose, onCreate, creating }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);

  // Start every time the composer opens from a blank letter on step 1 (adjusted during render,
  // so there is no flash of the previous draft).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep(0);
      setForm(emptyForm());
    }
  }

  const canAdvance = step === 0 ? !!form.paperImage : true;

  const handleSubmit = async () => {
    await onCreate({
      paperImage: form.paperImage,
      title: form.title,
      content: deriveSearchableContent(form.textBoxes),
      contentBlocks: stringifyJsonList(form.textBoxes),
      attachments: stringifyJsonList(form.attachments),
      mood: form.mood,
      isPrivate: form.isPrivate,
    });
  };

  const footer = (
    <>
      <Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || creating}>
        Back
      </Button>
      {step < STEPS.length - 1 ? (
        <Button variant="primary" onClick={() => canAdvance && setStep((s) => s + 1)} disabled={!canAdvance}>
          Next
        </Button>
      ) : (
        <Button variant="primary" onClick={handleSubmit} disabled={creating}>
          {creating ? 'Pinning…' : 'Pin to board'}
        </Button>
      )}
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={STEPS[step]} size="lg" locked={creating} footer={footer}>
      <p className="m-0 mb-4 font-caveat text-2xl leading-none font-bold text-(--tomato)">
        step {step + 1} of {STEPS.length}
      </p>

      {step === 0 && (
        <div className="flex gap-5">
          <div className="hidden w-56 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-solid border-(--outline) bg-(--gelato-tint) p-4 sm:flex">
            <LbPaperThumb value={form.paperImage} size={176} />
            <p className="m-0 text-center text-sm text-(--ink-soft)">Pick the paper, then design it on the next step.</p>
          </div>
          <div className="min-w-0 flex-1">
            <PaperPicker value={form.paperImage} onChange={(paperImage) => setForm((f) => ({ ...f, paperImage }))} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="lb-title" className={labelClass}>Title (optional)</label>
            <input
              id="lb-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="A little heading… (shown in Archive & Layers, not on the paper)"
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

          <div>
            <p className={labelClass}>Mood</p>
            <MoodPicker value={form.mood} onChange={(mood) => setForm((f) => ({ ...f, mood }))} />
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold text-(--ink)">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
              className="lb-focus size-6 accent-(--ink)"
            />
            Keep this letter private (only I can see it)
          </label>
        </div>
      )}
    </Modal>
  );
}
