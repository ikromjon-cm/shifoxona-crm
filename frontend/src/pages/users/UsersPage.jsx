import { useState, useEffect } from 'react'
import { usersAPI } from '@/services/api'
import { DataTable } from '@/components/ui/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Plus, Ban, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ login: '', password: '', first_name: '', last_name: '', phone: '', role: 'operator', position: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await usersAPI.list()
      setData(res.data.results || res.data)
    } catch (err) {
      toast.error('Foydalanuvchilarni yuklashda xatolik')
    } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await usersAPI.create(form)
      toast.success('Foydalanuvchi qo\'shildi')
      setShowModal(false)
      setForm({ login: '', password: '', first_name: '', last_name: '', phone: '', role: 'operator', position: '' })
      fetchData()
    } catch (err) {
      const msg = err.response?.data
      if (msg && typeof msg === 'object') {
        toast.error(Object.values(msg).flat().join('; ') || 'Xatolik')
      } else {
        toast.error('Xatolik yuz berdi')
      }
    }
  }

  const handleBlock = async (id) => {
    try {
      await usersAPI.block(id)
      toast.success('Bloklandi')
      fetchData()
    } catch (err) { toast.error(err.response?.data?.detail || 'Xatolik') }
  }

  const handleUnblock = async (id) => {
    try {
      await usersAPI.unblock(id)
      toast.success('Blokdan chiqarildi')
      fetchData()
    } catch (err) { toast.error(err.response?.data?.detail || 'Xatolik') }
  }

  const roleOptions = [
    { value: 'operator', label: 'Operator' },
    { value: 'superadmin', label: 'Super Admin' },
  ]

  const columns = [
    { key: 'first_name', label: 'Ism' },
    { key: 'last_name', label: 'Familiya' },
    { key: 'login', label: 'Login' },
    { key: 'phone', label: 'Telefon' },
    { key: 'role', label: 'Lavozim', render: (r) => <Badge variant={r.role === 'superadmin' ? 'info' : 'default'}>{r.role === 'superadmin' ? 'Super Admin' : 'Operator'}</Badge> },
    { key: 'is_active', label: 'Holat', render: (r) => r.is_blocked ? <Badge variant="danger">Bloklangan</Badge> : <Badge variant="success">Faol</Badge> },
    { key: 'created_at', label: 'Qo\'shilgan', render: (r) => new Date(r.created_at).toLocaleDateString() },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex gap-2">
          {row.is_blocked ? (
            <Button variant="ghost" size="sm" onClick={() => handleUnblock(row.id)}>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => handleBlock(row.id)}>
              <Ban className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
          <p className="text-gray-500 mt-1">Foydalanuvchilarni boshqarish</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-2" /> Yangi foydalanuvchi</Button>
      </div>
      <Card><CardContent className="p-6">
        <DataTable columns={columns} data={data} loading={loading} />
      </CardContent></Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Yangi foydalanuvchi" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ism" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            <Input label="Familiya" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
          <Input label="Login" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required />
          <Input label="Parol" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Input label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Select label="Lavozim" options={roleOptions} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Input label="Lavozim (qo'shimcha)" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Bekor qilish</Button>
            <Button type="submit">Qo'shish</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
