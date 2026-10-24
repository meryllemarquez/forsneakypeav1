import { useEffect, useState } from 'react';
import { ShieldCheck, UserX, UserCheck } from 'lucide-react';
import DataTable from '../../components/admin/common/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null); // { user, nextActive }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await adminService.getUsers();
        if (mounted) setUsers(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleConfirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await adminService.setUserActive(pending.user.id, pending.nextActive, `Toggled by ${currentUser?.name || 'admin'}`);
      setUsers((prev) => prev.map((u) => (u.id === pending.user.id ? { ...u, active: pending.nextActive } : u)));
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'username', label: 'Username', sortable: true },
    {
      key: 'role',
      label: 'Role',
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            r.role === 'ROLE_ADMIN' ? 'bg-(--color-admin-accent-soft) text-(--color-admin-accent)' : 'bg-(--color-admin-surface-2) text-(--color-admin-text-muted)'
          }`}
        >
          {r.role === 'ROLE_ADMIN' && <ShieldCheck size={11} />}
          {r.role?.replace('ROLE_', '')}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.active ? 'bg-(--color-admin-success-soft) text-(--color-admin-success)' : 'bg-(--color-admin-danger-soft) text-(--color-admin-danger)'}`}>
          {r.active ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    { key: 'lastLoginAt', label: 'Last Login', sortable: true, sortValue: (r) => (r.lastLoginAt ? new Date(r.lastLoginAt).getTime() : 0), render: (r) => formatDate(r.lastLoginAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <button
          type="button"
          disabled={r.id === currentUser?.id}
          onClick={() => setPending({ user: r, nextActive: !r.active })}
          title={r.id === currentUser?.id ? "You can't disable your own account" : undefined}
          className={`inline-flex appearance-none items-center gap-1.5 rounded-lg border-0 px-2.5 py-1.5 text-[11.5px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
            r.active ? 'bg-(--color-admin-danger-soft) text-(--color-admin-danger) hover:opacity-80' : 'bg-(--color-admin-success-soft) text-(--color-admin-success) hover:opacity-80'
          }`}
        >
          {r.active ? <UserX size={12} /> : <UserCheck size={12} />}
          {r.active ? 'Disable' : 'Enable'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} rows={users} getRowKey={(r) => r.id} loading={loading} emptyTitle="No users found" />

      <ConfirmDialog
        open={!!pending}
        title={pending ? `${pending.nextActive ? 'Enable' : 'Disable'} ${pending.user.name}?` : ''}
        message={
          pending?.nextActive
            ? 'They will regain access to the app immediately.'
            : 'They will be signed out and unable to log back in until re-enabled.'
        }
        confirmLabel={pending?.nextActive ? 'Enable account' : 'Disable account'}
        danger={!pending?.nextActive}
        busy={busy}
        onConfirm={handleConfirm}
        onClose={() => !busy && setPending(null)}
      />
    </div>
  );
}
