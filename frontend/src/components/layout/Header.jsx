import { Menu, Bell, Moon, Sun, CheckCheck, ChevronRight } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState, useRef, useCallback } from 'react'
import { notificationsAPI } from '@/services/api'
import { formatDateTime, cn } from '@/lib/utils'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function Header({ onMenuClick }) {
  const { t } = useTranslation()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const fetchData = useCallback(async () => {
    try {
      const [unreadRes, notifRes] = await Promise.all([
        notificationsAPI.unreadCount(),
        notificationsAPI.list({ page: 1 }),
      ])
      setUnreadCount(unreadRes.data.count)
      setNotifications(notifRes.data.results || notifRes.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

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
    <header className="sticky top-0 z-30 glass-header">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm text-gray-500 font-medium">{t('header.running')}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
            title={darkMode ? t('theme.light') : t('theme.dark')}
          >
            <div className="relative">
              <Sun className={cn(
                "h-4.5 w-4.5 transition-all duration-300",
                darkMode ? "opacity-100 rotate-0" : "opacity-0 rotate-90 absolute inset-0"
              )} />
              <Moon className={cn(
                "h-4.5 w-4.5 transition-all duration-300",
                darkMode ? "opacity-0 -rotate-90 absolute inset-0" : "opacity-100 rotate-0"
              )} />
            </div>
          </button>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-rose-500 text-white text-[10px] flex items-center justify-center font-bold shadow-lg shadow-red-500/30">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 glass rounded-2xl shadow-2xl border border-gray-100/50 dark:border-gray-700/30 overflow-hidden animate-scale-in origin-top-right">
                <div className="flex items-center justify-between p-4 border-b border-gray-100/50 dark:border-gray-700/30">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('notification.title')}</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-medical-500 hover:text-medical-600 transition-colors"
                    >
                      {t('header.markAllRead')}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin">
                  {recentNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-500">{t('header.noNotifications')}</p>
                    </div>
                  ) : (
                    recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-3 p-4 border-b border-gray-50 dark:border-gray-800 cursor-pointer group transition-all',
                          !n.is_read
                            ? 'bg-gradient-to-r from-medical-50/50 to-transparent dark:from-medical-900/10'
                            : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                        )}
                        onClick={() => { handleMarkRead(n.id); navigate('/notifications'); setShowDropdown(false) }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-medical-500 flex-shrink-0" />}
                            <p className={cn('text-sm truncate', !n.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
                              {n.title}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 ml-3.5">{n.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1 ml-3.5">{formatDateTime(n.created_at)}</p>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id) }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                          >
                            <CheckCheck className="h-3.5 w-3.5 text-medical-500" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div
                  className="p-3 text-center border-t border-gray-100/50 dark:border-gray-700/30 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => { navigate('/notifications'); setShowDropdown(false) }}
                >
                  <span className="text-sm font-medium text-medical-500 hover:text-medical-600 inline-flex items-center gap-1">
                    {t('header.allNotifications')} <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
