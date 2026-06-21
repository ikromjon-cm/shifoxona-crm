import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { tasksAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Plus, Play, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

const TASK_TYPES = [
  { value: 'order_picking' },
  { value: 'delivery' },
  { value: 'inventory' },
  { value: 'receiving' },
  { value: 'quality_check' },
  { value: 'maintenance' },
  { value: 'cleaning' },
  { value: 'other' },
]

const PRIORITIES = [
  { value: 'urgent', color: 'danger' },
  { value: 'high', color: 'warning' },
  { value: 'medium', color: 'info' },
  { value: 'low', color: 'default' },
]

const TYPE_LABELS = {
  order_picking: 'task.typeOrderPicking',
  delivery: 'task.typeDelivery',
  inventory: 'task.typeInventory',
  receiving: 'task.typeReceiving',
  quality_check: 'task.typeQualityCheck',
  maintenance: 'task.typeMaintenance',
  cleaning: 'task.typeCleaning',
  other: 'task.typeOther',
}

const STATUS_LABELS = {
  pending: 'task.pending',
  in_progress: 'task.inProgress',
  completed: 'task.completed',
  cancelled: 'task.cancelled',
}

const PRIORITY_LABELS = {
  urgent: 'task.urgent',
  high: 'task.high',
  medium: 'task.medium',
  low: 'task.low',
}

const priorityColors = { urgent: 'danger', high: 'warning', medium: 'info', low: 'default' }
const statusColors = { pending: 'warning', in_progress: 'info', completed: 'success', cancelled: 'danger' }

export default function TasksPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', task_type: 'other', priority: 'medium',
    assigned_to: '', due_date: '', order: '',
  })

  useEffect(() => { fetchTasks(); fetchStats() }, [])

  const fetchTasks = async () => {
    try {
      const res = await tasksAPI.list()
      setTasks(res.data.results || res.data)
    } catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const fetchStats = async () => {
    try {
      const res = await tasksAPI.stats()
      setStats(res.data)
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (payload.assigned_to) payload.assigned_to = Number(payload.assigned_to)
      if (payload.order) payload.order = Number(payload.order)
      else delete payload.order
      if (!payload.due_date) delete payload.due_date
      await tasksAPI.create(payload)
      toast.success(t('task.created'))
      setShowModal(false)
      setForm({ title: '', description: '', task_type: 'other', priority: 'medium', assigned_to: '', due_date: '', order: '' })
      fetchTasks()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xatolik')
    }
  }

  const handleStart = async (id) => {
    try {
      await tasksAPI.start(id)
      toast.success(t('task.started'))
      fetchTasks()
    } catch { toast.error(t('common.error')) }
  }

  const handleComplete = async (id) => {
    try {
      await tasksAPI.complete(id)
      toast.success(t('task.completed'))
      fetchTasks()
    } catch { toast.error(t('common.error')) }
  }

  const handleCancel = async (id) => {
    if (!confirm(t('task.cancelConfirm'))) return
    try {
      await tasksAPI.cancel(id)
      toast.success(t('task.cancelled'))
      fetchTasks()
    } catch { toast.error(t('common.error')) }
  }

  const columns = [
    { key: 'title', label: t('task.title') },
    {
      key: 'task_type', label: t('task.type'),
      render: (r) => <Badge variant="default">{t(TYPE_LABELS[r.task_type] || 'task.typeOther')}</Badge>,
    },
    {
      key: 'priority', label: t('task.priority'),
      render: (r) => <Badge variant={priorityColors[r.priority] || 'default'}>{t(PRIORITY_LABELS[r.priority] || 'task.medium')}</Badge>,
    },
    {
      key: 'status', label: t('task.status'),
      render: (r) => <Badge variant={statusColors[r.status] || 'default'}>{t(STATUS_LABELS[r.status] || 'task.pending')}</Badge>,
    },
    { key: 'assigned_to_name', label: t('task.assignedTo') },
    { key: 'due_date', label: t('task.dueDate'), render: (r) => r.due_date ? formatDateTime(r.due_date) : '-' },
    { key: 'created_at', label: t('audit.createdAt'), render: (r) => formatDateTime(r.created_at) },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-1">
          {row.status === 'pending' && <Button variant="ghost" size="sm" onClick={() => handleStart(row.id)} title={t('task.start')}><Play className="h-4 w-4 text-green-500" /></Button>}
          {row.status === 'in_progress' && <Button variant="ghost" size="sm" onClick={() => handleComplete(row.id)} title={t('task.done')}><CheckCircle className="h-4 w-4 text-emerald-500" /></Button>}
          {['pending', 'in_progress'].includes(row.status) && <Button variant="ghost" size="sm" onClick={() => handleCancel(row.id)} title={t('task.cancel')}><XCircle className="h-4 w-4 text-red-500" /></Button>}
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${row.id}`)} title={t('pharmacy.details')}><MessageSquare className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('task.list')}</h1>
          <p className="text-gray-500 mt-1">{t('task.management')}</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> {t('task.add')}</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total || 0}</p><p className="text-xs text-gray-500">{t('common.total')}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-500">{stats.pending || 0}</p><p className="text-xs text-gray-500">{t('task.pending')}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-500">{stats.in_progress || 0}</p><p className="text-xs text-gray-500">{t('task.inProgress')}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-500">{stats.completed || 0}</p><p className="text-xs text-gray-500">{t('task.completed')}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-500">{stats.overdue || 0}</p><p className="text-xs text-gray-500">{t('task.overdue')}</p></CardContent></Card>
        </div>
      )}

      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={tasks} loading={loading} searchable onRowClick={(r) => navigate(`/tasks/${r.id}`)} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('task.add')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('task.title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('task.description')}</label>
            <textarea className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-medical-500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('task.type')} options={TASK_TYPES.map(taskType => ({ value: taskType.value, label: t(TYPE_LABELS[taskType.value]) }))} value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })} />
            <Select label={t('task.priority')} options={PRIORITIES.map(pri => ({ value: pri.value, label: t(PRIORITY_LABELS[pri.value]) }))} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          </div>
          <Input label={t('task.dueDate')} type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('task.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
