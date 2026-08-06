import { useMemo, useState } from 'react';
import { Inbox, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SkeletonRows } from './LoadingSkeleton';
import EmptyState from './EmptyState';

// Generic admin table: columns = [{ key, label, render?(row), width?, sortable? }],
// rows = plain objects, getRowKey(row) => unique key. Reused by the
// Activity Log, Audit Trail, Users, and every content-management page so
// there's one sortable/paginated table implementation instead of five.
// Sorting is client-side over whatever `rows` currently holds (i.e. the
// current page, for server-paginated tables) — a lightweight polish layer,
// not a replacement for server-side sort.
export default function DataTable({ columns, rows, getRowKey, loading, emptyTitle = 'Nothing here yet', emptyDescription, onRowClick }) {
  const [sort, setSort] = useState(null); // { key, dir: 'asc' | 'desc' }

  const sortedRows = useMemo(() => {
    if (!sort || !rows) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const getValue = (row) => (col?.sortValue ? col.sortValue(row) : row[sort.key]);
    return [...rows].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  if (loading) return <SkeletonRows rows={6} cols={columns.length} />;

  if (!rows || rows.length === 0) {
    return <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-(--color-admin-border) bg-(--color-admin-surface) shadow-soft">
      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-(--color-admin-surface-2)">
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={`sticky top-0 z-10 border-b border-(--color-admin-border) bg-(--color-admin-surface-2) px-4 py-3 text-[11px] font-semibold tracking-wide text-(--color-admin-text-muted) uppercase ${col.sortable ? 'cursor-pointer select-none hover:text-(--color-admin-text)' : ''}`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        isSorted ? (
                          sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                        ) : (
                          <ChevronsUpDown size={11} className="opacity-40" />
                        )
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-(--color-admin-border) last:border-0 transition-colors hover:bg-(--color-admin-accent-soft)/40 ${onRowClick ? 'cursor-pointer' : ''} ${i % 2 === 1 ? 'bg-(--color-admin-surface-2)/50' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle text-(--color-admin-text)">
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
