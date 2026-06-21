import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { tasksAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Send, Paperclip, Play, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

const TYPE_LABELS = { order_picking: 'task.typeOrderPicking', delivery: 'task.typeDelivery', inventory: 'task.typeInventory', receiving: 'task.typeReceiving', quality_check: 'task.typeQualityCheck', maintenance: 'task.typeMaintenance', cleaning: 'task.typeCleaning', other: 'task.typeOther' }
const PRIORITY_LABELS = { urgent: 'task.urgent', high: 'task.high', medium: 'task.medium', low: 'task.low' }
const STATUS_LABELS = { pending: 'task.pending', in_progress: 'task.inProgress', completed: 'task.completed', cancelled: 'task.cancelled' }

export default function TaskDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')

  useEffect(() => { fetchTask() }, [id])

  const fetchTask = async () => {
    try {
      const res = await tasksAPI.get(id)
      setTask(res.data)
    } catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const handleStart = async () => {
    await tasksAPI.start(id); toast.success(t('task.started')); fetchTask()
  }
  const handleComplete = async () => {
    await tasksAPI.complete(id); toast.success(t('task.completed')); fetchTask()
  }
  const handleCancel = async () => {
    if (!confirm(t('task.cancelConfirm'))) return
    await tasksAPI.cancel(id); toast.success(t('task.cancelled')); fetchTask()
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    try {
      await tasksAPI.comment(id, { text: comment })
      setComment('')
      fetchTask()
    } catch { toast.error(t('common.error')) }
  }

  const handleUpload = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    const formData = new FormData()
    formData.append('file', f)
    try {
      await tasksAPI.upload(id, formData)
      toast.success(t('task.fileUploaded'))
      fetchTask()
    } catch { toast.error(t('common.error')) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500" /></div>
  if (!task) return <p className="text-center text-gray-500 py-20">{t('task.notFound')}</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/tasks')} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> {t('task.list')}
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge>{t(TYPE_LABELS[task.task_type] || 'task.typeOther')}</Badge>
                <Badge variant={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : task.priority === 'medium' ? 'info' : 'default'}>{t(PRIORITY_LABELS[task.priority] || 'task.medium')}</Badge>
                <Badge variant={task.status === 'completed' ? 'success' : task.status === 'cancelled' ? 'danger' : task.status === 'in_progress' ? 'info' : 'warning'}>{t(STATUS_LABELS[task.status] || 'task.pending')}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {task.status === 'pending' && <Button size="sm" onClick={handleStart}><Play className="h-4 w-4 mr-1" /> {t('task.start')}</Button>}
              {task.status === 'in_progress' && <Button size="sm" variant="primary" onClick={handleComplete}><CheckCircle className="h-4 w-4 mr-1" /> {t('task.done')}</Button>}
              {['pending', 'in_progress'].includes(task.status) && <Button size="sm" variant="outline" onClick={handleCancel}><XCircle className="h-4 w-4 mr-1" /> {t('task.cancel')}</Button>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && <div><p className="text-sm text-gray-500">{t('task.description')}</p><p className="mt-1">{task.description}</p></div>}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">{t('task.assignedTo')}:</span> <span className="font-medium">{task.assigned_to_name || t('common.notAssigned')}</span></div>
            <div><span className="text-gray-500">{t('task.dueDate')}:</span> <span className="font-medium">{task.due_date ? formatDateTime(task.due_date) : t('common.notAssigned')}</span></div>
            <div><span className="text-gray-500">{t('audit.createdAt')}:</span> <span className="font-medium">{formatDateTime(task.created_at)}</span></div>
            {task.completed_at && <div><span className="text-gray-500">{t('task.completedAt')}:</span> <span className="font-medium">{formatDateTime(task.completed_at)}</span></div>}
          </div>

          {/* Attachments */}
          {task.attachments?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">{t('task.files')} ({task.attachments.length})</h3>
              <div className="flex flex-wrap gap-2">
                {task.attachments.map((att) => (
                  <a key={att.id} href={att.file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm hover:bg-gray-100">
                    <Paperclip className="h-3 w-3" /> {att.file_name || t('common.file')}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Upload file */}
          {['pending', 'in_progress'].includes(task.status) && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('task.uploadFile')}</label>
              <input type="file" onChange={handleUpload} className="text-sm mt-1" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader><CardTitle className="text-lg">{t('task.comments')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleComment} className="flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('task.commentPlaceholder')} className="flex-1" />
            <Button type="submit" disabled={!comment.trim()}><Send className="h-4 w-4" /></Button>
          </form>
          {task.comments?.length > 0 ? (
            task.comments.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{c.author_name || t('common.user')}</span>
                  <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">{t('task.noComments')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
