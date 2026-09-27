// src/components/RegionFilter.tsx
import type { Region } from '../data/churches'

const regionLabels: Record<Region, { th: string; en: string }> = {
  bangkok: { th: 'กรุงเทพปริมณฑล', en: 'Bangkok Metro' },
  north: { th: 'ภาคเหนือ', en: 'North' },
  central: { th: 'ภาคกลาง', en: 'Central' },
  south: { th: 'ภาคใต้', en: 'South' },
}

export function RegionFilter({
  selected,
  onToggle,
  onReset,
  lang,
}: {
  selected: Set<Region>
  onToggle: (region: Region) => void
  onReset: () => void
  lang: 'th' | 'en'
}) {
  return (
    <div className="region-filter">
      <button
        type="button"
        className={`region-chip region-chip-all ${selected.size === 0 ? 'is-active' : ''}`}
        onClick={onReset}
        aria-pressed={selected.size === 0}
      >
        {lang === 'th' ? 'ทุกภาค' : 'All regions'}
      </button>
      {(Object.keys(regionLabels) as Region[]).map((region) => (
        <button
          key={region}
          type="button"
          className={`region-chip ${selected.has(region) ? 'is-active' : ''}`}
          onClick={() => onToggle(region)}
          aria-pressed={selected.has(region)}
        >
          {regionLabels[region][lang]}
        </button>
      ))}
    </div>
  )
}