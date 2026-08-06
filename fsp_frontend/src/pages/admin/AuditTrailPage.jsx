import { useEffect, useState } from 'react';
import DataTable from '../../components/admin/common/DataTable';
import Pagination from '../../components/admin/common/Pagination';
import { auditService } from '../../services/auditService';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function short(json) {
  if (!json) return '—';
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  } catch {
    return String(json);
  }
}

export default function AuditTrailPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await auditService.list(page, 15);
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
  }, [page]);

  const columns = [
    { key: 'createdAt', label: 'Time', render: (r) => formatDate(r.createdAt) },
    { key: 'actorId', label: 'Admin', render: (r) => `#${r.actorId}` },
    { key: 'entity', label: 'Entity', render: (r) => r.entity },
    { key: 'action', label: 'Action', render: (r) => r.action.replaceAll('_', ' ') },
    { key: 'changedFields', label: 'Changed', render: (r) => <span className="text-(--color-admin-text-muted)">{short(r.changedFields)}</span> },
    { key: 'reason', label: 'Reason', render: (r) => r.reason || '—' },
  ];

  return (
    <div className="space-y-4">
      <p className="m-0 text-[13px] text-(--color-admin-text-muted)">
        Every admin action is recorded here permanently, with a before/after snapshot.
      </p>
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        loading={loading}
        emptyTitle="No admin actions yet"
        emptyDescription="User enable/disable and content moderation actions will appear here."
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
