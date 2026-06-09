import { useState, useEffect } from 'react'
import { pharmaciesAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import LocationPicker from '@/components/ui/LocationPicker'
import { Plus, Edit, Trash2, Eye, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const defaultForm = { name: '', address: '', latitude: null, longitude: null, phone: '', responsible_person: '' }

export default function PharmaciesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...defaultForm })
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await pharmaciesAPI.list()
      setData(res.data.results || res.data)
    } catch (err) {
      toast.error('Dorixonalarni yuklashda xatolik')
    } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await pharmaciesAPI.update(editing.id, form)
        toast.success('Dorixona tahrirlandi')
      } else {
        await pharmaciesAPI.create(form)
        toast.success("Dorixona qo'shildi")
      }
      setShowModal(false); setEditing(null)
      setForm({ ...defaultForm })
      fetchData()
    } catch (err) {
      const msg = err.response?.data
      if (msg && typeof msg === 'object') {
        toast.error(Object.values(msg).flat().join('; ') || 'Xatolik')
      } else {
        toast.error('Xatolik yuz berdi')
      }
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("O'chirilsinmi?")) return
    try { await pharmaciesAPI.delete(id); toast.success("O'chirildi"); fetchData() }
    catch (err) { toast.error(err.response?.data?.detail || 'Xatolik') }
  }

  const handleEdit = (row) => {
    setEditing(row)
    setForm({
      name: row.name, address: row.address,
      latitude: row.latitude, longitude: row.longitude,
      phone: row.phone, responsible_person: row.responsible_person,
    })
    setShowModal(true)
  }

  const handleLocationSelect = ({ lat, lng }) => {
    setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
  }

  const columns = [
    { key: 'name', label: 'Nomi' },
    { key: 'address', label: 'Manzil' },
    { key: 'phone', label: 'Telefon' },
    { key: 'responsible_person', label: "Mas'ul shaxs" },
    { key: 'is_active', label: 'Holat', render: (r) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Faol' : 'Faol emas'}</Badge> },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/pharmacies/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dorixonalar</h1>
          <p className="text-gray-500 mt-1">Dorixonalarni boshqarish</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ ...defaultForm }); setShowModal(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Yangi dorixona
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Dorixonani tahrirlash' : 'Yangi dorixona'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Dorixona nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="text-sm font-medium mb-1 block">Manzil</label>
            <textarea className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
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
          <Input label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Mas'ul shaxs" value={form.responsible_person} onChange={(e) => setForm({ ...form, responsible_person: e.target.value })} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Bekor qilish</Button>
            <Button type="submit">{editing ? 'Saqlash' : "Qo'shish"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
