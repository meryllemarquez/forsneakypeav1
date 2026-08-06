import { Settings, Database, ShieldCheck } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-(--color-admin-border) bg-(--color-admin-surface) p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-admin-accent-soft) text-(--color-admin-accent)">
          <Settings size={18} strokeWidth={1.75} />
        </div>
        <p className="m-0 mt-4 text-[15px] font-semibold text-(--color-admin-text)">System Settings</p>
        <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-(--color-admin-text-muted)">
          Nothing configurable here yet — this section is reserved for future controls (backup/export, storage
          limits, notification preferences). For now, everything runs on defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-(--color-admin-border) bg-(--color-admin-surface) p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-admin-surface-2) text-(--color-admin-text-muted)">
            <Database size={15} />
          </div>
          <p className="m-0 mt-3 text-[13px] font-medium text-(--color-admin-text)">Storage</p>
          <p className="m-0 mt-1 text-xs text-(--color-admin-text-muted)">Usage tracking is future-ready — not yet computed.</p>
        </div>
        <div className="rounded-2xl border border-(--color-admin-border) bg-(--color-admin-surface) p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-admin-surface-2) text-(--color-admin-text-muted)">
            <ShieldCheck size={15} />
          </div>
          <p className="m-0 mt-3 text-[13px] font-medium text-(--color-admin-text)">Security</p>
          <p className="m-0 mt-1 text-xs text-(--color-admin-text-muted)">Admin routes are role-gated on both frontend and backend.</p>
        </div>
      </div>
    </div>
  );
}
