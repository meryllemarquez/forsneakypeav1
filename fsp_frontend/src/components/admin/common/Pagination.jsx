import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from '../../ui/IconButton/IconButton';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-3">
      <p className="m-0 text-sm text-(--color-admin-text-muted)" aria-live="polite">
        Page {page + 1} of {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <IconButton label="Previous page" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}>
          <ChevronLeft size={20} strokeWidth={2.6} aria-hidden="true" />
        </IconButton>
        <IconButton label="Next page" onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>
          <ChevronRight size={20} strokeWidth={2.6} aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}
