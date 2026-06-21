import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { inventoryAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, Clock } from 'lucide-react'

export default function InventoryPage() {
  const { t } = useTranslation()
  const [inventory, setInventory] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [expiring, setExpiring] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      inventoryAPI.list(),
      inventoryAPI.lowStock(),
      inventoryAPI.expiringSoon(),
    ]).then(([invRes, lowRes, expRes]) => {
      setInventory(invRes.data.results || invRes.data)
      setLowStock(lowRes.data)
      setExpiring(expRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const inventoryColumns = [
    { key: 'medicine_name', label: t('inventory.list') },
    { key: 'barcode', label: t('medicine.barcode') },
    { key: 'quantity', label: t('inventory.stock'), render: (r) => <span className={r.is_low ? 'text-red-500 font-bold' : ''}>{r.quantity}</span> },
    { key: 'min_quantity', label: t('inventory.minQty') },
    { key: 'max_quantity', label: t('inventory.maxQty') },
    { key: 'location', label: t('inventory.location') },
    { key: 'is_low', label: t('medicine.status'), render: (r) => r.is_low ? <Badge variant="danger">{t('medicine.statusLow')}</Badge> : <Badge variant="success">{t('medicine.statusNormal')}</Badge> },
  ]

  const lowStockColumns = [
    { key: 'medicine_name', label: t('inventory.list') },
    { key: 'barcode', label: t('medicine.barcode') },
    { key: 'quantity', label: t('inventory.available') },
    { key: 'min_quantity', label: t('inventory.minQty') },
  ]

  const expiringColumns = [
    { key: 'medicine_name', label: t('inventory.list') },
    { key: 'barcode', label: t('medicine.barcode') },
    { key: 'batch_series', label: t('medicine.batchSeries') },
    { key: 'batch_quantity', label: t('medicine.quantity') },
    { key: 'expiry_date', label: t('medicine.expiryDate') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
        <p className="text-gray-500 mt-1">{t('inventory.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> {t('inventory.lowStock')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={lowStockColumns} data={lowStock} loading={loading} />
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" /> {t('inventory.expiringSoon')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={expiringColumns} data={expiring} loading={loading} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('inventory.title')}</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={inventoryColumns} data={inventory} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
