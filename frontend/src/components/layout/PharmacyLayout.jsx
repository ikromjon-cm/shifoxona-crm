import { useState, useEffect } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { notificationsAPI } from '@/services/api'
import { Store, Package, ShoppingCart, LogOut, Menu, X, LayoutDashboard, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/pharmacy/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pharmacy/catalog', icon: Package, label: 'Katalog' },
  { to: '/pharmacy/cart', icon: ShoppingCart, label: 'Savatcha' },
]

export default function PharmacyLayout() {
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
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-medical-500 flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">{user?.pharmacy?.name || 'Dorixona'}</h1>
              <p className="text-xs text-gray-500">Buyurtma tizimi</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-medical-50 dark:bg-medical-900/50 text-medical-700' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button onClick={() => { logout(); navigate('/pharmacy/login') }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut className="h-5 w-5" /> Chiqish
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-gray-900 border-b flex items-center px-4 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button onClick={() => navigate('/pharmacy/notifications')} className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <span className="text-sm text-gray-500">{user?.pharmacy?.name}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
