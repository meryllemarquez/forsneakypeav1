import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-3">
      <p className="m-0 text-xs text-(--color-admin-text-muted)">
        Page {page + 1} of {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="flex h-8 w-8 appearance-none items-center justify-center rounded-lg border border-(--color-admin-border) bg-(--color-admin-surface) text-(--color-admin-text) transition hover:bg-(--color-admin-surface-2) disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="flex h-8 w-8 appearance-none items-center justify-center rounded-lg border border-(--color-admin-border) bg-(--color-admin-surface) text-(--color-admin-text) transition hover:bg-(--color-admin-surface-2) disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
