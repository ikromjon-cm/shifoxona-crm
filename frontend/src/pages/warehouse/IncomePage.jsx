import { useState, useEffect } from 'react'
import { warehouseAPI, medicinesAPI, suppliersAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Plus, Trash2, Eye, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { exportToExcel } from '@/lib/utils'

export default function IncomePage() {
  const [data, setData] = useState([])
  const [medicines, setMedicines] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [form, setForm] = useState({ medicine: '', supplier: '', quantity: '', price: '', note: '' })

  useEffect(() => { fetchData(); fetchMedicines(); fetchSuppliers() }, [])

  const fetchData = async () => {
    try {
      const res = await warehouseAPI.income.list()
      setData(res.data.results || res.data)
    } catch (err) {
      toast.error('Kirimlarni yuklashda xatolik')
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

  const fetchSuppliers = async () => {
    try {
      const res = await suppliersAPI.list()
      setSuppliers(res.data.results || res.data)
    } catch (err) {
      toast.error('Yetkazib beruvchilarni yuklashda xatolik')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await warehouseAPI.income.create(form)
      toast.success('Kirim qo\'shildi')
      setShowModal(false)
      setForm({ medicine: '', supplier: '', quantity: '', price: '', note: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('O\'chirilsinmi?')) return
    try {
      await warehouseAPI.income.delete(id)
      toast.success('O\'chirildi')
      fetchData()
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik') }
  }

  const medicineOptions = medicines.map(m => ({ value: m.id, label: `${m.name} (${m.barcode})` }))
  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))

  const columns = [
    { key: 'medicine_name', label: 'Mahsulot' },
    { key: 'supplier_name', label: 'Yetkazib beruvchi' },
    { key: 'quantity', label: 'Miqdor' },
    { key: 'price', label: 'Narx', render: (r) => Number(r.price).toLocaleString() },
    { key: 'total_amount', label: 'Jami', render: (r) => Number(r.total_amount).toLocaleString() },
    { key: 'created_by_name', label: 'Kim qabul qilgan' },
    { key: 'created_at', label: 'Sana', render: (r) => new Date(r.created_at).toLocaleDateString() },
    {
      key: 'actions', label: 'Amallar',
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
          <h1 className="text-2xl font-bold">Kirimlar</h1>
          <p className="text-gray-500 mt-1">Omborga mahsulot qabul qilish</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> Yangi kirim</Button>
          <Button variant="outline" onClick={() => exportToExcel(data, columns, 'kirimlar')}>
            <Download className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Yangi kirim" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Mahsulot" options={medicineOptions} value={form.medicine} onChange={(e) => setForm({ ...form, medicine: Number(e.target.value) || '' })} placeholder="Mahsulotni tanlang" required />
          <Select label="Yetkazib beruvchi" options={supplierOptions} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: Number(e.target.value) || '' })} placeholder="Yetkazib beruvchini tanlang" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Miqdori" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input label="Narxi" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <Input label="Izoh" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Bekor qilish</Button>
            <Button type="submit">Qo'shish</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Kirim tafsilotlari">
        {showDetail && (
          <div className="space-y-3">
            <div><strong>Mahsulot:</strong> {showDetail.medicine_name}</div>
            <div><strong>Yetkazib beruvchi:</strong> {showDetail.supplier_name || '-'}</div>
            <div><strong>Miqdori:</strong> {showDetail.quantity}</div>
            <div><strong>Narxi:</strong> {Number(showDetail.price).toLocaleString()} so'm</div>
            <div><strong>Jami:</strong> {Number(showDetail.total_amount).toLocaleString()} so'm</div>
            <div><strong>Kim qabul qilgan:</strong> {showDetail.created_by_name || '-'}</div>
            <div><strong>Sana:</strong> {new Date(showDetail.created_at).toLocaleString()}</div>
            {showDetail.note && <div><strong>Izoh:</strong> {showDetail.note}</div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
