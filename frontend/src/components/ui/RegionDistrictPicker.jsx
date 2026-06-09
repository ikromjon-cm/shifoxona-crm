import { REGIONS, DISTRICTS } from '@/data/uzbekistan'

export default function RegionDistrictPicker({ region, district, onRegionChange, onDistrictChange, regionLabel = 'Viloyat', districtLabel = 'Tuman' }) {
  const regionOptions = [{ value: '', label: 'Viloyatni tanlang' }, ...REGIONS.map(r => ({ value: r.value, label: r.label }))]
  const districtOptions = [{ value: '', label: region ? 'Tumanni tanlang' : 'Avval viloyat tanlang' }, ...(region ? (DISTRICTS[region] || []).map(d => ({ value: d.value, label: d.label })) : [])]

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 space-y-1">
        {regionLabel && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{regionLabel}</label>}
        <select
          value={region}
          onChange={(e) => {
            onRegionChange(e.target.value)
            onDistrictChange('')
          }}
          className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
        >
          {regionOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 space-y-1">
        {districtLabel && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{districtLabel}</label>}
        <select
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!region}
          className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {districtOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
