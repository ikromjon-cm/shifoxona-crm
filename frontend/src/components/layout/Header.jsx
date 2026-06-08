import { Menu, Bell, Moon, Sun, CheckCheck } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { notificationsAPI } from '@/services/api'
import { formatDateTime } from '@/lib/utils'

export default function Header({ onMenuClick }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationsAPI.unreadCount()
        setUnreadCount(res.data.count)
      } catch {}
    }
    const fetchRecent = async () => {
      try {
        const res = await notificationsAPI.list({ page: 1 })
        setNotifications(res.data.results || res.data)
      } catch {}
    }
    fetchUnread()
    fetchRecent()
    const interval = setInterval(() => { fetchUnread(); fetchRecent() }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      const res = await notificationsAPI.unreadCount()
      setUnreadCount(res.data.count)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 h-16">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          Tizim ishlamoqda
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold">Bildirishnomalar</span>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-medical-500 hover:underline"
                      >
                        Hammasini o'qish
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Bildirishnomalar mavjud emas
                    </div>
                  ) : (
                    recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 p-3 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                          !n.is_read ? 'bg-medical-50/50 dark:bg-medical-900/10' : ''
                        }`}
                        onClick={() => { handleMarkRead(n.id); navigate('/notifications'); setShowDropdown(false) }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id) }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <CheckCheck className="h-3.5 w-3.5 text-medical-500" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div
                  className="p-2 text-center border-t border-gray-200 dark:border-gray-700"
                  onClick={() => { navigate('/notifications'); setShowDropdown(false) }}
                >
                  <span className="text-sm text-medical-500 hover:underline cursor-pointer">Barcha bildirishnomalar</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
