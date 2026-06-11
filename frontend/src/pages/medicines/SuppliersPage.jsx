import { useState, useEffect } from 'react'
import { suppliersAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import LocationPicker from '@/components/ui/LocationPicker'
import RegionDistrictPicker from '@/components/ui/RegionDistrictPicker'
import { Plus, Edit, Trash2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { REGIONS } from '@/data/uzbekistan'

const defaultForm = { name: '', contact_person: '', phone: '', email: '', region: '', district: '', address: '', latitude: null, longitude: null }

export default function SuppliersPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...defaultForm })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await suppliersAPI.list()
      setData(res.data.results || res.data)
    } catch (err) {
      toast.error('Yetkazib beruvchilarni yuklashda xatolik')
    } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await suppliersAPI.update(editing.id, form)
        toast.success('Yetkazib beruvchi yangilandi')
      } else {
        await suppliersAPI.create(form)
        toast.success("Yetkazib beruvchi qo'shildi")
      }
      setShowModal(false)
      setEditing(null)
      setForm({ ...defaultForm })
      fetchData()
    } catch (err) {
      const msg = err.response?.data
      if (msg && typeof msg === 'object') {
        const txt = Object.values(msg).flat().join('; ')
        toast.error(txt || 'Xatolik')
      } else {
        toast.error('Xatolik yuz berdi')
      }
    }
  }

  const handleEdit = (row) => {
    setEditing(row)
    setForm({
      name: row.name,
      contact_person: row.contact_person || '',
      phone: row.phone,
      email: row.email || '',
      region: row.region || '',
      district: row.district || '',
      address: row.address || '',
      latitude: row.latitude,
      longitude: row.longitude,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm("O'chirilsinmi?")) return
    try {
      await suppliersAPI.delete(id)
      toast.success("O'chirildi")
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    }
  }

  const handleLocationSelect = ({ lat, lng }) => {
    setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
  }

  const columns = [
    { key: 'name', label: 'Nomi' },
    { key: 'contact_person', label: "Aloqa shaxsi" },
    { key: 'phone', label: 'Telefon' },
    { key: 'email', label: 'Email' },
    { key: 'region', label: 'Viloyat', render: (r) => REGIONS.find(reg => reg.value === r.region)?.label || r.region },
    {
      key: 'is_active', label: 'Holat',
      render: (row) => <Badge variant={row.is_active ? 'success' : 'danger'}>{row.is_active ? 'Faol' : 'Faol emas'}</Badge>
    },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Yetkazib beruvchilar</h1>
          <p className="text-gray-500 mt-1">Yetkazib beruvchilarni boshqarish</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ ...defaultForm }); setShowModal(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Yangi yetkazib beruvchi
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Yetkazib beruvchini tahrirlash' : 'Yangi yetkazib beruvchi'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Aloqa shaxsi" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          <Input label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <RegionDistrictPicker
            region={form.region}
            district={form.district}
            onRegionChange={(v) => setForm(prev => ({ ...prev, region: v }))}
            onDistrictChange={(v) => setForm(prev => ({ ...prev, district: v }))}
          />
          <div>
            <label className="text-sm font-medium mb-1 block">Manzil (ko'cha, uy)</label>
            <textarea className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Xaritadan joy belgilash
            </label>
            <LocationPicker
              position={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
              onLocationSelect={handleLocationSelect}
            />
            {form.latitude && form.longitude && (
              <p className="text-xs text-gray-500 mt-1">
                Kenglik: {form.latitude.toFixed(4)}, Uzunlik: {form.longitude.toFixed(4)}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Bekor qilish</Button>
            <Button type="submit">{editing ? 'Saqlash' : "Qo'shish"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
