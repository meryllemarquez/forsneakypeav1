import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/admin/common/DataTable';
import RowActions from '../../components/admin/common/RowActions';
import FilterBar from '../../components/admin/common/FilterBar';
import ConfirmDialog from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { dateService } from '../../services/dateService';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

const STATUS_TONE = {
  DREAMING: 'bg-(--color-admin-surface-2) text-(--color-admin-text-muted)',
  PLANNING: 'bg-(--color-admin-accent-soft) text-(--color-admin-accent)',
  BOOKED: 'bg-(--color-admin-warning-soft) text-(--color-admin-warning)',
  READY: 'bg-(--color-admin-warning-soft) text-(--color-admin-warning)',
  COMPLETED: 'bg-(--color-admin-success-soft) text-(--color-admin-success)',
  CANCELLED: 'bg-(--color-admin-danger-soft) text-(--color-admin-danger)',
};

export default function AdminDatesPage() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await dateService.getDates({ includeArchived: true });
        if (mounted) setDates(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return dates
      .filter((d) => !status || d.status === status)
      .filter((d) => !query || d.title.toLowerCase().includes(query.toLowerCase()));
  }, [dates, status, query]);

  const toggleArchive = async (date) => {
    if (date.isArchived) {
      await dateService.unarchiveDate(date.id);
    } else {
      await dateService.archiveDate(date.id);
    }
    setDates((prev) => prev.map((d) => (d.id === date.id ? { ...d, isArchived: !d.isArchived } : d)));
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await dateService.deleteDate(confirmDelete.id);
      setDates((prev) => prev.filter((d) => d.id !== confirmDelete.id));
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'createdByName', label: 'Created By' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[r.status] || ''}`}>{r.status}</span>,
    },
    {
      key: 'isArchived',
      label: 'Archived',
      render: (r) => (r.isArchived ? 'Yes' : 'No'),
    },
    { key: 'plannedDate', label: 'Planned', render: (r) => formatDate(r.plannedDate) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <RowActions name={r.title || r.name} isArchived={r.isArchived} onToggleArchive={() => toggleArchive(r)} onDelete={() => setConfirmDelete(r)} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search date plans…"
        filters={[
          {
            label: 'Status',
            value: status,
            onChange: setStatus,
            options: Object.keys(STATUS_TONE).map((s) => ({ value: s, label: s })),
          },
        ]}
        onClear={() => {
          setQuery('');
          setStatus(null);
        }}
      />

      <DataTable columns={columns} rows={filtered} getRowKey={(r) => r.id} loading={loading} emptyTitle="No date plans found" />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this date plan?"
        message="This will permanently remove it from the bucket list."
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => !busy && setConfirmDelete(null)}
      />
    </div>
  );
}
