import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Pin } from 'lucide-react';
import PaperPicker from './PaperPicker';
import MoodPicker from './MoodPicker';
import NoteCanvasEditor from './NoteCanvasEditor';
import { deriveSearchableContent, stringifyJsonList } from '../../../utils/noteCanvas';

const STEPS = ['Choose Paper', 'Design It'];

function byFilename(list = []) {
  return Object.fromEntries(list.map((item) => [item.filename, item.url]));
}

export default function NoteComposerModal({ assets, onClose, onCreate, creating }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    paperImage: assets?.papers?.[0]?.filename || '',
    title: '',
    textBoxes: [],
    attachments: [],
    mood: null,
    isPrivate: false,
  });

  const papers = useMemo(() => byFilename(assets?.papers), [assets]);

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

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#e7d8c2]/60 bg-[#fffaf1] shadow-2xl"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === 0 && (
          <div className="hidden w-64 shrink-0 flex-col items-center justify-center gap-4 bg-[#efe4d2] p-6 sm:flex">
            <div className="relative h-56 w-52 drop-shadow-[0_12px_20px_rgba(40,25,10,0.35)]">
              {papers[form.paperImage] && (
                <img src={papers[form.paperImage]} alt="" className="absolute inset-0 h-full w-full object-fill" />
              )}
            </div>
            <p className="text-center text-xs text-[#8a7360]">Pick the paper, then design it on the next step.</p>
          </div>
        )}

        {/* Wizard */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[#e7d8c2] px-6 py-4">
            <div>
              <p className="m-0 text-xs uppercase tracking-wide text-[#8a7360]">Step {step + 1} of {STEPS.length}</p>
              <h2 className="m-0 font-serif text-lg text-[#3a2b1e]">{STEPS[step]}</h2>
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

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === 0 && (
              <PaperPicker papers={assets?.papers} value={form.paperImage} onChange={(paperImage) => setForm((f) => ({ ...f, paperImage }))} />
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8a7360]">Title (optional)</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="A little heading… (shown in Archive & Layers, not on the paper)"
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

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8a7360]">Mood</label>
                  <MoodPicker value={form.mood} onChange={(mood) => setForm((f) => ({ ...f, mood }))} />
                </div>
                <label className="flex items-center gap-2 text-sm text-[#4a3a2c]">
                  <input
                    type="checkbox"
                    checked={form.isPrivate}
                    onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
                  />
                  Keep this letter private (only I can see it)
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#e7d8c2] px-6 py-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="appearance-none rounded-full border-0 bg-[#ece1d2] px-4 py-2 text-sm text-[#4a3a2c] transition hover:bg-[#e2d4bf] disabled:opacity-40"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => canAdvance && setStep((s) => s + 1)}
                disabled={!canAdvance}
                className="appearance-none rounded-full border-0 bg-[#a8391f] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#8c2c16] disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={creating}
                className="appearance-none rounded-full border-0 bg-[#a8391f] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#8c2c16] disabled:opacity-50"
              >
                {creating ? (
                  'Pinning…'
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Pin size={14} />
                    Pin to Board
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
