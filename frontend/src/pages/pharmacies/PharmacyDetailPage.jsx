import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pharmaciesAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { ArrowLeft, Building2, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

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
  const hasLocation = pharmacy.latitude && pharmacy.longitude

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm flex items-center gap-1"><MapPin className="h-4 w-4" /> Xaritadagi joylashuv</CardTitle></CardHeader>
          <CardContent>
            {hasLocation ? (
              <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <MapContainer center={[pharmacy.latitude, pharmacy.longitude]} zoom={15} className="h-full w-full" scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[pharmacy.latitude, pharmacy.longitude]} icon={defaultIcon}>
                    <Popup>{pharmacy.name}<br />{pharmacy.address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Joylashuv belgilanmagan</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
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
