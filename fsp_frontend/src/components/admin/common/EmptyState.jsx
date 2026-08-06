export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-(--color-admin-border) bg-(--color-admin-surface-2) px-6 py-14 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--color-admin-accent-soft) text-(--color-admin-accent)">
          <Icon size={20} strokeWidth={1.75} />
        </div>
      )}
      <div>
        <p className="m-0 text-sm font-medium text-(--color-admin-text)">{title}</p>
        {description && <p className="m-0 mt-1 text-xs text-(--color-admin-text-muted)">{description}</p>}
      </div>
      {action}
    </div>
  );
}
