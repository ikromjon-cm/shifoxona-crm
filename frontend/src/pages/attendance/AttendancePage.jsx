import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { attendanceAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Plus, Clock, MapPin, CheckCircle, XCircle, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime, formatDate } from '@/lib/utils'
import * as Tabs from '@radix-ui/react-tabs'

const SHIFT_TYPES = (t) => [
  { value: 'morning', label: t('attendance.shiftMorning') },
  { value: 'afternoon', label: t('attendance.shiftAfternoon') },
  { value: 'night', label: t('attendance.shiftNight') },
  { value: 'custom', label: t('attendance.custom') },
]

export default function AttendancePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('records')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('attendance.title')}</h1>
        <p className="text-gray-500 mt-1">{t('attendance.desc')}</p>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
          {[
            { value: 'records', label: t('attendance.attendance'), icon: Clock },
            { value: 'shifts', label: t('attendance.shifts'), icon: Calendar },
            { value: 'geofences', label: t('attendance.geofences'), icon: MapPin },
            { value: 'leaves', label: t('attendance.leaves'), icon: Calendar },
          ].map(tabItem => (
            <Tabs.Trigger key={tabItem.value} value={tabItem.value} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <tabItem.icon className="h-4 w-4" /> {tabItem.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="shifts"><ShiftsTab /></Tabs.Content>
        <Tabs.Content value="geofences"><GeofencesTab /></Tabs.Content>
        <Tabs.Content value="records"><RecordsTab /></Tabs.Content>
        <Tabs.Content value="leaves"><LeavesTab /></Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

function ShiftsTab() {
  const { t } = useTranslation()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', shift_type: 'morning', start_time: '08:00', end_time: '16:00', weekdays: [] })

  useEffect(() => { fetchShifts() }, [])

  const fetchShifts = async () => {
    try { const res = await attendanceAPI.shifts.list(); setShifts(res.data.results || res.data) }
    catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await attendanceAPI.shifts.update(editing.id, form)
        toast.success(t('common.updated'))
      } else {
        await attendanceAPI.shifts.create(form)
        toast.success(t('common.added'))
      }
      setShowModal(false); setEditing(null); fetchShifts()
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik') }
  }

  const handleEdit = (shift) => {
    setEditing(shift)
    setForm({ name: shift.name, shift_type: shift.shift_type, start_time: shift.start_time, end_time: shift.end_time, weekdays: shift.weekdays || [] })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirmDelete'))) return
    try { await attendanceAPI.shifts.delete(id); toast.success(t('common.deleted')); fetchShifts() }
    catch { toast.error(t('common.error')) }
  }

  const shiftTypes = SHIFT_TYPES(t)
  const columns = [
    { key: 'name', label: t('attendance.shiftName') },
    { key: 'shift_type', label: t('task.type'), render: (r) => <Badge>{shiftTypes.find(s => s.value === r.shift_type)?.label || r.shift_type}</Badge> },
    { key: 'start_time', label: t('attendance.startTime') },
    { key: 'end_time', label: t('attendance.endTime') },
    { key: 'weekdays', label: t('attendance.workDays'), render: (r) => (r.weekdays || []).map(d => ['Du','Se','Ch','Pa','Ju','Sh','Ya'][d]).join(', ') },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Clock className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><XCircle className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditing(null); setForm({ name: '', shift_type: 'morning', start_time: '08:00', end_time: '16:00', weekdays: [] }); setShowModal(true) }}>
          <Plus className="h-4 w-4 mr-2" /> {t('attendance.newShift')}
        </Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={shifts} loading={loading} emptyMessage={t('attendance.noShifts')} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('attendance.editShift') : t('attendance.newShift')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('attendance.shiftName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('attendance.shiftType')}</label>
            <select className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm mt-1" value={form.shift_type} onChange={(e) => setForm({ ...form, shift_type: e.target.value })}>
              {shiftTypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('attendance.startTime')} type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            <Input label={t('attendance.endTime')} type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function GeofencesTab() {
  const { t } = useTranslation()
  const [geofences, setGeofences] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', radius: 100, address: '' })

  useEffect(() => { fetchGeofences() }, [])

  const fetchGeofences = async () => {
    try { const res = await attendanceAPI.geofences.list(); setGeofences(res.data.results || res.data) }
    catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await attendanceAPI.geofences.create({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), radius: Number(form.radius) })
      toast.success(t('attendance.geofenceAdded'))
      setShowModal(false); setForm({ name: '', latitude: '', longitude: '', radius: 100, address: '' }); fetchGeofences()
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik') }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirmDelete'))) return
    try { await attendanceAPI.geofences.delete(id); toast.success(t('common.deleted')); fetchGeofences() }
    catch { toast.error(t('common.error')) }
  }

  const columns = [
    { key: 'name', label: t('medicine.name') },
    { key: 'latitude', label: t('location.latitude'), render: (r) => Number(r.latitude).toFixed(4) },
    { key: 'longitude', label: t('location.longitude'), render: (r) => Number(r.longitude).toFixed(4) },
    { key: 'radius', label: `${t('attendance.radius')} (m)` },
    { key: 'address', label: t('pharmacy.address') },
    {
      key: 'actions', label: '',
      render: (row) => <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><XCircle className="h-4 w-4 text-red-500" /></Button>,
    },
  ]

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> {t('attendance.newGeofence')}</Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={geofences} loading={loading} emptyMessage={t('attendance.noGeofences')} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('attendance.newGeofence')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('medicine.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('location.latitude')} type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
            <Input label={t('location.longitude')} type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
          </div>
          <Input label={`${t('attendance.radius')} (m)`} type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })} required />
          <Input label={t('pharmacy.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function RecordsTab() {
  const { t } = useTranslation()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRecords() }, [])

  const fetchRecords = async () => {
    try { const res = await attendanceAPI.records.list(); setRecords(res.data.results || res.data) }
    catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const columns = [
    { key: 'user_name', label: t('audit.user') },
    { key: 'check_in', label: t('attendance.checkIn'), render: (r) => r.check_in ? formatDateTime(r.check_in) : '-' },
    { key: 'check_out', label: t('attendance.checkOut'), render: (r) => r.check_out ? formatDateTime(r.check_out) : '-' },
    { key: 'method', label: t('attendance.method'), render: (r) => <Badge>{r.method || '-'}</Badge> },
    { key: 'check_in_location', label: t('attendance.checkInLocation'), render: (r) => r.check_in_latitude ? `${Number(r.check_in_latitude).toFixed(4)}, ${Number(r.check_in_longitude).toFixed(4)}` : '-' },
    { key: 'created_at', label: t('warehouse.date'), render: (r) => formatDate(r.created_at) },
  ]

  return (
    <Card><CardContent className="p-6">
      <DataTable columns={columns} data={records} loading={loading} searchable emptyMessage={t('attendance.noRecords')} />
    </CardContent></Card>
  )
}

function LeavesTab() {
  const { t } = useTranslation()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ leave_type: 'sick', start_date: '', end_date: '', reason: '' })

  useEffect(() => { fetchLeaves() }, [])

  const fetchLeaves = async () => {
    try { const res = await attendanceAPI.leaves.list(); setLeaves(res.data.results || res.data) }
    catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await attendanceAPI.leaves.create(form)
      toast.success(t('attendance.requestSent'))
      setShowModal(false); fetchLeaves()
    } catch (err) { toast.error(err.response?.data?.error || t('common.error')) }
  }

  const handleApprove = async (id) => {
    try { await attendanceAPI.leaves.approve(id); toast.success(t('attendance.leaveStatus.approved')); fetchLeaves() }
    catch { toast.error(t('common.error')) }
  }

  const handleReject = async (id) => {
    try { await attendanceAPI.leaves.reject(id); toast.success(t('attendance.leaveStatus.rejected')); fetchLeaves() }
    catch { toast.error(t('common.error')) }
  }

  const columns = [
    { key: 'user_name', label: t('audit.user') },
    { key: 'leave_type', label: t('attendance.leaveType'), render: (r) => <Badge>{r.leave_type === 'sick' ? t('attendance.sick') : r.leave_type === 'vacation' ? t('attendance.vacation') : t('attendance.personal')}</Badge> },
    { key: 'start_date', label: t('attendance.startDate'), render: (r) => formatDate(r.start_date) },
    { key: 'end_date', label: t('attendance.endDate'), render: (r) => formatDate(r.end_date) },
    { key: 'reason', label: t('warehouse.reason') },
    {
      key: 'status', label: t('medicine.status'),
      render: (r) => <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>{r.status === 'approved' ? t('attendance.leaveStatus.approved') : r.status === 'rejected' ? t('attendance.leaveStatus.rejected') : t('attendance.leaveStatus.pending')}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (row) => row.status === 'pending' ? (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleApprove(row.id)}><CheckCircle className="h-4 w-4 text-emerald-500" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleReject(row.id)}><XCircle className="h-4 w-4 text-red-500" /></Button>
        </div>
      ) : null,
    },
  ]

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> {t('attendance.newRequest')}</Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={leaves} loading={loading} emptyMessage={t('attendance.noRequests')} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('attendance.newLeaveRequest')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('attendance.leaveType')}</label>
            <select className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm mt-1" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
              <option value="sick">{t('attendance.sick')}</option>
              <option value="vacation">{t('attendance.vacation')}</option>
              <option value="personal">{t('attendance.personal')}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('attendance.startDate')} type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            <Input label={t('attendance.endDate')} type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('warehouse.reason')}</label>
            <textarea className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm mt-1" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.send')}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
