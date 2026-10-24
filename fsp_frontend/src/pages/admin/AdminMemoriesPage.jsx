import { useEffect, useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import DataTable from '../../components/admin/common/DataTable';
import FilterBar from '../../components/admin/common/FilterBar';
import ConfirmDialog from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { memoryService } from '../../services/memoryService';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export default function AdminMemoriesPage() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [archivedFilter, setArchivedFilter] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await memoryService.getFolders(true);
        if (mounted) setFolders(Array.isArray(data) ? data : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return folders
      .filter((f) => (archivedFilter === 'archived' ? f.isArchived : archivedFilter === 'active' ? !f.isArchived : true))
      .filter((f) => !query || f.name.toLowerCase().includes(query.toLowerCase()));
  }, [folders, archivedFilter, query]);

  const toggleArchive = async (folder) => {
    // Backend PUT expects the full folder payload (name/description are
    // required fields, not optional patches) — send it back with only
    // isArchived flipped.
    await memoryService.updateFolder(folder.id, {
      name: folder.name,
      description: folder.description,
      accentColor: folder.accentColor,
      iconStyle: folder.iconStyle,
      coverImageUrl: folder.coverImageUrl,
      isArchived: !folder.isArchived,
    });
    setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, isArchived: !f.isArchived } : f)));
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await memoryService.deleteFolder(confirmDelete.id);
      setFolders((prev) => prev.filter((f) => f.id !== confirmDelete.id));
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Folder',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-(--color-admin-surface-2)">
            {r.coverImageUrl && <img src={r.coverImageUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          {r.name}
        </div>
      ),
    },
    { key: 'photoCount', label: 'Photos' },
    {
      key: 'isArchived',
      label: 'Status',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.isArchived ? 'bg-(--color-admin-warning-soft) text-(--color-admin-warning)' : 'bg-(--color-admin-success-soft) text-(--color-admin-success)'}`}>
          {r.isArchived ? 'Archived' : 'Active'}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Created', render: (r) => formatDate(r.createdAt) },
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
        searchPlaceholder="Search memory folders…"
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

      <DataTable columns={columns} rows={filtered} getRowKey={(r) => r.id} loading={loading} emptyTitle="No memory folders found" />

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete "${confirmDelete?.name}"?`}
        message="This will permanently delete the folder and all photos inside it."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => !busy && setConfirmDelete(null)}
      />
    </div>
  );
}
