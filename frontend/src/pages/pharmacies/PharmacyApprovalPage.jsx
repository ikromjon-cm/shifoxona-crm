import { useState, useEffect } from 'react'
import { pharmaciesAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const statusBadge = (pharmacy) => {
  if (!pharmacy.is_approved) return <Badge variant="warning">Kutilmoqda</Badge>
  return <Badge variant="success">Tasdiqlangan</Badge>
}

export default function PharmacyApprovalPage() {
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState(null)

  useEffect(() => { fetchPharmacies() }, [])

  const fetchPharmacies = async () => {
    try {
      const res = await pharmaciesAPI.list()
      setPharmacies(res.data.results || res.data)
    } catch (err) {
      toast.error('Dorixonalarni yuklashda xatolik')
    } finally { setLoading(false) }
  }

  const handleApprove = async (id, approve) => {
    setProcessing(id)
    try {
      await pharmaciesAPI.approve(id, { approve })
      toast.success(approve ? 'Dorixona tasdiqlandi' : 'Dorixona rad etildi')
      fetchPharmacies()
    } catch (err) {
      toast.error('Xatolik yuz berdi')
    } finally { setProcessing(null) }
  }

  const filtered = filter === 'all' ? pharmacies
    : filter === 'pending' ? pharmacies.filter(p => !p.is_approved)
    : pharmacies.filter(p => p.is_approved)

  const columns = [
    { key: 'name', label: 'Nomi' },
    { key: 'stir_or_license', label: 'STIR/Litsenziya' },
    { key: 'phone', label: 'Telefon' },
    { key: 'region', label: 'Viloyat' },
    { key: 'district', label: 'Tuman' },
    { key: 'responsible_person', label: "Mas'ul shaxs" },
    { key: 'status', label: 'Holati', render: (r) => statusBadge(r) },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex gap-2">
          {r.image && (
            <Button variant="ghost" size="sm" onClick={() => window.open(r.image, '_blank')}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {!r.is_approved && (
            <>
              <Button variant="success" size="sm" onClick={() => handleApprove(r.id, true)} disabled={processing === r.id}>
                <CheckCircle className="h-4 w-4 mr-1" /> Tasdiqlash
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleApprove(r.id, false)} disabled={processing === r.id}>
                <XCircle className="h-4 w-4 mr-1" /> Rad etish
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dorixona tasdiqlash</h1>
          <p className="text-gray-500 mt-1">Yangi ro'yxatdan o'tgan dorixonalarni tasdiqlash</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Barchasi' : f === 'pending' ? 'Kutilayotgan' : 'Tasdiqlangan'}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable columns={columns} data={filtered} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
