import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { warehouseAPI, medicinesAPI, suppliersAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Plus, Trash2, Eye, Download, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { exportToExcel } from '@/lib/utils'

export default function IncomePage() {
  const { t } = useTranslation()
  const [data, setData] = useState([])
  const [medicines, setMedicines] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showScan, setShowScan] = useState(false)
  const [scanBarcode, setScanBarcode] = useState('')
  const [showDetail, setShowDetail] = useState(null)
  const [form, setForm] = useState({ medicine: '', supplier: '', quantity: '', price: '', note: '' })

  useEffect(() => { fetchData(); fetchMedicines(); fetchSuppliers() }, [])

  const fetchData = async () => {
    try {
      const res = await warehouseAPI.income.list()
      setData(res.data.results || res.data)
    } catch (err) {
      toast.error(t('warehouse.errorLoadIncomes'))
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

  const fetchSuppliers = async () => {
    try {
      const res = await suppliersAPI.list()
      setSuppliers(res.data.results || res.data)
    } catch (err) {
      toast.error(t('supplier.errorLoad'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await warehouseAPI.income.create(form)
      toast.success(t('warehouse.incomeAdded'))
      setShowModal(false)
      setForm({ medicine: '', supplier: '', quantity: '', price: '', note: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirmDelete'))) return
    try {
      await warehouseAPI.income.delete(id)
      toast.success(t('common.deleted'))
      fetchData()
    } catch (err) { toast.error(err.response?.data?.error || t('common.error')) }
  }

  const handleScan = async (e) => {
    e.preventDefault()
    try {
      await warehouseAPI.income.scan({ barcode: scanBarcode })
      toast.success(t('warehouse.incomeAdded'))
      setShowScan(false)
      setScanBarcode('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'))
    }
  }

  const medicineOptions = medicines.map(m => ({ value: m.id, label: `${m.name} (${m.barcode})` }))
  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))

  const columns = [
    { key: 'medicine_name', label: t('warehouse.medicine') },
    { key: 'supplier_name', label: t('warehouse.supplier') },
    { key: 'quantity', label: t('warehouse.quantity') },
    { key: 'price', label: t('warehouse.price'), render: (r) => Number(r.price).toLocaleString() },
    { key: 'total_amount', label: t('warehouse.total'), render: (r) => Number(r.total_amount).toLocaleString() },
    { key: 'created_by_name', label: t('warehouse.receivedBy') },
    { key: 'created_at', label: t('warehouse.date'), render: (r) => new Date(r.created_at).toLocaleDateString() },
    {
      key: 'actions', label: t('warehouse.actions'),
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
          <h1 className="text-2xl font-bold">{t('warehouse.income')}</h1>
          <p className="text-gray-500 mt-1">{t('warehouse.incomeDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScan(true)}>
            <Camera className="h-4 w-4 mr-2" /> {t('warehouse.barcode')}
          </Button>
          <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> {t('warehouse.newIncome')}</Button>
          <Button variant="outline" onClick={() => exportToExcel(data, columns, 'kirimlar')}>
            <Download className="h-4 w-4 mr-2" /> {t('warehouse.excel')}
          </Button>
        </div>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('warehouse.newIncome')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label={t('warehouse.medicine')} options={medicineOptions} value={form.medicine} onChange={(e) => setForm({ ...form, medicine: Number(e.target.value) || '' })} placeholder={t('medicine.selectCategory')} required />
          <Select label={t('warehouse.supplier')} options={supplierOptions} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: Number(e.target.value) || '' })} placeholder={t('medicine.selectSupplier')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('warehouse.quantity')} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input label={t('warehouse.price')} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <Input label={t('warehouse.note')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.add')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showScan} onClose={() => setShowScan(false)} title={t('warehouse.incomeScan')}>
        <form onSubmit={handleScan} className="space-y-4">
          <Input label={t('warehouse.enterBarcode')} value={scanBarcode} onChange={(e) => setScanBarcode(e.target.value)} placeholder={t('warehouse.barcodePlaceholder')} autoFocus required />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowScan(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.add')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={t('warehouse.incomeDetails')}>
        {showDetail && (
          <div className="space-y-3">
            <div><strong>{t('warehouse.medicine')}:</strong> {showDetail.medicine_name}</div>
            <div><strong>{t('warehouse.supplier')}:</strong> {showDetail.supplier_name || '-'}</div>
            <div><strong>{t('warehouse.quantity')}:</strong> {showDetail.quantity}</div>
            <div><strong>{t('warehouse.price')}:</strong> {Number(showDetail.price).toLocaleString()} {t('currency.soum')}</div>
            <div><strong>{t('warehouse.total')}:</strong> {Number(showDetail.total_amount).toLocaleString()} {t('currency.soum')}</div>
            <div><strong>{t('warehouse.receivedBy')}:</strong> {showDetail.created_by_name || '-'}</div>
            <div><strong>{t('warehouse.date')}:</strong> {new Date(showDetail.created_at).toLocaleString()}</div>
            {showDetail.note && <div><strong>{t('warehouse.note')}:</strong> {showDetail.note}</div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
