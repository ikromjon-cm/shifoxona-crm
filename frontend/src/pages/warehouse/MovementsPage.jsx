import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { warehouseAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default function MovementsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    warehouseAPI.movements.list()
      .then(res => setData(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const typeVariant = { income: 'success', expense: 'danger', adjustment: 'warning' }
  const typeLabel = { income: t('dashboard.income'), expense: t('dashboard.expense'), adjustment: t('warehouse.adjustment') }

  const columns = [
    { key: 'medicine_name', label: t('warehouse.medicine') },
    { key: 'movement_type', label: t('task.type'), render: (r) => <Badge variant={typeVariant[r.movement_type]}>{typeLabel[r.movement_type]}</Badge> },
    { key: 'quantity', label: t('warehouse.quantity') },
    { key: 'quantity_before', label: t('warehouse.before') },
    { key: 'quantity_after', label: t('warehouse.after') },
    { key: 'created_by_name', label: t('warehouse.performedBy') },
    { key: 'created_at', label: t('pharmacy.time'), render: (r) => new Date(r.created_at).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('warehouse.movements')}</h1>
        <p className="text-gray-500 mt-1">{t('warehouse.movementsDesc')}</p>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>
    </div>
  )
}
