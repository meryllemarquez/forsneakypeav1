import { useEffect, useState } from 'react';
import DataTable from '../../components/admin/common/DataTable';
import FilterBar from '../../components/admin/common/FilterBar';
import Pagination from '../../components/admin/common/Pagination';
import { activityLogService } from '../../services/activityLogService';

const MODULE_OPTIONS = [
  'DATE', 'CHECKLIST_ITEM', 'CATEGORY', 'REMINDER', 'ATTACHMENT',
  'MEMORY_FOLDER', 'MEMORY_PHOTO', 'LOVE_NOTE', 'LOVE_STICKER', 'USER',
].map((v) => ({ value: v, label: v.replaceAll('_', ' ') }));

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function ActivityLogPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [action, setAction] = useState('');
  const [module, setModule] = useState(null);
  const [status, setStatus] = useState(null);
  const [sort, setSort] = useState('desc');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await activityLogService.search({ action, module, status, sort, page, size: 15 });
        if (mounted) {
          setRows(data.content || []);
          setTotalPages(data.totalPages || 0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [action, module, status, sort, page]);

  const columns = [
    { key: 'createdAt', label: 'Time', sortable: true, sortValue: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0), render: (r) => formatDate(r.createdAt) },
    { key: 'userId', label: 'User', sortable: true, render: (r) => (r.userId != null ? `#${r.userId}` : 'System') },
    { key: 'action', label: 'Action', sortable: true, render: (r) => r.action.replaceAll('_', ' ') },
    { key: 'entityType', label: 'Category', sortable: true, render: (r) => r.entityType?.replaceAll('_', ' ') || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            r.status === 'FAILED' ? 'bg-(--color-admin-danger-soft) text-(--color-admin-danger)' : 'bg-(--color-admin-success-soft) text-(--color-admin-success)'
          }`}
        >
          {r.status || 'SUCCESS'}
        </span>
      ),
    },
    { key: 'entityId', label: 'Details', render: (r) => (r.entityId ? <span className="font-mono text-xs text-(--color-admin-text-muted)">{r.entityId.slice(0, 8)}…</span> : '—') },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        search={action}
        onSearchChange={(v) => {
          setAction(v);
          setPage(0);
        }}
        searchPlaceholder="Filter by action…"
        filters={[
          {
            label: 'Module',
            value: module,
            onChange: (v) => {
              setModule(v);
              setPage(0);
            },
            options: MODULE_OPTIONS,
          },
          {
            label: 'Status',
            value: status,
            onChange: (v) => {
              setStatus(v);
              setPage(0);
            },
            options: [
              { value: 'SUCCESS', label: 'Success' },
              { value: 'FAILED', label: 'Failed' },
            ],
          },
          {
            label: 'Sort',
            value: sort,
            onChange: setSort,
            options: [
              { value: 'desc', label: 'Newest first' },
              { value: 'asc', label: 'Oldest first' },
            ],
          },
        ]}
        onClear={() => {
          setAction('');
          setModule(null);
          setStatus(null);
          setPage(0);
        }}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        loading={loading}
        emptyTitle="No activity recorded"
        emptyDescription="Actions across every module will show up here as they happen."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
