export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-8 py-4 sm:h-16 sm:py-0 border-b border-gray-100 bg-surface sticky top-0 z-10">
      <div className="min-w-0">
        <h1 className="font-semibold text-secondary truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
