import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Pill, Warehouse, Building2, Package,
  FileText, Bell, Shield, Users, Menu, X, LogOut,
  TrendingUp, TrendingDown, Settings, Truck, CheckSquare
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

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-medical-500 flex items-center justify-center">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">Shifoxona CRM</h1>
              <p className="text-xs text-gray-500">Farmatsevtika tizimi</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-medical-100 dark:bg-medical-900 flex items-center justify-center">
              <span className="text-sm font-bold text-medical-600 dark:text-medical-300">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role === 'superadmin' ? 'Super Admin' : 'Operator'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-medical-50 dark:bg-medical-900/50 text-medical-700 dark:text-medical-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {isSuperAdmin && (
            <div>
              <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-medical-50 dark:bg-medical-900/50 text-medical-700 dark:text-medical-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Chiqish
          </button>
        </div>
      </aside>
    </>
  )
}
