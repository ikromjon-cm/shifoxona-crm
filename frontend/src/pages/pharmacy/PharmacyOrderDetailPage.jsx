import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { ArrowLeft, MapPin } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const statusFlow = (t) => [
  { key: 'pending', label: t('pharmacy.pending') },
  { key: 'confirmed', label: t('pharmacy.confirmed') },
  { key: 'preparing', label: t('pharmacy.preparing') },
  { key: 'shipped', label: t('pharmacy.inTransit') },
  { key: 'delivered', label: t('pharmacy.delivered') },
  { key: 'received', label: t('pharmacy.received') },
]

export default function PharmacyOrderDetailPage() {
  const { t } = useTranslation()
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
      toast.error(t('pharmacy.errorLoadOrder'))
    } finally { setLoading(false) }
  }

  const handleReceive = async () => {
    try {
      await ordersAPI.receive(id, {
        received_by: t('pharmacy.plate'),
        receive_note: receiveNote,
      })
      toast.success(t('pharmacy.orderReceived'))
      fetchOrder()
    } catch (err) {
      toast.error(t('common.error'))
    }
  }

  const currentIdx = statusFlow(t).findIndex(s => s.key === order?.status)
  const canReceive = order?.status === 'delivered'

  const columns = [
    { key: 'medicine_name', label: 'Mahsulot' },
    { key: 'medicine_barcode', label: t('medicine.barcode') },
    { key: 'quantity', label: t('medicine.quantity') },
    { key: 'price', label: t('medicine.price'), render: (r) => Number(r.price).toLocaleString() },
    { key: 'total', label: t('pharmacy.total'), render: (r) => (r.quantity * r.price).toLocaleString() },
  ]

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500" /></div>
  if (!order) return <div className="text-center py-12 text-gray-500">{t('pharmacy.orderNotFound')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacy/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('pharmacy.order')} {order.order_number}</h1>
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
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between overflow-x-auto py-2">
            {statusFlow(t).map((s, i) => (
              <div key={s.key} className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
                <div className={`h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center text-[10px] md:text-sm font-medium flex-shrink-0
                  ${i <= currentIdx ? 'bg-medical-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {i + 1}
                </div>
                <div className={`h-0.5 flex-1 ${i < currentIdx ? 'bg-medical-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </div>
            ))}
          </div>
          <div className="hidden md:flex justify-between mt-2 px-1">
            {statusFlow(t).map(s => (
              <span key={s.key} className={`text-xs ${statusFlow.findIndex(x => x.key === order.status) >= statusFlow.findIndex(x => x.key === s.key) ? 'text-medical-600 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
            ))}
          </div>
          <div className="flex md:hidden justify-center mt-2">
            <span className="text-xs font-medium text-medical-600">
              {statusFlow(t).find(s => s.key === order.status)?.label || order.status}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('pharmacy.orderItems')}</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={order.items?.map(i => ({ ...i, total: i.quantity * i.price })) || []} />
          <div className="flex justify-end mt-4 text-lg font-bold">
            {t('pharmacy.total')}: {Number(order.total_amount).toLocaleString()} so&apos;m
          </div>
        </CardContent>
      </Card>

      {canReceive && (
        <Card>
          <CardHeader><CardTitle>{t('pharmacy.receiveOrder')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('pharmacy.comment')} ({t('common.optional')})</label>
              <textarea
                className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                value={receiveNote} onChange={(e) => setReceiveNote(e.target.value)}
                placeholder={t('pharmacy.receiveNotePlaceholder')}
              />
            </div>
            <Button onClick={handleReceive}>
              <MapPin className="h-4 w-4 mr-2" /> {t('pharmacy.receive')}
            </Button>
          </CardContent>
        </Card>
      )}

      {order.received_at && (
        <Card>
          <CardHeader><CardTitle>{t('pharmacy.receiveInfo')}</CardTitle></CardHeader>
          <CardContent>
            <p>{t('pharmacy.receivedAt')}: {formatDateTime(order.received_at)}</p>
            <p>{t('pharmacy.receivedBy')}: {order.received_by}</p>
            {order.receive_note && <p>{t('pharmacy.comment')}: {order.receive_note}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
