import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { pharmaciesAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import LocationPicker from '@/components/ui/LocationPicker'
import RegionDistrictPicker from '@/components/ui/RegionDistrictPicker'
import { Plus, Edit, Trash2, Eye, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { REGIONS } from '@/data/uzbekistan'

const defaultForm = { name: '', region: '', district: '', address: '', latitude: null, longitude: null, phone: '', responsible_person: '' }

export default function PharmaciesPage() {
  const { t } = useTranslation()
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
      toast.error(t('pharmacy.errorLoad'))
    } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await pharmaciesAPI.update(editing.id, form)
        toast.success(t('pharmacy.updated'))
      } else {
        await pharmaciesAPI.create(form)
        toast.success(t('pharmacy.added'))
      }
      setShowModal(false); setEditing(null)
      setForm({ ...defaultForm })
      fetchData()
    } catch (err) {
      const msg = err.response?.data
      if (msg && typeof msg === 'object') {
        toast.error(Object.values(msg).flat().join('; ') || t('common.error'))
      } else {
        toast.error(t('common.error'))
      }
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('pharmacy.deleteConfirm'))) return
    try { await pharmaciesAPI.delete(id); toast.success(t('common.deleted')); fetchData() }
    catch (err) { toast.error(err.response?.data?.detail || t('common.error')) }
  }

  const handleEdit = (row) => {
    setEditing(row)
    setForm({
      name: row.name, region: row.region || '', district: row.district || '', address: row.address,
      latitude: row.latitude, longitude: row.longitude,
      phone: row.phone, responsible_person: row.responsible_person,
    })
    setShowModal(true)
  }

  const handleLocationSelect = ({ lat, lng }) => {
    setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
  }

  const columns = [
    { key: 'name', label: t('medicine.name') },
    { key: 'region', label: t('region.region'), render: (r) => REGIONS.find(reg => reg.value === r.region)?.label || r.region },
    { key: 'address', label: t('pharmacy.address') },
    { key: 'phone', label: t('pharmacy.phone') },
    { key: 'responsible_person', label: t('pharmacy.responsible') },
    { key: 'is_active', label: t('medicine.status'), render: (r) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? t('medicine.statusActive') : t('medicine.statusInactive')}</Badge> },
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
          <h1 className="text-2xl font-bold">{t('nav.pharmacies')}</h1>
          <p className="text-gray-500 mt-1">{t('pharmacy.management')}</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ ...defaultForm }); setShowModal(true) }}>
          <Plus className="h-4 w-4 mr-2" /> {t('pharmacy.new')}
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('pharmacy.edit') : t('pharmacy.new')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('pharmacy.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <RegionDistrictPicker
            region={form.region}
            district={form.district}
            onRegionChange={(v) => setForm(prev => ({ ...prev, region: v }))}
            onDistrictChange={(v) => setForm(prev => ({ ...prev, district: v }))}
          />
          <div>
            <label className="text-sm font-medium mb-1 block">{t('supplier.address')}</label>
            <textarea className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {t('supplier.location')}
            </label>
            <LocationPicker
              position={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
              onLocationSelect={handleLocationSelect}
            />
            {form.latitude && form.longitude && (
              <p className="text-xs text-gray-500 mt-1">
                {t('location.latitude')}: {form.latitude.toFixed(4)}, {t('location.longitude')}: {form.longitude.toFixed(4)}
              </p>
            )}
          </div>
          <Input label={t('pharmacy.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label={t('pharmacy.responsible')} value={form.responsible_person} onChange={(e) => setForm({ ...form, responsible_person: e.target.value })} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{editing ? t('common.save') : t('common.add')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
