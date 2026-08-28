export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse bg-surface-hover rounded-lg ${className}`} />
}

export function SkeletonTable({ rows = 6, cols = 4 }) {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3 border-t border-muted-border first:border-t-0">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3">
          <SkeletonLine className="h-4 w-8" />
          <SkeletonLine className="h-6 w-16" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}
