import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      toast.error(t('warehouse.errorLoadExpenses'))
    } finally { setLoading(false) }
  }

  const fetchMedicines = async () => {
    try {
      const res = await medicinesAPI.list()
      setMedicines(res.data.results || res.data)
    } catch (err) {
      toast.error(t('medicine.errorLoad'))
    }
  }

  const fetchPharmacies = async () => {
    try {
      const res = await pharmaciesAPI.list()
      setPharmacies(res.data.results || res.data)
    } catch (err) {
      toast.error(t('pharmacy.errorLoad'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await warehouseAPI.expense.create(form)
      toast.success(t('warehouse.expenseAdded'))
      setShowModal(false)
      setForm({ medicine: '', pharmacy: '', quantity: '', price: '', reason: '', note: '', recipient_name: '' })
      fetchData()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        toast.error(Object.values(data).flat().join('; ') || t('common.error'))
      } else {
        toast.error(err.response?.data?.error || t('common.error'))
      }
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirmDelete'))) return
    try {
      await warehouseAPI.expense.delete(id)
      toast.success(t('common.deleted'))
      fetchData()
    } catch (err) { toast.error(err.response?.data?.error || t('common.error')) }
  }

  const medicineOptions = medicines.map(m => ({ value: m.id, label: `${m.name} (${m.barcode}) - ${m.quantity} dona` }))
  const pharmacyOptions = pharmacies.map(p => ({ value: p.id, label: p.name }))

  const columns = [
    { key: 'medicine_name', label: t('warehouse.medicine') },
    { key: 'pharmacy_name', label: t('dashboard.pharmacy') },
    { key: 'recipient_name', label: t('warehouse.recipient'), render: (r) => r.recipient_name || '-' },
    { key: 'quantity', label: t('warehouse.quantity') },
    { key: 'price', label: t('warehouse.price'), render: (r) => Number(r.price).toLocaleString() },
    { key: 'total_amount', label: t('warehouse.total'), render: (r) => Number(r.total_amount).toLocaleString() },
    { key: 'created_by_name', label: t('warehouse.givenBy') },
    { key: 'created_at', label: t('warehouse.date'), render: (r) => new Date(r.created_at).toLocaleDateString() },
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
          <h1 className="text-2xl font-bold">{t('warehouse.expense')}</h1>
          <p className="text-gray-500 mt-1">{t('warehouse.expenseDesc')}</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> {t('warehouse.newExpense')}</Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('warehouse.newExpense')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label={t('warehouse.medicine')} options={medicineOptions} value={form.medicine} onChange={(e) => setForm({ ...form, medicine: Number(e.target.value) || '' })} placeholder={t('medicine.selectCategory')} required />
          <Select label={t('dashboard.pharmacy')} options={pharmacyOptions} value={form.pharmacy} onChange={(e) => setForm({ ...form, pharmacy: Number(e.target.value) || '' })} placeholder={t('pharmacy.selectPharmacy')} required />
          <Input label={t('warehouse.recipient')} value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} placeholder={t('warehouse.recipientPlaceholder')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('warehouse.quantity')} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input label={t('warehouse.price')} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <Input label={t('warehouse.reason')} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={t('warehouse.reasonPlaceholder')} />
          <Input label={t('warehouse.note')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('warehouse.distribute')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={t('warehouse.expenseDetails')}>
        {showDetail && (
          <div className="space-y-3">
            <div><strong>{t('warehouse.medicine')}:</strong> {showDetail.medicine_name}</div>
            <div><strong>{t('dashboard.pharmacy')}:</strong> {showDetail.pharmacy_name || '-'}</div>
            <div><strong>{t('warehouse.recipient')}:</strong> {showDetail.recipient_name || '-'}</div>
            <div><strong>{t('warehouse.quantity')}:</strong> {showDetail.quantity}</div>
            <div><strong>{t('warehouse.price')}:</strong> {Number(showDetail.price).toLocaleString()} {t('currency.soum')}</div>
            <div><strong>{t('warehouse.total')}:</strong> {Number(showDetail.total_amount).toLocaleString()} {t('currency.soum')}</div>
            <div><strong>{t('warehouse.reason')}:</strong> {showDetail.reason || '-'}</div>
            <div><strong>{t('warehouse.givenBy')}:</strong> {showDetail.created_by_name || '-'}</div>
            <div><strong>{t('warehouse.date')}:</strong> {new Date(showDetail.created_at).toLocaleString()}</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
