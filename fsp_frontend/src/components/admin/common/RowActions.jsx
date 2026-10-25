import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import IconButton from '../../ui/IconButton/IconButton';

/**
 * Archive / restore + delete for one admin table row. Always visible (no hover needed), 44px
 * targets, and each button names the row so a screen reader hears "Delete Sunset picnic".
 */
export default function RowActions({ name, isArchived, onToggleArchive, onDelete }) {
  const label = name || 'item';
  return (
    <div className="flex items-center gap-2">
      <IconButton label={`${isArchived ? 'Restore' : 'Archive'} ${label}`} onClick={onToggleArchive}>
        {isArchived ? <ArchiveRestore size={18} strokeWidth={2.6} aria-hidden="true" /> : <Archive size={18} strokeWidth={2.6} aria-hidden="true" />}
      </IconButton>
      <IconButton label={`Delete ${label}`} variant="danger" onClick={onDelete}>
        <Trash2 size={18} strokeWidth={2.6} aria-hidden="true" />
      </IconButton>
    </div>
  );
}
