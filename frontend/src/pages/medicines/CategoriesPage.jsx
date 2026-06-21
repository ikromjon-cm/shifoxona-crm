import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { categoriesAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CategoriesPage() {
  const { t } = useTranslation()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await categoriesAPI.list()
      setData(res.data.results || res.data)
    } catch (err) {
      toast.error(t('category.errorLoad'))
    } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await categoriesAPI.update(editing.id, form)
        toast.success(t('category.created'))
      } else {
        await categoriesAPI.create(form)
        toast.success(t('category.added'))
      }
      setShowModal(false)
      setEditing(null)
      setForm({ name: '', description: '' })
      fetchData()
    } catch (err) {
      const msg = err.response?.data
      if (msg && typeof msg === 'object') {
        const txt = Object.values(msg).flat().join('; ')
        toast.error(txt || t('common.error'))
      } else {
        toast.error(t('common.error'))
      }
    }
  }

  const handleEdit = (row) => {
    setEditing(row)
    setForm({ name: row.name, description: row.description || '' })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirm') + '?')) return
    try {
      await categoriesAPI.delete(id)
      toast.success(t('category.deleted'))
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || t('common.error'))
    }
  }

  const columns = [
    { key: 'name', label: t('category.name') },
    { key: 'description', label: t('medicine.description') },
    {
      key: 'created_at', label: t('audit.createdAt'),
      render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'
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
          <h1 className="text-2xl font-bold">{t('category.title')}</h1>
          <p className="text-gray-500 mt-1">{t('category.subtitle')}</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true) }}>
          <Plus className="h-4 w-4 mr-2" /> {t('category.newItem')}
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('category.editTitle') : t('category.newTitle')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('category.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('medicine.description')}</label>
            <textarea
              className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 mt-1"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{editing ? t('common.save') : t('common.add')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
