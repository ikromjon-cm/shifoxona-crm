import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { warehouseAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Play, CheckCircle, Printer, UserCheck, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

const STATUS_COLORS = {
  pending: 'warning',
  assigned: 'info',
  picking: 'info',
  picked: 'success',
  cancelled: 'danger',
}

export default function PickOrdersPage() {
  const { t } = useTranslation()
  const STATUS_LABELS = {
    pending: t('pharmacy.pending'),
    assigned: t('pickOrders.assigned'),
    picking: t('pickOrders.picking'),
    picked: t('pickOrders.picked'),
    cancelled: t('pharmacy.cancelled'),
  }
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDetail, setShowDetail] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    try {
      const res = await warehouseAPI.pickOrders.list()
      setOrders(res.data.results || res.data)
    } catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const handleAssign = async (id) => {
    try {
      await warehouseAPI.pickOrders.assignPicker(id, {})
      toast.success(t('pickOrders.assigned')); fetchOrders()
    } catch { toast.error(t('common.error')) }
  }

  const handleStart = async (id) => {
    try {
      await warehouseAPI.pickOrders.start(id)
      toast.success(t('task.start')); fetchOrders()
    } catch { toast.error(t('common.error')) }
  }

  const handleComplete = async (id) => {
    try {
      await warehouseAPI.pickOrders.complete(id)
      toast.success(t('pickOrders.picked')); fetchOrders()
    } catch { toast.error(t('common.error')) }
  }

  const handlePrintPickList = async (id) => {
    try {
      const res = await warehouseAPI.pickOrders.printPickList(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch { toast.error(t('common.error')) }
  }

  const viewDetail = async (row) => {
    setShowDetail(row)
  }

  const columns = [
    { key: 'order_number', label: t('pharmacy.orderNumber') },
    { key: 'warehouse_name', label: t('warehouse.name') },
    {
      key: 'status', label: t('medicine.status'),
      render: (r) => <Badge variant={STATUS_COLORS[r.status] || 'default'}>{STATUS_LABELS[r.status] || r.status}</Badge>,
    },
    { key: 'picker_name', label: t('pickOrders.picker'), render: (r) => r.picker_name || '-' },
    { key: 'item_count', label: t('pharmacy.products'), render: (r) => r.items?.length || r.item_count || 0 },
    { key: 'created_at', label: t('warehouse.date'), render: (r) => formatDateTime(r.created_at) },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-1">
          {row.status === 'pending' && <Button variant="ghost" size="sm" onClick={() => handleAssign(row.id)} title={t('pickOrders.assign')}><UserCheck className="h-4 w-4" /></Button>}
          {row.status === 'assigned' && <Button variant="ghost" size="sm" onClick={() => handleStart(row.id)} title={t('task.start')}><Play className="h-4 w-4 text-green-500" /></Button>}
          {row.status === 'picking' && <Button variant="ghost" size="sm" onClick={() => handleComplete(row.id)} title={t('task.done')}><CheckCircle className="h-4 w-4 text-emerald-500" /></Button>}
          <Button variant="ghost" size="sm" onClick={() => handlePrintPickList(row.id)} title={t('pickOrders.printPickList')}><Printer className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => viewDetail(row)} title={t('pharmacy.details')}><Eye className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('warehouse.pickOrders')}</h1>
        <p className="text-gray-500 mt-1">{t('warehouse.pickOrdersDesc')}</p>
      </div>

      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={orders} loading={loading} searchable emptyMessage={t('warehouse.noPickOrders')} />
      </CardContent></Card>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={`${t('warehouse.pickOrders')}: ${showDetail?.order_number || ''}`} size="lg">
        {showDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">{t('medicine.status')}:</span> <Badge variant={STATUS_COLORS[showDetail.status]}>{STATUS_LABELS[showDetail.status]}</Badge></div>
              <div><span className="text-gray-500">{t('pickOrders.picker')}:</span> {showDetail.picker_name || t('common.notAssigned')}</div>
              <div><span className="text-gray-500">{t('warehouse.name')}:</span> {showDetail.warehouse_name}</div>
              <div><span className="text-gray-500">{t('audit.createdAt')}:</span> {formatDateTime(showDetail.created_at)}</div>
              {showDetail.completed_at && <div><span className="text-gray-500">{t('pickOrders.completedAt')}:</span> {formatDateTime(showDetail.completed_at)}</div>}
            </div>
            {showDetail.items?.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">{t('pharmacy.products')} ({showDetail.items.length})</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th className="px-3 py-2 text-left">{t('warehouse.medicine')}</th>
                      <th className="px-3 py-2 text-left">{t('warehouse.bin')}</th>
                      <th className="px-3 py-2 text-right">{t('warehouse.quantity')}</th>
                      <th className="px-3 py-2 text-right">{t('medicine.batchSeries')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {showDetail.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.medicine_name}</td>
                        <td className="px-3 py-2">{item.bin_code || '-'}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{item.batch_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
