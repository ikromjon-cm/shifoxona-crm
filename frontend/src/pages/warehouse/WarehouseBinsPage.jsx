import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { warehouseAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Plus, Edit, XCircle, Printer, QrCode, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import * as Tabs from '@radix-ui/react-tabs'

export default function WarehouseBinsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('zones')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('warehouse.bins')}</h1>
        <p className="text-gray-500 mt-1">{t('warehouse.binsDesc')}</p>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
          {[
            { value: 'zones', label: t('warehouse.zones'), icon: Layers },
            { value: 'bins', label: t('warehouse.bins'), icon: QrCode },
          ].map(tab => (
            <Tabs.Trigger key={tab.value} value={tab.value} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <tab.icon className="h-4 w-4" /> {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="zones"><ZonesTab /></Tabs.Content>
        <Tabs.Content value="bins"><BinsTab /></Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

function ZonesTab() {
  const { t } = useTranslation()
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })

  useEffect(() => { fetchZones() }, [])

  const fetchZones = async () => {
    try { const res = await warehouseAPI.zones.list(); setZones(res.data.results || res.data) }
    catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) { await warehouseAPI.zones.update(editing.id, form); toast.success(t('common.updated')) }
      else { await warehouseAPI.zones.create(form); toast.success(t('common.added')) }
      setShowModal(false); setEditing(null); fetchZones()
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik') }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirmDelete'))) return
    try { await warehouseAPI.zones.delete(id); toast.success(t('common.deleted')); fetchZones() }
    catch { toast.error(t('common.error')) }
  }

  const columns = [
    { key: 'name', label: t('medicine.name') },
    { key: 'code', label: t('warehouse.code') },
    { key: 'description', label: t('task.description') },
    { key: 'rack_count', label: t('warehouse.racks'), render: (r) => r.rack_count ?? '-' },
    { key: 'bin_count', label: t('warehouse.bins'), render: (r) => r.bin_count ?? '-' },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setEditing(row); setForm({ name: row.name, code: row.code, description: row.description || '' }); setShowModal(true) }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><XCircle className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditing(null); setForm({ name: '', code: '', description: '' }); setShowModal(true) }}><Plus className="h-4 w-4 mr-2" /> {t('warehouse.newZone')}</Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={zones} loading={loading} emptyMessage={t('warehouse.noZones')} />
      </CardContent></Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('warehouse.editZone') : t('warehouse.newZone')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('medicine.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('warehouse.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label={t('task.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function BinsTab() {
  const { t } = useTranslation()
  const [bins, setBins] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ zone: '', code: '', shelf: '', row: '', column: '', barcode: '' })

  useEffect(() => { fetchBins(); fetchZones() }, [])

  const fetchBins = async () => {
    try { const res = await warehouseAPI.bins.list(); setBins(res.data.results || res.data) }
    catch { toast.error(t('common.error')) }
    finally { setLoading(false) }
  }

  const fetchZones = async () => {
    try { const res = await warehouseAPI.zones.list(); setZones(res.data.results || res.data) }
    catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, zone: Number(form.zone) || null }
      if (!payload.zone) delete payload.zone
      if (editing) { await warehouseAPI.bins.update(editing.id, payload); toast.success(t('common.updated')) }
      else { await warehouseAPI.bins.create(payload); toast.success(t('common.added')) }
      setShowModal(false); setEditing(null); fetchBins()
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik') }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirmDelete'))) return
    try { await warehouseAPI.bins.delete(id); toast.success(t('common.deleted')); fetchBins() }
    catch { toast.error(t('common.error')) }
  }

  const handlePrintLabel = async (id) => {
    try {
      const res = await warehouseAPI.bins.label(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch { toast.error(t('common.error')) }
  }

  const zoneOptions = zones.map(z => ({ value: z.id, label: `${z.name} (${z.code})` }))

  const columns = [
    { key: 'code', label: t('warehouse.binCode') },
    { key: 'zone_name', label: t('warehouse.zone') },
    { key: 'shelf', label: t('warehouse.shelf') },
    { key: 'barcode', label: t('medicine.barcode') },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handlePrintLabel(row.id)} title={t('warehouse.printLabel')}><Printer className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(row); setForm({ zone: row.zone || '', code: row.code, shelf: row.shelf || '', row: row.row || '', column: row.column || '', barcode: row.barcode || '' }); setShowModal(true) }}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><XCircle className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditing(null); setForm({ zone: '', code: '', shelf: '', row: '', column: '', barcode: '' }); setShowModal(true) }}><Plus className="h-4 w-4 mr-2" /> {t('warehouse.newBin')}</Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={bins} loading={loading} searchable emptyMessage={t('warehouse.noBins')} />
      </CardContent></Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('warehouse.editBin') : t('warehouse.newBin')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('warehouse.binCode')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder={t('warehouse.binCodePlaceholder')} />
          <Select label={t('warehouse.zone')} options={zoneOptions} value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder={t('warehouse.selectZone')} />
          <Input label={t('warehouse.shelf')} value={form.shelf} onChange={(e) => setForm({ ...form, shelf: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('warehouse.row')} value={form.row} onChange={(e) => setForm({ ...form, row: e.target.value })} />
            <Input label={t('warehouse.column')} value={form.column} onChange={(e) => setForm({ ...form, column: e.target.value })} />
          </div>
          <Input label={t('medicine.barcode')} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
