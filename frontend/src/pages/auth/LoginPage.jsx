import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Pill, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login: loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!login || !password) {
      toast.error(t('login.error'))
      return
    }
    setLoading(true)
    try {
      await loginUser(login, password)
      toast.success(t('login.success'))
      navigate('/')
    } catch (error) {
      const data = error.response?.data
      toast.error(data?.detail || data?.message || t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 via-white to-brand-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-500 to-brand-500 shadow-xl shadow-medical-500/20 mb-4">
            <Pill className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('login.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('login.subtitle')}</p>
        </div>

        <Card className="shadow-xl border-0 glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-lg">{t('login.signIn')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('login.login')}
                placeholder={t('login.loginPlaceholder')}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />

              <div className="relative">
                <Input
                  label={t('login.password')}
                  placeholder={t('login.passwordPlaceholder')}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full" isLoading={loading}>
                {t('login.signIn')}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-gray-500">{t('login.noAccount')}</span>{' '}
              <Link to="/register" className="text-medical-500 hover:text-medical-600 font-medium">
                {t('login.register')}
              </Link>
            </div>

            <div className="text-center text-sm">
              <Link to="/pharmacy/login" className="text-brand-500 hover:text-brand-600 font-medium">
                {t('login.pharmacyLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
