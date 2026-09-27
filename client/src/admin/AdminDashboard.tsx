import { useState, useEffect, useMemo } from 'react'
import { API_BASE_URL } from '../config'
import { getMassAlert } from '../utils/massAlert'
import { getDistrictLabel, type Church } from '../data/churches'
import { useLanguage } from '../LanguageContext'

type RegionFilter = 'all' | Church['region']
type ChurchEditForm = Omit<Church, 'massSchedule'> & { massScheduleText: string }

const regionOptions: { value: RegionFilter; label: { th: string; en: string } }[] = [
  { value: 'all', label: { th: 'ทุกภาค', en: 'All regions' } },
  { value: 'bangkok', label: { th: 'กรุงเทพฯ', en: 'Bangkok' } },
  { value: 'north', label: { th: 'ภาคเหนือ', en: 'North' } },
  { value: 'central', label: { th: 'ภาคกลาง', en: 'Central' } },
  { value: 'south', label: { th: 'ภาคใต้', en: 'South' } },
]

const massDayLabels: Record<string, string> = {
  'จันทร์': 'Monday',
  'อังคาร': 'Tuesday',
  'พุธ': 'Wednesday',
  'พฤหัสบดี': 'Thursday',
  'ศุกร์': 'Friday',
  'เสาร์': 'Saturday',
  'อาทิตย์': 'Sunday',
}

function getRegionLabel(region: Church['region'], lang: 'th' | 'en') {
  return regionOptions.find((option) => option.value === region)?.label[lang] ?? region
}

function localizeMassDay(day: string, lang: 'th' | 'en') {
  if (lang === 'th') return day
  return Object.entries(massDayLabels).reduce((value, [thai, english]) => value.replaceAll(thai, english), day)
}

function serializeMassSchedule(church: Church, lang: 'th' | 'en') {
  return church.massSchedule
    .map((row) => `${localizeMassDay(row.day, lang)}: ${row.times.map((entry) => typeof entry === 'string' ? entry : entry.time).join(', ')}`)
    .join('; ')
}

function parseMassSchedule(value: string): Church['massSchedule'] {
  return value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separatorIndex = item.indexOf(':')
      if (separatorIndex < 0) return null
      const day = item.slice(0, separatorIndex).trim().split(' - ').map((part) => {
        const thaiDay = Object.entries(massDayLabels).find(([, english]) => english === part)?.[0]
        return thaiDay ?? part
      }).join(' - ')
      const times = item.slice(separatorIndex + 1).split(',').map((time) => time.trim()).filter(Boolean)
      return day && times.length ? { day, times } : null
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
}

export default function AdminDashboard() {
  const { lang } = useLanguage()
  const text = lang === 'th' ? {
    title: 'ภาพรวมข้อมูลวัด',
    total: 'จำนวนวัดทั้งหมด',
    massNow: 'กำลังมีมิสซาตอนนี้',
    regions: 'ครอบคลุม (ภาค)',
    incomplete: 'ข้อมูลยังไม่ครบ',
    loadError: 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    saveError: 'บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ผู้ดูแลระบบแล้วลองอีกครั้ง',
    saveUnknownError: 'เกิดข้อผิดพลาดขณะบันทึกข้อมูล',
    saved: 'บันทึกข้อมูลเรียบร้อยแล้ว',
    filterLabel: 'กรองตามภาค',
    search: 'ค้นหาชื่อวัด...',
    noResults: 'ไม่พบวัดในภาคหรือคำค้นหานี้',
    church: 'ชื่อวัด', region: 'ภาค', district: 'เขต/อำเภอ', priest: 'คุณพ่อเจ้าอาวาส',
    schedule: 'ตารางมิสซา', status: 'สถานะข้อมูล', action: 'แก้ไขข้อมูล',
    missing: 'ยังไม่มีข้อมูล', complete: 'ข้อมูลครบ', incompleteStatus: 'ข้อมูลไม่ครบ', days: 'วัน',
    editTitle: 'แก้ไขข้อมูลวัด', close: 'ปิดหน้าต่าง', churchThai: 'ชื่อวัด (ไทย)',
    churchEnglish: 'ชื่อวัด (English)', province: 'จังหวัด', address: 'ที่อยู่', image: 'URL รูปภาพ',
    latitude: 'ละติจูด', longitude: 'ลองจิจูด', openHours: 'เวลาเปิด-ปิด', cancel: 'ยกเลิก',
    saving: 'กำลังบันทึก...', save: 'บันทึกข้อมูล', massPlaceholder: 'จันทร์ - เสาร์: 06:00, 18:00; อาทิตย์: 07:00, 09:00',
  } : {
    title: 'Church Dashboard',
    total: 'Total churches',
    massNow: 'Mass happening now',
    regions: 'Regions covered',
    incomplete: 'Incomplete records',
    loadError: 'Could not load church data. Please try again.',
    saveError: 'Could not save changes. Check your admin access and try again.',
    saveUnknownError: 'An error occurred while saving changes.',
    saved: 'Changes saved successfully.',
    filterLabel: 'Filter by region',
    search: 'Search churches...',
    noResults: 'No churches match this region or search.',
    church: 'Church', region: 'Region', district: 'District', priest: 'Parish priest',
    schedule: 'Mass schedule', status: 'Data status', action: 'Edit',
    missing: 'Not provided', complete: 'Complete', incompleteStatus: 'Incomplete', days: 'days',
    editTitle: 'Edit church details', close: 'Close dialog', churchThai: 'Church name (Thai)',
    churchEnglish: 'Church name (English)', province: 'Province', address: 'Address', image: 'Image URL',
    latitude: 'Latitude', longitude: 'Longitude', openHours: 'Opening hours', cancel: 'Cancel',
    saving: 'Saving...', save: 'Save changes', massPlaceholder: 'Monday - Saturday: 06:00, 18:00; Sunday: 07:00, 09:00',
  }
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('all')
  const [editingChurch, setEditingChurch] = useState<Church | null>(null)
  const [editForm, setEditForm] = useState<ChurchEditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/churches`)
        if (!res.ok) throw new Error('failed')
        const data: Church[] = await res.json()
        setChurches(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchChurches()
  }, [])

  const now = useMemo(() => new Date(), [])

  const stats = useMemo(() => {
    const massNow = churches.filter((c) => getMassAlert(c, now).active).length
    const missingPriest = churches.filter((c) => !c.priest).length
    const missingMass = churches.filter((c) => !c.massSchedule?.length).length
    const regions = new Set(churches.map((c) => c.region)).size
    return { total: churches.length, massNow, missingPriest, missingMass, regions }
  }, [churches, now])

  const filteredChurches = churches.filter((church) => {
    const matchesQuery = `${church.name} ${church.nameEn} ${church.district} ${church.province ?? ''}`
      .toLowerCase()
      .includes(query.toLowerCase())
    return matchesQuery && (selectedRegion === 'all' || church.region === selectedRegion)
  })

  const openEditor = (church: Church) => {
    setEditingChurch(church)
    setEditForm({
      ...church,
      massScheduleText: serializeMassSchedule(church, lang),
    })
    setEditError('')
    setNotice('')
  }

  const closeEditor = () => {
    if (saving) return
    setEditingChurch(null)
    setEditForm(null)
    setEditError('')
  }

  const saveChurch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingChurch || !editForm) return
    setSaving(true)
    setEditError('')
    const updatedFields = {
      name: editForm.name,
      nameEn: editForm.nameEn,
      district: editForm.district,
      province: editForm.province,
      region: editForm.region,
      address: editForm.address,
      imageUrl: editForm.imageUrl || undefined,
      lat: Number(editForm.lat),
      lng: Number(editForm.lng),
      priest: editForm.priest,
      openHours: editForm.openHours,
      massSchedule: parseMassSchedule(editForm.massScheduleText),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/churches/${editingChurch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedFields),
      })
      if (!response.ok) throw new Error(text.saveError)
      const updatedChurch: Church = await response.json()
      setChurches((current) => current.map((church) => church.id === updatedChurch.id ? updatedChurch : church))
      setEditingChurch(null)
      setEditForm(null)
      setNotice(`${lang === 'th' ? `บันทึกข้อมูล ${updatedChurch.name} เรียบร้อยแล้ว` : `${updatedChurch.nameEn || updatedChurch.name} ${text.saved}`}`)
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : text.saveUnknownError)
    } finally {
      setSaving(false)
    }
  }

  const statCards = [
    { label: text.total, value: stats.total, accent: true },
    { label: text.massNow, value: stats.massNow },
    { label: text.regions, value: stats.regions },
    { label: text.incomplete, value: stats.missingPriest + stats.missingMass },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1C1C1A] mb-6">{text.title}</h1>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {text.loadError}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-[#8A8780]">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.accent ? 'text-[#6B2737]' : 'text-[#1C1C1A]'}`}>
              {loading ? '—' : card.value}
            </p>
          </div>
        ))}
      </div>

      {notice && (
        <div role="status" className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {notice}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" aria-label={text.filterLabel}>
          {regionOptions.map((region) => {
            const count = region.value === 'all'
              ? churches.length
              : churches.filter((church) => church.region === region.value).length
            return (
              <button
                key={region.value}
                type="button"
                onClick={() => setSelectedRegion(region.value)}
                aria-pressed={selectedRegion === region.value}
                className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                  selectedRegion === region.value
                    ? 'bg-[#6B2737] border-[#6B2737] text-white'
                    : 'bg-white border-[#DDD9D0] text-[#4B4945] hover:bg-[#F8F6F2]'
                }`}
              >
                {region.label[lang]} <span className="ml-1 opacity-75">{loading ? '—' : count}</span>
              </button>
            )
          })}
        </div>
        <label className="sr-only" htmlFor="church-search">{text.search}</label>
        <input
          id="church-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={text.search}
          className="px-3 py-2 text-sm border border-[#DDD9D0] rounded-md w-56"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        { !loading && filteredChurches.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#8A8780]">{text.noResults}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F8F6F2] text-[#8A8780]">
              <tr>
                <th className="text-left px-6 py-3 font-medium">{text.church}</th>
                <th className="text-left px-6 py-3 font-medium">{text.region}</th>
                <th className="text-left px-6 py-3 font-medium">{text.district}</th>
                <th className="text-left px-6 py-3 font-medium">{text.priest}</th>
                <th className="text-left px-6 py-3 font-medium">{text.schedule}</th>
                <th className="text-left px-6 py-3 font-medium">{text.status}</th>
                <th className="text-left px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredChurches.map((church) => {
                const complete = church.priest && church.massSchedule?.length && church.imageUrl
                const priest = lang === 'en' ? church.priestEn || church.priest : church.priest
                const displayedPriest = !priest || priest === 'ยังไม่มีข้อมูล' ? text.missing : priest
                return (
                  <tr key={church.id} className="border-t border-[#DDD9D0]">
                    <td className="px-6 py-4 font-medium text-[#1C1C1A]">{lang === 'en' ? church.nameEn || church.name : church.name}</td>
                    <td className="px-6 py-4 text-[#1C1C1A]">{getRegionLabel(church.region, lang)}</td>
                    <td className="px-6 py-4 text-[#1C1C1A]">{getDistrictLabel(church.district, lang)}</td>
                    <td className="px-6 py-4 text-[#1C1C1A]">
                      {displayedPriest === text.missing
                        ? <span className="text-red-500">{text.missing}</span>
                        : displayedPriest}
                    </td>
                    <td className="px-6 py-4 text-[#1C1C1A]">
                      {church.massSchedule?.length
                        ? `${church.massSchedule.length} ${text.days}`
                        : <span className="text-red-500">{text.missing}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        complete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {complete ? text.complete : text.incompleteStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openEditor(church)}
                        className="text-[#6B2737] font-medium hover:underline whitespace-nowrap"
                      >
                        {text.action}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {editingChurch && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-church-title"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DDD9D0] bg-white px-6 py-4">
              <h2 id="edit-church-title" className="text-lg font-semibold text-[#1C1C1A]">{text.editTitle}</h2>
              <button type="button" onClick={closeEditor} aria-label={text.close} className="px-2 py-1 text-xl text-[#6B2737]" disabled={saving}>×</button>
            </header>
            <form onSubmit={saveChurch} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">{text.churchThai}
                <input required value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">{text.churchEnglish}
                <input required value={editForm.nameEn} onChange={(event) => setEditForm({ ...editForm, nameEn: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">{text.region}
                <select value={editForm.region} onChange={(event) => setEditForm({ ...editForm, region: event.target.value as Church['region'] })} className="rounded border border-[#DDD9D0] px-3 py-2">
                  {regionOptions.filter((region) => region.value !== 'all').map((region) => <option key={region.value} value={region.value}>{region.label[lang]}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">{text.district}
                <input required value={editForm.district} onChange={(event) => setEditForm({ ...editForm, district: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">{text.province}
                <input value={editForm.province ?? ''} onChange={(event) => setEditForm({ ...editForm, province: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">{text.priest}
                <input value={editForm.priest === 'ยังไม่มีข้อมูล' ? '' : editForm.priest} onChange={(event) => setEditForm({ ...editForm, priest: event.target.value })} placeholder={text.missing} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945] sm:col-span-2">{text.address}
                <input required value={editForm.address} onChange={(event) => setEditForm({ ...editForm, address: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945] sm:col-span-2">{text.image}
                <input type="url" value={editForm.imageUrl ?? ''} onChange={(event) => setEditForm({ ...editForm, imageUrl: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">{text.latitude}
                <input type="number" step="any" required value={editForm.lat} onChange={(event) => setEditForm({ ...editForm, lat: Number(event.target.value) })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">{text.longitude}
                <input type="number" step="any" required value={editForm.lng} onChange={(event) => setEditForm({ ...editForm, lng: Number(event.target.value) })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945] sm:col-span-2">{text.schedule}
                <textarea rows={3} value={editForm.massScheduleText} onChange={(event) => setEditForm({ ...editForm, massScheduleText: event.target.value })} placeholder={text.massPlaceholder} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945] sm:col-span-2">{text.openHours}
                <input value={editForm.openHours} onChange={(event) => setEditForm({ ...editForm, openHours: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              {editError && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{editError}</p>}
              <div className="flex justify-end gap-3 sm:col-span-2">
                <button type="button" onClick={closeEditor} disabled={saving} className="rounded border border-[#DDD9D0] px-4 py-2 text-sm">{text.cancel}</button>
                <button type="submit" disabled={saving} className="rounded bg-[#6B2737] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {saving ? text.saving : text.save}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}