import { Search, X } from 'lucide-react';

export default function FilterBar({ search, onSearchChange, searchPlaceholder = 'Search…', filters = [], onClear }) {
  const hasActiveFilters = filters.some((f) => f.value) || (search && search.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-(--color-admin-border) bg-(--color-admin-surface) p-2.5">
      {onSearchChange && (
        <div className="relative min-w-0 basis-full sm:max-w-sm sm:min-w-[180px] sm:flex-1 sm:basis-auto">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--color-admin-text-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-(--color-admin-border) bg-(--color-admin-surface-2) py-2 pr-3 pl-9 text-base sm:text-[13px] text-(--color-admin-text) outline-none transition focus:border-(--color-admin-accent)/50 focus:ring-2 focus:ring-(--color-admin-accent)/15"
          />
        </div>
      )}

      {filters.map((filter) => (
        <select
          key={filter.label}
          value={filter.value || ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
          className="min-w-0 max-w-full flex-1 basis-[calc(50%-0.25rem)] rounded-lg border border-(--color-admin-border) bg-(--color-admin-surface-2) px-3 py-2 text-base text-(--color-admin-text) outline-none transition focus:border-(--color-admin-accent)/50 sm:flex-none sm:basis-auto sm:text-[13px]"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {hasActiveFilters && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex appearance-none items-center gap-1 rounded-lg border-0 bg-transparent px-2.5 py-2 text-[13px] font-medium text-(--color-admin-text-muted) transition hover:bg-(--color-admin-surface-2)"
        >
          <X size={13} />
          Clear
        </button>
      )}
    </div>
  );
}
