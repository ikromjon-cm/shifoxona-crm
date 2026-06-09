import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Pill, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login: loginUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!login || !password) {
      toast.error('Login va parolni kiriting')
      return
    }
    setLoading(true)
    try {
      await loginUser(login, password)
      toast.success('Muvaffaqiyatli tizimga kirdingiz')
      navigate('/')
    } catch (error) {
      const msg = error.response?.data?.detail || 'Login yoki parol noto\'g\'ri'
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
          <CardTitle className="text-2xl">Shifoxona CRM</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Farmatsevtika mahsulotlarini boshqarish tizimi
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Login"
              type="text"
              placeholder="Loginni kiriting"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
            <div className="relative">
              <Input
                label="Parol"
                type={showPassword ? 'text' : 'password'}
                placeholder="Parolni kiriting"
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
            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Kirish
            </Button>
          </form>
          <p className="text-center mt-4 text-sm text-gray-500">
            Hisobingiz yo'qmi?{' '}
            <Link to="/register" className="text-medical-500 hover:underline font-medium">
              Ro'yxatdan o'tish
            </Link>
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link to="/pharmacy/login" className="text-sm text-gray-500 hover:text-medical-600 hover:underline">
              Dorixona hisobingiz bormi? Kirish
            </Link>
            <span className="mx-2 text-gray-300">|</span>
            <Link to="/pharmacy/register" className="text-sm text-gray-500 hover:text-medical-600 hover:underline">
              Ro'yxatdan o'tish
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
