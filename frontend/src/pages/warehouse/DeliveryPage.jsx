import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ordersAPI, deliveryAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Truck, Download } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const downloadExcel = (apiMethod, filename, t) => async () => {
  try {
    const res = await apiMethod()
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success(t('common.downloaded'))
  } catch (err) {
    toast.error(t('common.error'))
  }
}

const pharmacyIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const courierIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const statusBadge = (status, t) => {
  const variants = {
    pending: 'warning', assigned: 'info', picked: 'info',
    in_transit: 'info', delivered: 'success', cancelled: 'danger',
  }
  const labels = {
    pending: t('pharmacy.pending'), assigned: t('delivery.assigned'), picked: t('delivery.picked'),
    in_transit: t('delivery.inTransit'), delivered: t('pharmacy.delivered'), cancelled: t('pharmacy.cancelled'),
  }
  return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
}

export default function DeliveryPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => { fetchOrders(); fetchDeliveries() }, [])

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.list({ page_size: 100 })
      setOrders(res.data.results || res.data)
    } catch (err) {
      toast.error(t('delivery.errorLoadOrders'))
    } finally { if (deliveries.length) setLoading(false) }
  }

  const fetchDeliveries = async () => {
    try {
      const res = await deliveryAPI.list()
      setDeliveries(res.data.results || res.data)
    } catch (err) { /* ignore */ }
    finally { setLoading(false) }
  }

  const getDeliveryForOrder = (orderId) => deliveries.find(d => d.order === orderId)

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, { status })
      toast.success(t('common.statusUpdated'))
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'))
    }
  }

  const handleCreateDelivery = async (orderId) => {
    try {
      await deliveryAPI.create({ order: orderId })
      toast.success(t('delivery.created'))
      fetchOrders()
    } catch (err) {
      toast.error(t('common.error'))
    }
  }

  const columns = [
    { key: 'order_number', label: t('pharmacy.orderNumber') },
    { key: 'pharmacy_name', label: t('dashboard.pharmacy') },
    { key: 'pharmacy_phone', label: t('pharmacy.phone') },
    { key: 'created_at', label: t('pharmacy.time'), render: (r) => formatDateTime(r.created_at) },
    { key: 'total_items', label: t('delivery.totalItems') },
    {
      key: 'status', label: t('medicine.status'),
      render: (r) => statusBadge(r.status, t),
    },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex gap-2">
          {r.status === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(r.id, 'confirmed')}>
              {t('pharmacy.approve')}
            </Button>
          )}
          {r.status === 'confirmed' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(r.id, 'preparing')}>
              {t('delivery.prepare')}
            </Button>
          )}
          {r.status === 'preparing' && (
            <Button size="sm" variant="outline" onClick={() => { handleStatusUpdate(r.id, 'shipped'); handleCreateDelivery(r.id) }}>
              <Truck className="h-4 w-4 mr-1" /> {t('delivery.onTheWay')}
            </Button>
          )}
          {r.pharmacy_latitude && r.pharmacy_longitude && (
            <Button size="sm" variant="ghost" onClick={() => { setSelectedOrder(r); setSelectedDelivery(getDeliveryForOrder(r.id)); setShowMap(true) }}>
              <MapPin className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('warehouse.delivery')}</h1>
          <p className="text-gray-500 mt-1">{t('warehouse.deliveryDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadExcel(ordersAPI.exportExcel, 'buyurtmalar.xlsx', t)}>
            <Download className="h-4 w-4 mr-1" /> {t('delivery.orders')}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadExcel(deliveryAPI.exportExcel, 'yetkazib_berish.xlsx', t)}>
            <Download className="h-4 w-4 mr-1" /> {t('warehouse.delivery')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable columns={columns} data={orders} loading={loading} />
        </CardContent>
      </Card>

      <Modal isOpen={showMap} onClose={() => setShowMap(false)} title={selectedOrder?.pharmacy_name || t('common.map')} size="xl">
        {selectedOrder?.pharmacy_latitude && selectedOrder?.pharmacy_longitude && (
          <div className="h-96 w-full rounded-lg overflow-hidden">
            <MapContainer
              center={[selectedOrder.pharmacy_latitude, selectedOrder.pharmacy_longitude]}
              zoom={selectedDelivery?.courier_lat ? 13 : 15}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={[selectedOrder.pharmacy_latitude, selectedOrder.pharmacy_longitude]}
                icon={pharmacyIcon}
              >
                <Popup>
                  <strong>{selectedOrder.pharmacy_name}</strong><br />
                  {selectedOrder.pharmacy_phone}<br />
                  <span className="text-xs text-gray-500">{t('dashboard.pharmacy')}</span><br />
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.pharmacy_latitude},${selectedOrder.pharmacy_longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    Google Maps
                  </a>
                  <br />
                  <a
                    href={`https://www.openstreetmap.org/directions?from=&to=${selectedOrder.pharmacy_latitude}%2C${selectedOrder.pharmacy_longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    OSM
                  </a>
                </Popup>
              </Marker>
              {selectedDelivery?.courier_lat && selectedDelivery?.courier_lng && (
                <Marker
                  position={[selectedDelivery.courier_lat, selectedDelivery.courier_lng]}
                  icon={courierIcon}
                >
                  <Popup>
                    <strong>{t('delivery.courier')}</strong><br />
                    {selectedDelivery.courier_name || t('common.unknown')}<br />
                    <span className="text-xs text-gray-500">
                      {t('delivery.lastUpdate')}: {formatDateTime(selectedDelivery.courier_location_updated_at)}
                    </span><br />
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${selectedDelivery.courier_lat},${selectedDelivery.courier_lng}&destination=${selectedOrder.pharmacy_latitude},${selectedOrder.pharmacy_longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm"
                    >
                      {t('delivery.courierRoute')}
                    </a>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        )}
      </Modal>
    </div>
  )
}
