import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { pharmaciesAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const statusBadge = (pharmacy, t) => {
  if (!pharmacy.is_approved) return <Badge variant="warning">{t('pharmacy.pending')}</Badge>
  return <Badge variant="success">{t('pharmacy.isApproved')}</Badge>
}

export default function PharmacyApprovalPage() {
  const { t } = useTranslation()
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
      toast.error(t('pharmacy.errorLoad'))
    } finally { setLoading(false) }
  }

  const handleApprove = async (id, approve) => {
    setProcessing(id)
    try {
      await pharmaciesAPI.approve(id, { approve })
      toast.success(approve ? t('pharmacy.approved') : t('pharmacy.rejected'))
      fetchPharmacies()
    } catch (err) {
      toast.error(t('common.error'))
    } finally { setProcessing(null) }
  }

  const filtered = filter === 'all' ? pharmacies
    : filter === 'pending' ? pharmacies.filter(p => !p.is_approved)
    : pharmacies.filter(p => p.is_approved)

  const columns = [
    { key: 'name', label: t('medicine.name') },
    { key: 'stir_or_license', label: t('pharmacy.stirLicense') },
    { key: 'phone', label: t('pharmacy.phone') },
    { key: 'region', label: t('region.region') },
    { key: 'district', label: t('region.district') },
    { key: 'responsible_person', label: t('pharmacy.responsible') },
    { key: 'status', label: t('medicine.status'), render: (r) => statusBadge(r, t) },
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
                <CheckCircle className="h-4 w-4 mr-1" /> {t('pharmacy.approve')}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleApprove(r.id, false)} disabled={processing === r.id}>
                <XCircle className="h-4 w-4 mr-1" /> {t('pharmacy.reject')}
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
          <h1 className="text-2xl font-bold">{t('pharmacy.approval')}</h1>
          <p className="text-gray-500 mt-1">{t('pharmacy.approvalDesc')}</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? t('common.all') : f === 'pending' ? t('pharmacy.filterPending') : t('pharmacy.isApproved')}
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
