import Select from './Select'
import { REGIONS, DISTRICTS } from '@/data/uzbekistan'

export default function RegionDistrictPicker({ region, district, onRegionChange, onDistrictChange, regionLabel = 'Viloyat', districtLabel = 'Tuman' }) {
  const regionOptions = REGIONS.map(r => ({ value: r.value, label: r.label }))
  const districtOptions = region ? (DISTRICTS[region] || []).map(d => ({ value: d.value, label: d.label })) : []

  return (
    <div className="grid grid-cols-2 gap-3">
      <Select
        label={regionLabel}
        value={region}
        onChange={(e) => {
          onRegionChange(e.target.value)
          onDistrictChange('')
        }}
        options={regionOptions}
        placeholder="Viloyatni tanlang"
      />
      <Select
        label={districtLabel}
        value={district}
        onChange={(e) => onDistrictChange(e.target.value)}
        options={districtOptions}
        placeholder={region ? 'Tumanni tanlang' : 'Avval viloyat tanlang'}
        disabled={!region}
      />
    </div>
  )
}
