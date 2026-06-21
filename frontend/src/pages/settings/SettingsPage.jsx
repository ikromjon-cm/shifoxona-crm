import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Key } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error(t('settings.passwordMismatch'))
      return
    }
    if (passwordForm.new_password.length < 8) {
      toast.error(t('settings.passwordLengthError'))
      return
    }
    setLoading(true)
    try {
      await authAPI.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      })
      toast.success(t('settings.passwordChanged'))
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      const data = err.response?.data
      let msg = t('common.error')
      if (typeof data === 'string') {
        msg = data
      } else if (data?.error) {
        msg = data.error
      } else if (data?.detail) {
        msg = data.detail
      } else if (data?.non_field_errors) {
        msg = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors
      } else if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0]
        const firstVal = data[firstKey]
        if (Array.isArray(firstVal)) msg = firstVal[0]
        else if (typeof firstVal === 'string') msg = firstVal
      }
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.desc')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> {t('settings.changePassword')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
            <Input
              label={t('settings.oldPassword')}
              type="password"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              required
            />
            <Input
              label={t('settings.newPassword')}
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              required
            />
            <Input
              label={t('settings.confirmPassword')}
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              required
            />
            <Button type="submit" isLoading={loading}>{t('settings.savePassword')}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
