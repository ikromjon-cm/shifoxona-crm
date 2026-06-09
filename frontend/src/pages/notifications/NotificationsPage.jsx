import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Bell, CheckCheck, AlertTriangle, TrendingUp, TrendingDown, Info, Package } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const icons = {
  low_stock: AlertTriangle,
  expiry: AlertTriangle,
  income: TrendingUp,
  expense: TrendingDown,
  system: Info,
  medicine: Package,
}

const bgColors = {
  low_stock: 'bg-rose-100 dark:bg-rose-900/30',
  expiry: 'bg-amber-100 dark:bg-amber-900/30',
  income: 'bg-emerald-100 dark:bg-emerald-900/30',
  expense: 'bg-blue-100 dark:bg-blue-900/30',
  system: 'bg-violet-100 dark:bg-violet-900/30',
  medicine: 'bg-medical-100 dark:bg-medical-900/30',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list()
      setNotifications(res.data.results || res.data)
    } catch (err) {
      toast.error('Bildirishnomalarni yuklashda xatolik')
    } finally { setLoading(false) }
  }

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      fetchNotifications()
    } catch (err) {
      toast.error('Xatolik yuz berdi')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      fetchNotifications()
      toast.success('Barchasi o\'qildi')
    } catch (err) {
      toast.error('Xatolik yuz berdi')
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bildirishnomalar</h1>
          <p className="text-gray-500 mt-1">Tizim bildirishnomalari</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" /> Barchasini o'qilgan deb belgilash
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Bildirishnomalar mavjud emas</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = icons[n.type] || Bell
              return (
                  <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                    n.is_read
                      ? 'border-gray-200 dark:border-gray-700'
                      : 'border-medical-200 dark:border-medical-800 bg-medical-50 dark:bg-medical-900/20'
                  }`}
                  onClick={() => { if (n.link) navigate(n.link); if (!n.is_read) handleMarkRead(n.id) }}
                >
                  <div className={`p-2 rounded-full ${bgColors[n.type] || 'bg-gray-100 dark:bg-gray-900'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{n.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                      </div>
                      {!n.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{formatDateTime(n.created_at)}</p>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
