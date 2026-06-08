import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pharmaciesAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ArrowLeft, Building2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function PharmacyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pharmacy, setPharmacy] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPharmacy()
  }, [id])

  const fetchPharmacy = async () => {
    try {
      const res = await pharmaciesAPI.get(id)
      setPharmacy(res.data)
    } catch (err) {
      toast.error('Dorixonani yuklashda xatolik')
    } finally { setLoading(false) }
  }

  const columns = [
    { key: 'medicine_name', label: 'Mahsulot' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'quantity', label: 'Dorixonadagi soni' },
    { key: 'created_at', label: 'Qoshilgan sana', render: (r) => formatDate(r.created_at) },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500" />
      </div>
    )
  }

  if (!pharmacy) {
    return <div className="text-center py-12 text-gray-500">Dorixona topilmadi</div>
  }

  const totalProducts = pharmacy.products?.reduce((sum, p) => sum + p.quantity, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pharmacies')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{pharmacy.name}</h1>
            <p className="text-gray-500 mt-1">{pharmacy.address}</p>
          </div>
        </div>
        <Badge variant={pharmacy.is_active ? 'success' : 'danger'}>
          {pharmacy.is_active ? 'Faol' : 'Faol emas'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Telefon</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{pharmacy.phone || '-'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Masul shaxs</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{pharmacy.responsible_person || '-'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Jami mahsulotlar</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{totalProducts} dona</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Dorixonadagi mahsulotlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={pharmacy.products || []} emptyMessage="Dorixonada mahsulot mavjud emas" />
        </CardContent>
      </Card>
    </div>
  )
}
