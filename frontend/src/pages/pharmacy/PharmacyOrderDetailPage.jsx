import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { ArrowLeft, MapPin } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const statusFlow = [
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'confirmed', label: 'Tasdiqlandi' },
  { key: 'preparing', label: 'Tayyorlanmoqda' },
  { key: 'shipped', label: "Yo'lga chiqdi" },
  { key: 'delivered', label: 'Yetkazildi' },
  { key: 'received', label: 'Qabul qilindi' },
]

export default function PharmacyOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [receiveNote, setReceiveNote] = useState('')

  useEffect(() => { fetchOrder() }, [id])

  const fetchOrder = async () => {
    try {
      const res = await ordersAPI.get(id)
      setOrder(res.data)
    } catch (err) {
      toast.error('Buyurtmani yuklashda xatolik')
    } finally { setLoading(false) }
  }

  const handleReceive = async () => {
    try {
      await ordersAPI.receive(id, {
        received_by: 'Dorixona',
        receive_note: receiveNote,
      })
      toast.success('Buyurtma qabul qilindi')
      fetchOrder()
    } catch (err) {
      toast.error('Xatolik yuz berdi')
    }
  }

  const currentIdx = statusFlow.findIndex(s => s.key === order?.status)
  const canReceive = order?.status === 'delivered'

  const columns = [
    { key: 'medicine_name', label: 'Mahsulot' },
    { key: 'medicine_barcode', label: 'Barcode' },
    { key: 'quantity', label: 'Miqdor' },
    { key: 'price', label: 'Narxi', render: (r) => Number(r.price).toLocaleString() },
    { key: 'total', label: 'Jami', render: (r) => (r.quantity * r.price).toLocaleString() },
  ]

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500" /></div>
  if (!order) return <div className="text-center py-12 text-gray-500">Buyurtma topilmadi</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacy/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Buyurtma {order.order_number}</h1>
            <p className="text-gray-500 mt-1">{formatDateTime(order.created_at)}</p>
          </div>
        </div>
        <Badge variant={
          order.status === 'received' ? 'success' :
          order.status === 'cancelled' ? 'danger' : 'warning'
        }>
          {order.status_display}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {statusFlow.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${i <= currentIdx ? 'bg-medical-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {i + 1}
                </div>
                <div className={`h-0.5 flex-1 ${i < currentIdx ? 'bg-medical-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-1">
            {statusFlow.map(s => (
              <span key={s.key} className={`text-xs ${statusFlow.findIndex(x => x.key === order.status) >= statusFlow.findIndex(x => x.key === s.key) ? 'text-medical-600 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Buyurtma tarkibi</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={order.items?.map(i => ({ ...i, total: i.quantity * i.price })) || []} />
          <div className="flex justify-end mt-4 text-lg font-bold">
            Jami: {Number(order.total_amount).toLocaleString()} so'm
          </div>
        </CardContent>
      </Card>

      {canReceive && (
        <Card>
          <CardHeader><CardTitle>Mahsulotni qabul qilish</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Izoh (ixtiyoriy)</label>
              <textarea
                className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                value={receiveNote} onChange={(e) => setReceiveNote(e.target.value)}
                placeholder="Kamomad yoki muammo bo'lsa yozing..."
              />
            </div>
            <Button onClick={handleReceive}>
              <MapPin className="h-4 w-4 mr-2" /> Qabul qildim
            </Button>
          </CardContent>
        </Card>
      )}

      {order.received_at && (
        <Card>
          <CardHeader><CardTitle>Qabul qilish ma'lumotlari</CardTitle></CardHeader>
          <CardContent>
            <p>Qabul qilingan vaqt: {formatDateTime(order.received_at)}</p>
            <p>Qabul qilgan: {order.received_by}</p>
            {order.receive_note && <p>Izoh: {order.receive_note}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
