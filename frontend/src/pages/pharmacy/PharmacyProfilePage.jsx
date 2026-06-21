import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { pharmaciesAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import RegionDistrictPicker from '@/components/ui/RegionDistrictPicker'
import LocationPicker from '@/components/ui/LocationPicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Store, Save, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PharmacyProfilePage() {
  const { t } = useTranslation()
  const { user, setUser } = useAuth()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await pharmaciesAPI.getProfile()
      setForm(res.data)
    } catch (err) {
      toast.error(t('profile.error'))
    } finally {
      setLoading(false)
    }
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await pharmaciesAPI.updateProfile(form)
      setForm(res.data)
      if (setUser && user) {
        setUser({ ...user, pharmacy: res.data })
      }
      toast.success(t('profile.updated'))
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([, v]) => Array.isArray(v) ? v.join(', ') : v).join('; ')
        toast.error(msgs || t('common.error'))
      } else {
        toast.error(t('common.error'))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500" />
      </div>
    )
  }

  if (!form) {
    return <div className="text-center py-12 text-gray-500">{t('profile.notFound')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Store className="h-6 w-6 text-medical-500" />
        <h1 className="text-2xl font-bold">{t('pharmacy.profile')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('pharmacy.mainInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label={t('pharmacy.name')} value={form.name} onChange={(e) => update('name', e.target.value)} />
              <Input label={t('pharmacy.stirLicense')} value={form.stir_or_license || ''} onChange={(e) => update('stir_or_license', e.target.value)} />
              <Input label={t('pharmacy.responsible')} value={form.responsible_person || ''} onChange={(e) => update('responsible_person', e.target.value)} />
              <Input label={t('pharmacy.phone')} value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('pharmacy.address')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <RegionDistrictPicker
                region={form.region}
                district={form.district}
                onRegionChange={(v) => update('region', v)}
                onDistrictChange={(v) => update('district', v)}
              />
              <div>
                <label className="text-sm font-medium mb-1 block">{t('pharmacy.fullAddress')}</label>
                <textarea
                  className="flex h-20 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500"
                  value={form.address || ''}
                  onChange={(e) => update('address', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('pharmacy.location')}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 rounded-lg overflow-hidden mb-3">
                <LocationPicker
                  position={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
                  onLocationSelect={({ lat, lng }) => { update('latitude', lat); update('longitude', lng) }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Input label={t('supplier.latitude')} value={form.latitude || ''} onChange={(e) => update('latitude', e.target.value ? parseFloat(e.target.value) : null)} />
                <Input label={t('supplier.longitude')} value={form.longitude || ''} onChange={(e) => update('longitude', e.target.value ? parseFloat(e.target.value) : null)} />
              </div>
              {form.latitude && form.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-medical-600 hover:underline mt-2"
                >
                  <MapPin className="h-4 w-4" /> {t('pharmacy.openGoogleMaps')}
                </a>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSave} isLoading={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" /> {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
