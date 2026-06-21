import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ordersAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Package, Clock, Truck, CheckCircle, XCircle, ShoppingCart } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const statusBadge = (status, t) => {
  const variants = {
    pending: 'warning', confirmed: 'info', preparing: 'info',
    shipped: 'info', delivered: 'success', received: 'success', cancelled: 'danger',
  }
  const labels = {
    pending: t('pharmacy.pending'), confirmed: t('pharmacy.confirmed'), preparing: t('pharmacy.preparing'),
    shipped: t('pharmacy.shipped'), delivered: t('pharmacy.delivered'), received: t('pharmacy.received'), cancelled: t('pharmacy.cancelled'),
  }
  return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
}

export default function PharmacyDashboardPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const pharmacy = user?.pharmacy

  useEffect(() => {
    if (user?.role === 'pharmacy') fetchOrders()
    else navigate('/pharmacy/login')
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.myOrders()
      setOrders(res.data.results || res.data)
    } catch { /* empty */ } finally { setLoading(false) }
  }

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    received: orders.filter(o => o.status === 'received').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  const columns = [
    { key: 'order_number', label: t('pharmacy.orderNumber') },
    { key: 'created_at', label: t('pharmacy.time'), render: (r) => formatDateTime(r.created_at) },
    { key: 'total_amount', label: t('pharmacy.sum'), render: (r) => Number(r.total_amount).toLocaleString() },
    { key: 'total_items', label: t('pharmacy.products') },
    { key: 'status', label: t('pharmacy.status'), render: (r) => statusBadge(r.status, t) },
    {
      key: 'actions', label: '',
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/pharmacy/orders/${r.id}`)}>
          {t('pharmacy.details')}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pharmacy?.name || t('pharmacy.dashboard')}</h1>
          <p className="text-gray-500 mt-1">{t('pharmacy.welcome')} {t('pharmacy.welcomeMessage')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/pharmacy/catalog')}>
            <ShoppingCart className="h-4 w-4 mr-2" /> {t('pharmacy.newOrder')}
          </Button>
          <Button variant="outline" onClick={logout}>{t('login.logout')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-xs text-gray-500">{t('pharmacy.pending')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Truck className="h-6 w-6 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{stats.shipped}</p>
          <p className="text-xs text-gray-500">{t('pharmacy.inTransit')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold">{stats.delivered}</p>
          <p className="text-xs text-gray-500">{t('pharmacy.delivered')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Package className="h-6 w-6 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{stats.received}</p>
          <p className="text-xs text-gray-500">{t('pharmacy.received')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
          <p className="text-2xl font-bold">{stats.cancelled}</p>
          <p className="text-xs text-gray-500">{t('pharmacy.cancelled')}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('pharmacy.myOrders')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={orders} loading={loading} emptyMessage={t('pharmacy.noOrders')} />
        </CardContent>
      </Card>
    </div>
  )
}
