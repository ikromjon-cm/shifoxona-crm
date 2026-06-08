import { useState, useEffect } from 'react'
import { warehouseAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default function MovementsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    warehouseAPI.movements.list()
      .then(res => setData(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const typeVariant = { income: 'success', expense: 'danger', adjustment: 'warning' }
  const typeLabel = { income: 'Kirim', expense: 'Chiqim', adjustment: 'Tuzatish' }

  const columns = [
    { key: 'medicine_name', label: 'Mahsulot' },
    { key: 'movement_type', label: 'Tur', render: (r) => <Badge variant={typeVariant[r.movement_type]}>{typeLabel[r.movement_type]}</Badge> },
    { key: 'quantity', label: 'Miqdor' },
    { key: 'quantity_before', label: 'Oldingi' },
    { key: 'quantity_after', label: 'Keyingi' },
    { key: 'created_by_name', label: 'Kim bajargan' },
    { key: 'created_at', label: 'Vaqt', render: (r) => new Date(r.created_at).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventar harakatlari</h1>
        <p className="text-gray-500 mt-1">Barcha kirim va chiqim harakatlari</p>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>
    </div>
  )
}
