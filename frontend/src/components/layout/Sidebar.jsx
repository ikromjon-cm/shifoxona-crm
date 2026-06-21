import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Pill, Warehouse, Building2, Package,
  FileText, Bell, Shield, Users, X, LogOut,
  TrendingUp, TrendingDown, Settings, Truck,
  ChevronRight, ListTodo, Clock, MessageSquare, QrCode,
  ClipboardList, ShieldCheck, CheckSquare
} from 'lucide-react'

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation()
  const { isSuperAdmin, user, logout } = useAuth()

  const navSections = [
    {
      label: t('nav.main'),
      items: [
        { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
      ],
    },
    {
      label: t('nav.products'),
      items: [
        { to: '/medicines', icon: Pill, label: t('nav.medicines') },
        { to: '/medicines/categories', icon: Package, label: t('nav.categories') },
        { to: '/medicines/suppliers', icon: Building2, label: t('nav.suppliers') },
      ],
    },
    {
      label: t('nav.warehouse'),
      items: [
        { to: '/pharmacies', icon: Building2, label: t('nav.pharmacies') },
        { to: '/inventory', icon: Warehouse, label: t('nav.inventory') },
        { to: '/warehouse/income', icon: TrendingUp, label: t('nav.income') },
        { to: '/warehouse/expense', icon: TrendingDown, label: t('nav.expense') },
        { to: '/warehouse/delivery', icon: Truck, label: t('nav.delivery') },
        { to: '/warehouse/movements', icon: Warehouse, label: t('nav.movements') },
        { to: '/warehouse/bins', icon: QrCode, label: t('nav.bins') },
        { to: '/warehouse/pick-orders', icon: ClipboardList, label: t('nav.pickOrders') },
      ],
    },
    {
      label: t('nav.workflow'),
      items: [
        { to: '/tasks', icon: ListTodo, label: t('nav.tasks') },
        { to: '/attendance', icon: Clock, label: t('nav.attendance') },
        { to: '/chat', icon: MessageSquare, label: t('nav.chat') },
      ],
    },
    {
      label: t('nav.reports'),
      items: [
        { to: '/reports', icon: FileText, label: t('nav.reports') },
      ],
    },
    {
      label: t('nav.notifications'),
      items: [
        { to: '/notifications', icon: Bell, label: t('nav.notifications') },
      ],
    },
    {
      label: t('nav.settings'),
      items: [
        { to: '/settings', icon: Settings, label: t('nav.settings') },
      ],
    },
  ]

  const adminSection = {
    label: t('nav.pharmacyApproval'),
    items: [
      { to: '/pharmacies/approval', icon: CheckSquare, label: t('nav.pharmacyApproval') },
      { to: '/users', icon: Users, label: t('nav.users') },
      { to: '/rbac/roles', icon: ShieldCheck, label: t('nav.roles') },
      { to: '/audit-logs', icon: Shield, label: t('nav.auditLog') },
    ],
  }

  const initials = (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')

  const roleLabel = user?.role === 'superadmin' ? t('role.superadmin')
    : user?.role === 'admin' ? t('role.admin')
    : user?.role === 'operator' ? t('role.operator')
    : user?.role === 'warehouse' ? t('role.warehouse')
    : user?.role === 'driver' ? t('role.driver')
    : user?.role === 'finance' ? t('role.finance')
    : user?.role === 'pharmacy' ? t('role.pharmacy')
    : user?.role || ''

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
                {t('app.title')}
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">{t('app.tagline')}</p>
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
              <p className="text-[11px] text-gray-500 truncate">{roleLabel}</p>
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
                {t('admin.title')}
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
            {t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  )
}
