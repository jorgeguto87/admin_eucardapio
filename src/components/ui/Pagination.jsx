import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
      <p className="text-gray-400 text-xs">
        Página {page} de {pages} {typeof total === 'number' && `· ${total} registros`}
      </p>
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
