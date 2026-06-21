import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { pharmaciesAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Store } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PharmacyLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ login: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await pharmaciesAPI.login(form)
      const { tokens, user } = res.data
      localStorage.setItem('accessToken', tokens.access)
      localStorage.setItem('refreshToken', tokens.refresh)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      toast.success(t('pharmacy.welcome'))
      navigate('/pharmacy/dashboard')
    } catch (err) {
      const d = err.response?.data
      toast.error(d?.non_field_errors?.[0] || d?.detail || t('login.error'))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-medical-500 flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{t('pharmacy.login')}</h1>
          <p className="text-gray-500 mt-1">{t('pharmacy.loginTitle')}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('login.login')} value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required />
            <Input label={t('login.password')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Button type="submit" className="w-full" isLoading={loading}>{t('login.signIn')}</Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('pharmacy.noAccount')}{' '}
          <Link to="/pharmacy/register" className="text-medical-600 hover:underline">{t('pharmacy.register')}</Link>
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          <Link to="/login" className="hover:underline">{t('pharmacy.adminLogin')}</Link>
        </p>
      </div>
    </div>
  )
}
