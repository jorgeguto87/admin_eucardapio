import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function AdminShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <main className="flex-1 min-w-0">
        {/* Barra mobile com botão de menu — some em telas grandes (lg:) */}
        <div className="flex items-center gap-3 h-14 px-4 border-b border-muted-border bg-surface lg:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-xl hover:bg-surface-hover text-ink"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm text-ink">Eu Cardápio — Admin</span>
        </div>

        <Outlet />
      </main>
    </div>
  )
}
