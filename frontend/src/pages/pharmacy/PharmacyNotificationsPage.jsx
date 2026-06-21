import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { notificationsAPI } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PharmacyNotificationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list()
      setNotifications(res.data.results || res.data)
    } catch { /* ignore */
    } finally { setLoading(false) }
  }

  const handleRead = async (id, link) => {
    try {
      await notificationsAPI.markRead(id)
      if (link) navigate(link)
      else fetchNotifications()
    } catch { /* ignore */ }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      fetchNotifications()
      toast.success(t('notification.markAllRead'))
    } catch { /* ignore */ }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacy/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t('notification.title')}</h1>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> {t('notification.markRead')}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('notification.empty')}</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  n.is_read
                    ? 'border-gray-200 dark:border-gray-700'
                    : 'border-medical-200 dark:border-medical-800 bg-medical-50 dark:bg-medical-900/20'
                }`}
                onClick={() => handleRead(n.id, n.link)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-medical-500 mt-1.5 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
