import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Package, Clock, Truck, CheckCircle, XCircle, ShoppingCart } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const statusBadge = (status) => {
  const variants = {
    pending: 'warning', confirmed: 'info', preparing: 'info',
    shipped: 'info', delivered: 'success', received: 'success', cancelled: 'danger',
  }
  const labels = {
    pending: 'Kutilmoqda', confirmed: 'Tasdiqlandi', preparing: 'Tayyorlanmoqda',
    shipped: "Yo'lga chiqdi", delivered: 'Yetkazildi', received: 'Qabul qilindi', cancelled: 'Bekor qilindi',
  }
  return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
}

export default function PharmacyDashboardPage() {
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
    } catch (err) {
      console.error('Failed to load orders')
    } finally { setLoading(false) }
  }

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    received: orders.filter(o => o.status === 'received').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  const columns = [
    { key: 'order_number', label: 'Buyurtma raqami' },
    { key: 'created_at', label: 'Vaqt', render: (r) => formatDateTime(r.created_at) },
    { key: 'total_amount', label: 'Summa', render: (r) => Number(r.total_amount).toLocaleString() },
    { key: 'total_items', label: 'Mahsulotlar soni' },
    { key: 'status', label: 'Holati', render: (r) => statusBadge(r.status) },
    {
      key: 'actions', label: '',
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/pharmacy/orders/${r.id}`)}>
          Batafsil
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pharmacy?.name || 'Dorixona paneli'}</h1>
          <p className="text-gray-500 mt-1">Xush kelibsiz! Buyurtmalaringizni boshqaring</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/pharmacy/catalog')}>
            <ShoppingCart className="h-4 w-4 mr-2" /> Yangi buyurtma
          </Button>
          <Button variant="outline" onClick={logout}>Chiqish</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-xs text-gray-500">Kutilmoqda</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Truck className="h-6 w-6 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{stats.shipped}</p>
          <p className="text-xs text-gray-500">Yo'lda</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold">{stats.delivered}</p>
          <p className="text-xs text-gray-500">Yetkazildi</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Package className="h-6 w-6 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{stats.received}</p>
          <p className="text-xs text-gray-500">Qabul qilingan</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
          <p className="text-2xl font-bold">{stats.cancelled}</p>
          <p className="text-xs text-gray-500">Bekor qilingan</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mening buyurtmalarim</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={orders} loading={loading} emptyMessage="Buyurtmalar mavjud emas" />
        </CardContent>
      </Card>
    </div>
  )
}
