import { useState, useEffect } from 'react'
import { auditLogsAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'

const actionVariants = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  LOGIN: 'medical',
  LOGOUT: 'warning',
  EXPORT: 'violet',
  BLOCK: 'danger',
  UNBLOCK: 'success',
}

export default function AuditLogsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auditLogsAPI.list()
      .then(res => setData(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'user_name', label: 'Foydalanuvchi' },
    {
      key: 'action', label: 'Harakat',
      render: (r) => <Badge variant={actionVariants[r.action] || 'default'}>{r.action}</Badge>,
    },
    { key: 'description', label: 'Tavsif' },
    { key: 'model_name', label: 'Model' },
    { key: 'ip_address', label: 'IP manzil' },
    { key: 'created_at', label: 'Vaqt', render: (r) => formatDateTime(r.created_at) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="text-gray-500 mt-1">Tizimdagi barcha harakatlar kuzatuvi</p>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>
    </div>
  )
}
