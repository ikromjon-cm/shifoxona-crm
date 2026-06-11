import { useState, useEffect, useRef } from 'react'
import { medicinesAPI, categoriesAPI, suppliersAPI, batchesAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Plus, Edit, Trash2, Package, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { exportToExcel, formatDate } from '@/lib/utils'

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBatches, setShowBatches] = useState(null)
  const [batches, setBatches] = useState([])
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [form, setForm] = useState({
    name: '', category: '', supplier: '', barcode: '', series_number: '',
    purchase_price: '', selling_price: '', quantity: '',
    min_quantity: '10', description: '', is_active: true,
  })

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  useEffect(() => {
    fetchMedicines()
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchCategories()
    fetchSuppliers()
  }, [])

  const fetchMedicines = async () => {
    try {
      const params = { page, search: debouncedSearch }
      const res = await medicinesAPI.list(params)
      setMedicines(res.data.results || res.data)
      setTotalPages(Math.ceil((res.data.count || 0) / 20) || 1)
    } catch (err) {
      toast.error('Mahsulotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.list()
      setCategories(res.data.results || res.data)
    } catch (err) {
      toast.error('Kategoriyalarni yuklashda xatolik')
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

  const fetchBatches = async (medicineId) => {
    try {
      const res = await batchesAPI.list({ medicine: medicineId })
      setBatches(res.data.results || res.data)
    } catch (err) {
      toast.error('Partiyalarni yuklashda xatolik')
    }
  }

  const getValidationError = (err) => {
    const data = err.response?.data
    if (data && typeof data === 'object') {
      return Object.values(data).flat().join('; ')
    }
    if (err.response?.status === 403) {
      return "Sizda huquq yo'q"
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {}
      payload.name = form.name
      if (form.category) payload.category = form.category
      if (form.supplier) payload.supplier = form.supplier
      if (form.barcode) payload.barcode = form.barcode
      if (form.series_number) payload.series_number = form.series_number
      payload.purchase_price = form.purchase_price
      payload.selling_price = form.selling_price
      payload.quantity = form.quantity
      payload.min_quantity = form.min_quantity
      payload.is_active = form.is_active
      payload.description = form.description || ''

      let data
      if (imageFile) {
        data = new FormData()
        Object.entries(payload).forEach(([k, v]) => data.append(k, v))
        data.append('image', imageFile)
      } else {
        data = payload
      }

      if (editing) {
        await medicinesAPI.update(editing.id, data)
        toast.success('Mahsulot tahrirlandi')
      } else {
        await medicinesAPI.create(data)
        toast.success("Mahsulot qo'shildi")
      }
      setShowModal(false)
      setEditing(null)
      setImageFile(null)
      setImagePreview(null)
      resetForm()
      fetchMedicines()
    } catch (err) {
      const msg = getValidationError(err)
      toast.error(msg || 'Xatolik yuz berdi')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Mahsulotni o'chirishni xohlaysizmi?")) return
    try {
      await medicinesAPI.delete(id)
      toast.success("Mahsulot o'chirildi")
      fetchMedicines()
    } catch (err) {
      toast.error(err.response?.data?.detail || "O'chirishda xatolik")
    }
  }

  const handleEdit = (medicine) => {
    setEditing(medicine)
    setForm({
      name: medicine.name,
      category: medicine.category || '',
      supplier: medicine.supplier || '',
      barcode: medicine.barcode,
      series_number: medicine.series_number || '',
      purchase_price: medicine.purchase_price,
      selling_price: medicine.selling_price,
      quantity: medicine.quantity,
      min_quantity: medicine.min_quantity,
      description: medicine.description || '',
      is_active: medicine.is_active,
    })
    setImagePreview(medicine.image || null)
    setImageFile(null)
    setShowModal(true)
  }

  const handleViewBatches = (medicine) => {
    setShowBatches(medicine)
    setBatches([])
    fetchBatches(medicine.id)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const resetForm = () => {
    setForm({
      name: '', category: '', supplier: '', barcode: '', series_number: '',
      purchase_price: '', selling_price: '', quantity: '',
      min_quantity: '10', description: '', is_active: true,
    })
  }

  const columns = [
    { key: 'name', label: 'Nomi' },
    { key: 'category_name', label: 'Kategoriya' },
    { key: 'barcode', label: 'Barcode' },
    {
      key: 'quantity', label: 'Soni',
      render: (row) => (
        <span className={row.is_low_stock ? 'text-red-500 font-bold' : ''}>
          {row.quantity}
        </span>
      ),
    },
    { key: 'purchase_price', label: 'Kirim narxi', render: (row) => Number(row.purchase_price).toLocaleString() },
    { key: 'selling_price', label: 'Sotuv narxi', render: (row) => Number(row.selling_price).toLocaleString() },
    {
      key: 'is_active', label: 'Holat',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>
          {row.is_active ? 'Faol' : 'Faol emas'}
        </Badge>
      ),
    },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleViewBatches(row)} title="Partiyalar">
            <Package className="h-4 w-4" />
          </Button>
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

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))

  const batchColumns = [
    { key: 'series_number', label: 'Seriya' },
    { key: 'quantity', label: 'Miqdor' },
    { key: 'purchase_price', label: 'Kirim narxi', render: (r) => Number(r.purchase_price).toLocaleString() },
    { key: 'production_date', label: 'Ishl. sanasi', render: (r) => r.production_date ? formatDate(r.production_date) : '-' },
    { key: 'expiry_date', label: 'Muddati', render: (r) => formatDate(r.expiry_date) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mahsulotlar</h1>
          <p className="text-gray-500 mt-1">Barcha mahsulotlarni boshqarish</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(medicines, columns, 'mahsulotlar')}>
            Excel
          </Button>
          <Button onClick={() => { setEditing(null); resetForm(); setImageFile(null); setImagePreview(null); setShowModal(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Yangi mahsulot
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={medicines}
            loading={loading}
            searchable
            onSearch={setSearch}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Mahsulot nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Kategoriya" options={categoryOptions} value={form.category} onChange={(e) => setForm({ ...form, category: Number(e.target.value) || '' })} placeholder="Kategoriyani tanlang" />
            <Select label="Yetkazib beruvchi" options={supplierOptions} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: Number(e.target.value) || '' })} placeholder="Yetkazib beruvchini tanlang" />
          </div>
          <Input label="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Bo'sh qoldirilsa, avtomatik generatsiya qilinadi" />
          <Input label="Seriya raqami" value={form.series_number} onChange={(e) => setForm({ ...form, series_number: e.target.value })} placeholder="Seriya raqami" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Xarid narxi" type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} required />
            <Input label="Sotuv narxi" type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Miqdori" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input label="Minimal qoldiq" type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rasm</label>
            <div className="flex items-center gap-4 mt-1">
              <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Faol</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`p-1 rounded transition-colors ${form.is_active ? 'text-emerald-500' : 'text-gray-400'}`}
            >
              {form.is_active ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tavsif</label>
            <textarea className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Bekor qilish</Button>
            <Button type="submit">{editing ? 'Saqlash' : "Qo'shish"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showBatches} onClose={() => setShowBatches(null)} title={`Partiyalar: ${showBatches?.name || ''}`} size="lg">
        <DataTable columns={batchColumns} data={batches} emptyMessage="Partiyalar mavjud emas" />
      </Modal>
    </div>
  )
}
