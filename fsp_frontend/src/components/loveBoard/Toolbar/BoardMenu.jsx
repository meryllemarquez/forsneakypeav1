import { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Hand, Layers, MousePointer2, Redo2, RotateCcw, Scissors, Trash2, Undo2, ZoomIn, ZoomOut, Ellipsis } from 'lucide-react';
import Icon from '../../Icon';
import { Chip, PillButton, RoundButton } from '../common/lbUi';

// Everything that is not a main action lives here, so the header and the bottom bar stay calm.
export default function BoardMenu({
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetView,
  favoritesOnly,
  onToggleFavorites,
  layersOpen,
  onToggleLayers,
  onOpenArchive,
  decorateMode,
  onToggleDecorate,
  onDeleteAll,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Opening another panel or a dialog from the menu also closes the menu.
  const run = (fn) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="lb-focus inline-flex min-h-11 cursor-pointer appearance-none items-center gap-2 rounded-full border-2 border-solid border-(--outline) bg-(--white) px-4 text-sm font-extrabold text-(--ink) transition hover:bg-(--sea-tint)"
      >
        <Ellipsis size={20} strokeWidth={2.8} aria-hidden="true" />
        More
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label="More board options"
            className="absolute top-[calc(100%+10px)] right-0 z-[130] max-h-[calc(100vh-7rem)] w-[min(92vw,22rem)] overflow-y-auto rounded-[28px] border-2 border-solid border-(--outline) bg-(--white) p-4 text-(--ink) shadow-[6px_6px_0_var(--sea)]"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <p className="m-0 mb-1.5 font-caveat text-2xl leading-none font-bold text-(--tomato)">tools</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tool">
              <Chip active={activeTool === 'select'} onClick={() => onToolChange('select')}>
                <MousePointer2 size={18} strokeWidth={2.6} aria-hidden="true" />
                Select
              </Chip>
              <Chip active={activeTool === 'hand'} onClick={() => onToolChange('hand')}>
                <Hand size={18} strokeWidth={2.6} aria-hidden="true" />
                Pan
              </Chip>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Undo and redo">
              <RoundButton label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}>
                <Undo2 size={18} strokeWidth={2.6} aria-hidden="true" />
              </RoundButton>
              <RoundButton label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo}>
                <Redo2 size={18} strokeWidth={2.6} aria-hidden="true" />
              </RoundButton>
              <span className="mx-1 h-6 w-0.5 bg-(--ink)/25" aria-hidden="true" />
              <RoundButton label="Zoom out" onClick={onZoomOut}>
                <ZoomOut size={18} strokeWidth={2.6} aria-hidden="true" />
              </RoundButton>
              <span className="min-w-12 text-center text-sm font-extrabold tabular-nums" aria-live="polite">
                {zoomPercent}%
              </span>
              <RoundButton label="Zoom in" onClick={onZoomIn}>
                <ZoomIn size={18} strokeWidth={2.6} aria-hidden="true" />
              </RoundButton>
              <RoundButton label="Reset view" onClick={onResetView}>
                <RotateCcw size={18} strokeWidth={2.6} aria-hidden="true" />
              </RoundButton>
            </div>

            <p className="m-0 mt-4 mb-1.5 font-caveat text-2xl leading-none font-bold text-(--tomato)">the board</p>
            <div className="flex flex-col gap-2">
              <Chip active={favoritesOnly} onClick={onToggleFavorites} className="justify-start">
                <Icon name="heart" size={26} />
                Favorites only
              </Chip>
              <Chip active={layersOpen} onClick={run(onToggleLayers)} className="justify-start">
                <Layers size={18} strokeWidth={2.6} aria-hidden="true" />
                Layers
              </Chip>
              <PillButton onClick={run(onOpenArchive)} className="justify-start">
                <Archive size={18} strokeWidth={2.6} aria-hidden="true" />
                Archived letters
              </PillButton>
              <Chip active={decorateMode} onClick={onToggleDecorate} className="justify-start">
                <Scissors size={18} strokeWidth={2.6} aria-hidden="true" />
                Decorate stickers
              </Chip>
            </div>

            <div className="mt-4 border-0 border-t-2 border-dashed border-(--outline)/40 pt-3">
              <PillButton onClick={run(onDeleteAll)} className="w-full justify-start">
                <Trash2 size={18} strokeWidth={2.6} aria-hidden="true" />
                Delete all letters and stickers…
              </PillButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
