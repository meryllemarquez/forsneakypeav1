import { useEffect, useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Trash2, Lock, Heart } from 'lucide-react';
import DataTable from '../../components/admin/common/DataTable';
import FilterBar from '../../components/admin/common/FilterBar';
import ConfirmDialog from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { loveBoardService } from '../../services/loveBoardService';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export default function AdminLettersPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [archivedFilter, setArchivedFilter] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await loveBoardService.getNotes();
        if (mounted) setNotes(Array.isArray(data) ? data : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return notes
      .filter((n) => (archivedFilter === 'archived' ? n.isArchived : archivedFilter === 'active' ? !n.isArchived : true))
      .filter((n) => !query || (n.title || n.content || '').toLowerCase().includes(query.toLowerCase()));
  }, [notes, archivedFilter, query]);

  const toggleArchive = async (note) => {
    await loveBoardService.updateNote(note.id, { isArchived: !note.isArchived });
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, isArchived: !n.isArchived } : n)));
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await loveBoardService.deleteNote(confirmDelete.id);
      setNotes((prev) => prev.filter((n) => n.id !== confirmDelete.id));
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title', render: (r) => r.title || <span className="text-(--color-admin-text-muted) italic">Untitled letter</span> },
    { key: 'authorName', label: 'Author' },
    {
      key: 'flags',
      label: 'Flags',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-(--color-admin-text-muted)">
          {r.isFavorite && <Heart size={13} className="fill-current text-(--color-admin-danger)" />}
          {r.isPrivate && <Lock size={13} />}
        </span>
      ),
    },
    {
      key: 'isArchived',
      label: 'Status',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.isArchived ? 'bg-(--color-admin-warning-soft) text-(--color-admin-warning)' : 'bg-(--color-admin-success-soft) text-(--color-admin-success)'}`}>
          {r.isArchived ? 'Archived' : 'Active'}
        </span>
      ),
    },
    { key: 'updatedAt', label: 'Updated', render: (r) => formatDate(r.updatedAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleArchive(r)}
            title={r.isArchived ? 'Restore' : 'Archive'}
            className="flex h-7 w-7 appearance-none items-center justify-center rounded-md border-0 bg-(--color-admin-surface-2) text-(--color-admin-text-muted) transition hover:bg-(--color-admin-border)"
          >
            {r.isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(r)}
            title="Delete"
            className="flex h-7 w-7 appearance-none items-center justify-center rounded-md border-0 bg-(--color-admin-danger-soft) text-(--color-admin-danger) transition hover:opacity-80"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search letters…"
        filters={[
          {
            label: 'Status',
            value: archivedFilter,
            onChange: setArchivedFilter,
            options: [
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' },
            ],
          },
        ]}
        onClear={() => {
          setQuery('');
          setArchivedFilter(null);
        }}
      />

      <DataTable columns={columns} rows={filtered} getRowKey={(r) => r.id} loading={loading} emptyTitle="No love letters found" />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this letter?"
        message="This letter will be permanently removed from the board."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => !busy && setConfirmDelete(null)}
      />
    </div>
  );
}
