import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { pharmaciesAPI } from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LocationPicker from '@/components/ui/LocationPicker'
import RegionDistrictPicker from '@/components/ui/RegionDistrictPicker'
import { Store } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm = {
  name: '', stir_or_license: '', responsible_person: '',
  phone: '', login: '', password: '', password_confirm: '',
  region: '', district: '', address: '',
  latitude: null, longitude: null,
}

export default function PharmacyRegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ ...defaultForm })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleLocationSelect = ({ lat, lng }) => {
    update('latitude', lat)
    update('longitude', lng)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== '') fd.append(key, value)
      })
      if (form.imageFile) fd.append('image', form.imageFile)
      await pharmaciesAPI.register(fd)
      toast.success(t('pharmacy.registerSuccess'))
      navigate('/pharmacy/login')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data)
          .filter(([, v]) => Array.isArray(v) || typeof v === 'string')
          .map(([, v]) => (Array.isArray(v) ? v.join(', ') : v))
          .join('; ')
        toast.error(msgs || t('common.error'))
      } else {
        toast.error(t('common.error'))
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-medical-500 flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{t('pharmacy.register')}</h1>
          <p className="text-gray-500 mt-1">{t('pharmacy.registerSubtitle')}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-medical-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>{s}</div>
                <div className={`h-0.5 flex-1 ${step > s ? 'bg-medical-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <Input label={t('pharmacy.name')} value={form.name} onChange={(e) => update('name', e.target.value)} required />
                <Input label={t('pharmacy.stirLicense')} value={form.stir_or_license} onChange={(e) => update('stir_or_license', e.target.value)} required />
                <Input label={t('pharmacy.responsible')} value={form.responsible_person} onChange={(e) => update('responsible_person', e.target.value)} required />
                <Input label={t('pharmacy.phone')} type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={() => setStep(2)}>{t('common.next')}</Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Input label={t('login.login')} value={form.login} onChange={(e) => update('login', e.target.value)} required />
                <Input label={t('login.password')} type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
                <Input label={t('login.passwordConfirm')} type="password" value={form.password_confirm} onChange={(e) => update('password_confirm', e.target.value)} required />
                <RegionDistrictPicker
                  region={form.region}
                  district={form.district}
                  onRegionChange={(v) => update('region', v)}
                  onDistrictChange={(v) => update('district', v)}
                />
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('pharmacy.fullAddress')}</label>
                  <textarea className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500" value={form.address} onChange={(e) => update('address', e.target.value)} required />
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" type="button" onClick={() => setStep(1)}>{t('common.back')}</Button>
                  <Button type="button" onClick={() => setStep(3)}>{t('common.next')}</Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {t('pharmacy.location')}
                  </label>
                  <LocationPicker
                    position={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('pharmacy.image')}</label>
                  <input type="file" accept="image/*" className="text-sm" onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      update('imageFile', file)
                      const reader = new FileReader()
                      reader.onload = () => update('image', reader.result.split(',')[1])
                      reader.readAsDataURL(file)
                    }
                  }} />
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" type="button" onClick={() => setStep(2)}>{t('common.back')}</Button>
                  <Button type="submit" isLoading={loading}>{t('pharmacy.register')}</Button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('pharmacy.hasAccount')}{' '}
          <Link to="/pharmacy/login" className="text-medical-600 hover:underline">{t('pharmacy.login')}</Link>
        </p>
      </div>
    </div>
  )
}
