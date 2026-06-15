import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Pill, Warehouse, Building2, Package,
  FileText, Bell, Shield, Users, Menu, X, LogOut,
  TrendingUp, TrendingDown, Settings, Truck, CheckSquare,
  ChevronRight
} from 'lucide-react'

const navSections = [
  {
    label: 'Asosiy',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Mahsulotlar',
    items: [
      { to: '/medicines', icon: Pill, label: 'Mahsulotlar' },
      { to: '/medicines/categories', icon: Package, label: 'Kategoriyalar' },
      { to: '/medicines/suppliers', icon: Building2, label: "Yetkazib beruvchilar" },
    ],
  },
  {
    label: 'Ombor',
    items: [
      { to: '/pharmacies', icon: Building2, label: 'Dorixonalar' },
      { to: '/inventory', icon: Warehouse, label: 'Inventar' },
      { to: '/warehouse/income', icon: TrendingUp, label: 'Kirim' },
      { to: '/warehouse/expense', icon: TrendingDown, label: 'Tarqatish' },
      { to: '/warehouse/delivery', icon: Truck, label: 'Yetkazib berish' },
      { to: '/warehouse/movements', icon: Warehouse, label: 'Harakatlar' },
    ],
  },
  {
    label: 'Hisobot',
    items: [
      { to: '/reports', icon: FileText, label: 'Hisobotlar' },
    ],
  },
  {
    label: 'Bildirishnomalar',
    items: [
      { to: '/notifications', icon: Bell, label: 'Bildirishnomalar' },
    ],
  },
  {
    label: 'Sozlamalar',
    items: [
      { to: '/settings', icon: Settings, label: 'Sozlamalar' },
    ],
  },
]

const adminSection = {
  label: 'Admin',
  items: [
    { to: '/pharmacies/approval', icon: CheckSquare, label: 'Dorixona tasdiqlash' },
    { to: '/users', icon: Users, label: 'Foydalanuvchilar' },
    { to: '/audit-logs', icon: Shield, label: 'Audit log' },
  ],
}

export default function Sidebar({ isOpen, onClose }) {
  const { isSuperAdmin, user, logout } = useAuth()

  const initials = (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 glass-sidebar flex flex-col',
          'transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100/50 dark:border-gray-700/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-medical-500 to-brand-500 flex items-center justify-center shadow-lg shadow-medical-500/20">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-medical-600 to-brand-600 dark:from-medical-400 dark:to-brand-400 bg-clip-text text-transparent">
                Shifoxona CRM
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">Farmatsevtika tizimi</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-r from-medical-50 to-brand-50 dark:from-medical-900/20 dark:to-brand-900/20 border border-medical-100/50 dark:border-medical-700/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-medical-500 to-brand-500 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">{initials || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[11px] text-gray-500 truncate">
                {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'operator' ? 'Operator' : user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-thin mt-3">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'nav-link-active'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn(
                          'h-4.5 w-4.5 flex-shrink-0 transition-all duration-200',
                          isActive ? 'text-medical-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                        )} />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="h-3 w-3 text-medical-500" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {isSuperAdmin && (
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">
                {adminSection.label}
              </p>
              <div className="space-y-0.5">
                {adminSection.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'nav-link-active'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn(
                          'h-4.5 w-4.5 flex-shrink-0 transition-all duration-200',
                          isActive ? 'text-medical-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                        )} />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="h-3 w-3 text-medical-500" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100/50 dark:border-gray-700/30">
          <button
            onClick={() => logout()}
            className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <LogOut className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-0.5" />
            Chiqish
          </button>
        </div>
      </aside>
    </>
  )
}
