import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import Button from '@/components/ui/Button'
import { LocateFixed, MapPin } from 'lucide-react'
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

function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function CenterUpdater({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], map.getZoom())
  }, [position, map])
  return null
}

export default function LocationPicker({ position, onLocationSelect }) {
  const center = position || { lat: 41.2995, lng: 69.2401 }
  const [locating, setLocating] = useState(false)

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolokatsiya qo\'llab-quvvatlanmaydi')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        onLocationSelect({ lat, lng })
        setLocating(false)
      },
      () => {
        toast.error('Joylashuvni aniqlash imkoni yo\'q')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={handleLocateMe} isLoading={locating}>
        <LocateFixed className="h-4 w-4 mr-1" /> Mening joylashuvim
      </Button>
      <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 relative">
        <MapContainer center={center} zoom={position ? 15 : 12} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationSelect={onLocationSelect} />
          <CenterUpdater position={position} />
          {position && <Marker position={[position.lat, position.lng]} icon={defaultIcon} />}
        </MapContainer>
        <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 rounded-md shadow px-2 py-1 text-xs text-gray-500 z-[1000]">
          <MapPin className="h-3 w-3 inline mr-1" />
          Xaritaga bosing
        </div>
      </div>
      {position && (
        <p className="text-xs text-gray-500">
          Kenglik: {position.lat.toFixed(4)}, Uzunlik: {position.lng.toFixed(4)}
        </p>
      )}
    </div>
  )
}
