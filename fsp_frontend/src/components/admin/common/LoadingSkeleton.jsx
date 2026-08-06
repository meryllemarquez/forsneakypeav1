export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-(--color-admin-border)/60 ${className}`} />;
}

export function SkeletonRows({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 rounded-xl border border-(--color-admin-border) bg-(--color-admin-surface) px-4 py-3">
          {Array.from({ length: cols }).map((__, c) => (
            <SkeletonBlock key={c} className={`h-3.5 ${c === 0 ? 'w-1/4' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-(--color-admin-border) bg-(--color-admin-surface) p-5">
          <SkeletonBlock className="h-8 w-8 rounded-full" />
          <SkeletonBlock className="h-6 w-2/3" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
