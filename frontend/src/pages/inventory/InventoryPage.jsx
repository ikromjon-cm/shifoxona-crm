import { useState, useEffect } from 'react'
import { inventoryAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, Clock } from 'lucide-react'

export default function InventoryPage() {
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
    { key: 'medicine_name', label: 'Mahsulot' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'quantity', label: 'Miqdor', render: (r) => <span className={r.is_low ? 'text-red-500 font-bold' : ''}>{r.quantity}</span> },
    { key: 'min_quantity', label: 'Minimal' },
    { key: 'max_quantity', label: 'Maksimal' },
    { key: 'location', label: 'Joylashuv' },
    { key: 'is_low', label: 'Holat', render: (r) => r.is_low ? <Badge variant="danger">Kam</Badge> : <Badge variant="success">Normal</Badge> },
  ]

  const lowStockColumns = [
    { key: 'medicine_name', label: 'Mahsulot' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'quantity', label: 'Mavjud' },
    { key: 'min_quantity', label: 'Minimal' },
  ]

  const expiringColumns = [
    { key: 'medicine_name', label: 'Mahsulot' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'batch_series', label: 'Seriya' },
    { key: 'batch_quantity', label: 'Miqdor' },
    { key: 'expiry_date', label: 'Muddati' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventar</h1>
        <p className="text-gray-500 mt-1">Ombordagi mahsulotlar holati</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Kam qoldiq
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={lowStockColumns} data={lowStock} loading={loading} />
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" /> Muddati yaqin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={expiringColumns} data={expiring} loading={loading} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Barcha inventar</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={inventoryColumns} data={inventory} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
