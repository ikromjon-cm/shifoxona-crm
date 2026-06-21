import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Pill } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    login: '',
    password: '',
    position: '',
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.phone || !form.login || !form.password) {
      toast.error(t('register.errorRequired'))
      return
    }
    setLoading(true)
    try {
      await register(form)
      toast.success(t('register.success'))
      navigate('/')
    } catch (error) {
      const msg = error.response?.data?.detail || t('register.error')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-medical-500 flex items-center justify-center">
            <Pill className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('register.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label={t('register.firstName')} name="first_name" placeholder={t('register.firstNamePlaceholder')} value={form.first_name} onChange={handleChange} />
              <Input label={t('register.lastName')} name="last_name" placeholder={t('register.lastNamePlaceholder')} value={form.last_name} onChange={handleChange} />
            </div>
            <Input label={t('register.phone')} name="phone" placeholder="+998901234567" value={form.phone} onChange={handleChange} />
            <Input label={t('login.login')} name="login" placeholder={t('register.loginPlaceholder')} value={form.login} onChange={handleChange} />
            <Input label={t('login.password')} name="password" type="password" placeholder={t('register.passwordPlaceholder')} value={form.password} onChange={handleChange} />
            <Input label={t('register.position')} name="position" placeholder={t('register.positionPlaceholder')} value={form.position} onChange={handleChange} />
            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              {t('register.submit')}
            </Button>
          </form>
          <p className="text-center mt-4 text-sm text-gray-500">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="text-medical-500 hover:underline font-medium">
              {t('login.signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
