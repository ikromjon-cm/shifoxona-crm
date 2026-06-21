import { useState, useEffect } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { notificationsAPI } from '@/services/api'
import { useTranslation } from 'react-i18next'
import { Store, Package, ShoppingCart, LogOut, Menu, X, LayoutDashboard, Bell, ClipboardList, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/pharmacy/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/pharmacy/catalog', icon: Package, labelKey: 'pharmacy.catalog' },
  { to: '/pharmacy/cart', icon: ShoppingCart, labelKey: 'pharmacy.cart' },
  { to: '/pharmacy/orders', icon: ClipboardList, labelKey: 'pharmacy.myOrders' },
  { to: '/pharmacy/profile', icon: User, labelKey: 'pharmacy.profile' },
]

export default function PharmacyLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationsAPI.unreadCount()
        setUnreadCount(res.data.count || 0)
      } catch { /* ignore */ }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 glass-sidebar flex flex-col',
        'transform transition-all duration-300 lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100/50 dark:border-gray-700/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-medical-500 to-brand-500 flex items-center justify-center shadow-lg shadow-medical-500/20">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-medical-600 to-brand-600 dark:from-medical-400 dark:to-brand-400 bg-clip-text text-transparent">
                {user?.pharmacy?.name || t('pharmacy.name')}
              </h1>
              <p className="text-[10px] text-gray-400 font-medium">{t('pharmacy.orderSystem')}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin mt-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'nav-link-active'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    'h-4.5 w-4.5 flex-shrink-0 transition-all',
                    isActive ? 'text-medical-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  )} />
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {isActive && <ChevronRight className="h-3 w-3 text-medical-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100/50 dark:border-gray-700/30">
          <button
            onClick={() => { logout(); navigate('/pharmacy/login') }}
            className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="h-4.5 w-4.5" /> {t('login.logout')}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass-header flex items-center px-4 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button onClick={() => navigate('/pharmacy/notifications')} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white text-[10px] flex items-center justify-center font-bold shadow-lg shadow-red-500/30">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <span className="text-sm font-medium text-gray-500">{user?.pharmacy?.name}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
