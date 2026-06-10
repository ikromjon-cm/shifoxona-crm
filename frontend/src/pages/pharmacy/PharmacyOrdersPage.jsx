import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersAPI } from '@/services/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { ClipboardList, Clock, Truck, CheckCircle, XCircle, Package } from 'lucide-react'
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

const statuses = [
  { key: 'all', label: 'Barchasi', icon: ClipboardList },
  { key: 'pending', label: 'Kutilmoqda', icon: Clock },
  { key: 'shipped', label: "Yo'lda", icon: Truck },
  { key: 'delivered', label: 'Yetkazildi', icon: Package },
  { key: 'received', label: 'Qabul qilingan', icon: CheckCircle },
  { key: 'cancelled', label: 'Bekor qilingan', icon: XCircle },
]

export default function PharmacyOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.myOrders()
      setOrders(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to load orders')
    } finally { setLoading(false) }
  }

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab)

  const columns = [
    { key: 'order_number', label: 'Buyurtma raqami' },
    {
      key: 'created_at', label: 'Vaqt',
      render: (r) => formatDateTime(r.created_at),
    },
    {
      key: 'total_amount', label: 'Summa',
      render: (r) => Number(r.total_amount).toLocaleString() + ' so\'m',
    },
    { key: 'total_items', label: 'Mahsulotlar' },
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
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-medical-500" />
        <h1 className="text-2xl font-bold">Buyurtmalarim</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {statuses.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveTab(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === s.key
                ? 'bg-medical-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
            {s.key !== 'all' && (
              <span className="ml-1 text-xs opacity-70">
                ({orders.filter(o => o.status === s.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMessage={activeTab === 'all' ? 'Buyurtmalar mavjud emas' : 'Bu holatda buyurtmalar mavjud emas'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
