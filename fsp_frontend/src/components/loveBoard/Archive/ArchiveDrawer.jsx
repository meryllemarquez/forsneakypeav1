import { motion } from 'framer-motion';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import Icon from '../../Icon';
import { DrawerPanel, PillButton } from '../common/lbUi';
import { LbPaperThumb } from '../common/lbGraphics';

export default function ArchiveDrawer({ open, notes = [], onClose, onRestore, onDelete }) {
  return (
    <DrawerPanel open={open} onClose={onClose} side="left" eyebrow="tucked away" title="Archived Letters">
      <div className="flex-1 overflow-y-auto p-4">
        {notes.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-(--ink-soft)">
            <Icon name="cassette" size={56} sticker tilt={-6} />
            <p className="m-0 text-sm font-bold">Nothing archived yet.</p>
          </div>
        )}

        <ul className="m-0 space-y-3 p-0 list-none">
          {notes.map((note) => (
            <motion.li
              key={note.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3 rounded-2xl border-2 border-solid border-(--outline) bg-(--paper) p-3"
            >
              <span className="shrink-0 overflow-hidden rounded-lg border-2 border-solid border-(--outline) bg-(--white)">
                <LbPaperThumb value={note.paperImage} size={44} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-extrabold text-(--ink)">{note.title || 'Untitled letter'}</p>
                <p className="m-0 truncate text-xs text-(--ink-soft)">{note.content}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <PillButton variant="primary" className="!min-h-11 !px-3 !text-xs" onClick={() => onRestore(note)}>
                  <ArchiveRestore size={14} strokeWidth={2.6} aria-hidden="true" />
                  Restore
                </PillButton>
                <PillButton className="!min-h-11 !px-3 !text-xs" onClick={() => onDelete(note)}>
                  <Trash2 size={14} strokeWidth={2.6} aria-hidden="true" />
                  Delete
                </PillButton>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </DrawerPanel>
  );
}
