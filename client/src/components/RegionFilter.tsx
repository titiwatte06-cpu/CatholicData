// src/components/RegionFilter.tsx
import type { Region } from '../data/churches'

const regionLabels: Record<Region, { th: string; en: string }> = {
  'bangkok': { th: 'อัครสังฆมณฑลกรุงเทพฯ', en: 'Archdiocese of Bangkok' },
  'tharae-nongsaeng': { th: 'อัครสังฆมณฑลท่าแร่-หนองแสง', en: 'Archdiocese of Thare-Nongsaeng' },
  'chiang-mai': { th: 'สังฆมณฑลเชียงใหม่', en: 'Diocese of Chiang Mai' },
  'nakhon-sawan': { th: 'สังฆมณฑลนครสวรรค์', en: 'Diocese of Nakhon Sawan' },
  'ratchaburi': { th: 'สังฆมณฑลราชบุรี', en: 'Diocese of Ratchaburi' },
  'nakhon-ratchasima': { th: 'สังฆมณฑลนครราชสีมา', en: 'Diocese of Nakhon Ratchasima' },
  'ubon-ratchathani': { th: 'สังฆมณฑลอุบลราชธานี', en: 'Diocese of Ubon Ratchathani' },
  'udon-thani': { th: 'สังฆมณฑลอุดรธานี', en: 'Diocese of Udon Thani' },
  'chanthaburi': { th: 'สังฆมณฑลจันทบุรี', en: 'Diocese of Chanthaburi' },
  'surat-thani': { th: 'สังฆมณฑลสุราษฎร์ธานี', en: 'Diocese of Surat Thani' },
  'chiang-rai': { th: 'สังฆมณฑลเชียงราย', en: 'Diocese of Chiang Rai' },
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