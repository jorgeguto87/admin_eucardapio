import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Store, CreditCard, Megaphone, LogOut, Soup,
  Wallet, Settings, Users, BarChart3, X,
} from 'lucide-react'
import useAdminAuthStore from '../../stores/adminAuthStore'

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Visão geral' },
  { to: '/restaurants',  icon: Store,            label: 'Restaurantes' },
  { to: '/billing',      icon: Wallet,           label: 'Financeiro',      permission: 'manageBilling' },
  { to: '/plans',        icon: CreditCard,       label: 'Config. do plano', permission: 'managePlans' },
  { to: '/reports',      icon: BarChart3,        label: 'Relatórios',      permission: 'viewReports' },
  { to: '/notices',      icon: Megaphone,        label: 'Avisos' },
  { to: '/admins',       icon: Users,            label: 'Administradores', permission: 'manageAdmins' },
  { to: '/settings',     icon: Settings,         label: 'Configurações',   permission: 'managePlans' },
]

export default function Sidebar({ open = false, onClose = () => {} }) {
  const navigate = useNavigate()
  const { user, logout, hasPermission } = useAdminAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission))

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`w-64 bg-secondary text-white flex flex-col h-screen fixed lg:sticky top-0 z-40
          flex-shrink-0 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-2 px-5 h-16 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Soup size={22} className="text-primary" />
            <div>
              <p className="font-bold text-sm leading-none">Eu Cardápio</p>
              <p className="text-[10px] text-white/50 leading-none mt-0.5">Painel ADM</p>
            </div>
          </div>
          <button className="lg:hidden p-1 text-white/60 hover:text-white" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 mb-2">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
