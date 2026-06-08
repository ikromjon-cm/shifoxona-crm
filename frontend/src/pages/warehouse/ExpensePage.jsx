import { useState, useEffect } from 'react'
import { warehouseAPI, medicinesAPI, pharmaciesAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Plus, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ExpensePage() {
  const [data, setData] = useState([])
  const [medicines, setMedicines] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [form, setForm] = useState({ medicine: '', pharmacy: '', quantity: '', price: '', reason: '', note: '', recipient_name: '' })

  useEffect(() => { fetchData(); fetchMedicines(); fetchPharmacies() }, [])

  const fetchData = async () => {
    try {
      const res = await warehouseAPI.expense.list()
      setData(res.data.results || res.data)
    } catch (err) {
      toast.error('Tarqatishlarni yuklashda xatolik')
    } finally { setLoading(false) }
  }

  const fetchMedicines = async () => {
    try {
      const res = await medicinesAPI.list()
      setMedicines(res.data.results || res.data)
    } catch (err) {
      toast.error('Mahsulotlarni yuklashda xatolik')
    }
  }

  const fetchPharmacies = async () => {
    try {
      const res = await pharmaciesAPI.list()
      setPharmacies(res.data.results || res.data)
    } catch (err) {
      toast.error('Dorixonalarni yuklashda xatolik')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await warehouseAPI.expense.create(form)
      toast.success('Tarqatildi')
      setShowModal(false)
      setForm({ medicine: '', pharmacy: '', quantity: '', price: '', reason: '', note: '', recipient_name: '' })
      fetchData()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        toast.error(Object.values(data).flat().join('; ') || 'Xatolik')
      } else {
        toast.error(err.response?.data?.error || 'Xatolik')
      }
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("O'chirilsinmi?")) return
    try {
      await warehouseAPI.expense.delete(id)
      toast.success("O'chirildi")
      fetchData()
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik') }
  }

  const medicineOptions = medicines.map(m => ({ value: m.id, label: `${m.name} (${m.barcode}) - ${m.quantity} dona` }))
  const pharmacyOptions = pharmacies.map(p => ({ value: p.id, label: p.name }))

  const columns = [
    { key: 'medicine_name', label: 'Mahsulot' },
    { key: 'pharmacy_name', label: 'Dorixona' },
    { key: 'recipient_name', label: 'Qabul qiluvchi', render: (r) => r.recipient_name || '-' },
    { key: 'quantity', label: 'Miqdor' },
    { key: 'price', label: 'Narx', render: (r) => Number(r.price).toLocaleString() },
    { key: 'total_amount', label: 'Jami', render: (r) => Number(r.total_amount).toLocaleString() },
    { key: 'created_by_name', label: 'Kim bergan' },
    { key: 'created_at', label: 'Sana', render: (r) => new Date(r.created_at).toLocaleDateString() },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDetail(row)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dorixonalarga tarqatish</h1>
          <p className="text-gray-500 mt-1">Mahsulotlarni dorixonalarga yetkazib berish</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> Yangi tarqatish</Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Yangi tarqatish" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Mahsulot" options={medicineOptions} value={form.medicine} onChange={(e) => setForm({ ...form, medicine: Number(e.target.value) || '' })} placeholder="Mahsulotni tanlang" required />
          <Select label="Dorixona" options={pharmacyOptions} value={form.pharmacy} onChange={(e) => setForm({ ...form, pharmacy: Number(e.target.value) || '' })} placeholder="Dorixonani tanlang" required />
          <Input label="Qabul qiluvchi" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} placeholder="Kim qabul qilib oldi" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Miqdori" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input label="Narxi" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <Input label="Sabab" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Tarqatish sababi" />
          <Input label="Izoh" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Bekor qilish</Button>
            <Button type="submit">Tarqatish</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Tarqatish tafsilotlari">
        {showDetail && (
          <div className="space-y-3">
            <div><strong>Mahsulot:</strong> {showDetail.medicine_name}</div>
            <div><strong>Dorixona:</strong> {showDetail.pharmacy_name || '-'}</div>
            <div><strong>Qabul qiluvchi:</strong> {showDetail.recipient_name || '-'}</div>
            <div><strong>Miqdori:</strong> {showDetail.quantity}</div>
            <div><strong>Narxi:</strong> {Number(showDetail.price).toLocaleString()} so'm</div>
            <div><strong>Jami:</strong> {Number(showDetail.total_amount).toLocaleString()} so'm</div>
            <div><strong>Sabab:</strong> {showDetail.reason || '-'}</div>
            <div><strong>Kim bergan:</strong> {showDetail.created_by_name || '-'}</div>
            <div><strong>Sana:</strong> {new Date(showDetail.created_at).toLocaleString()}</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
