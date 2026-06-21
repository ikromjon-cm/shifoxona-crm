import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { rbacAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Plus, Edit, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RolesPage() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', permissions: [] })

  useEffect(() => { fetchRoles(); fetchPermissions() }, [])

  const fetchRoles = async () => {
    try { const res = await rbacAPI.roles.list(); setRoles(res.data.results || res.data) }
    catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const fetchPermissions = async () => {
    try { const res = await rbacAPI.permissions.list(); setPermissions(res.data.results || res.data) }
    catch {}
  }

  const groupedPermissions = permissions.reduce((acc, p) => {
    const model = p.model_name || p.content_type || 'other'
    if (!acc[model]) acc[model] = []
    acc[model].push(p)
    return acc
  }, {})

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) { await rbacAPI.roles.update(editing.id, form); toast.success(t('common.updated')) }
      else { await rbacAPI.roles.create(form); toast.success(t('common.created')) }
      setShowModal(false); setEditing(null); fetchRoles()
    } catch (err) { toast.error(err.response?.data?.error || t('common.error')) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirmDelete'))) return
    try { await rbacAPI.roles.delete(id); toast.success(t('common.deleted')); fetchRoles() }
    catch { toast.error(t('common.error')) }
  }

  const togglePermission = (permId) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId],
    }))
  }

  const columns = [
    { key: 'name', label: t('roles.name') },
    { key: 'description', label: t('roles.description') },
    { key: 'user_count', label: t('roles.users'), render: (r) => r.user_count ?? '-' },
    { key: 'permission_count', label: t('roles.permissions'), render: (r) => r.permissions?.length || 0 },
    {
      key: 'is_system', label: t('roles.system'),
      render: (r) => r.is_system ? <Badge variant="info">{t('roles.system')}</Badge> : <Badge variant="default">{t('roles.custom')}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setEditing(row); setForm({ name: row.name, description: row.description || '', permissions: row.permissions || [] }); setShowModal(true) }} disabled={row.is_system}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} disabled={row.is_system}>
            <XCircle className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('roles.title')}</h1>
          <p className="text-gray-500 mt-1">{t('roles.desc')}</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: '', description: '', permissions: [] }); setShowModal(true) }}>
          <Plus className="h-4 w-4 mr-2" /> {t('roles.new')}
        </Button>
      </div>

      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={roles} loading={loading} emptyMessage={t('roles.noRoles')} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('roles.edit') : t('roles.new')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('roles.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('roles.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('roles.permissions')}</label>
            <div className="mt-2 max-h-80 overflow-y-auto space-y-3 border rounded-xl p-4">
              {Object.entries(groupedPermissions).map(([model, perms]) => (
                <div key={model}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{model}</h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePermission(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          form.permissions.includes(p.id)
                            ? 'bg-medical-500 text-white border-medical-500'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-medical-300'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
