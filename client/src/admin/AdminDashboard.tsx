import { useState, useEffect, useMemo } from 'react'
import { API_BASE_URL } from '../config'
import { getMassAlert } from '../utils/massAlert'
import type { Church } from '../data/churches'

type RegionFilter = 'all' | Church['region']
type ChurchEditForm = Omit<Church, 'massSchedule'> & { massScheduleText: string }

const regionOptions: { value: RegionFilter; label: string }[] = [
  { value: 'all', label: 'ทุกภาค' },
  { value: 'bangkok', label: 'กรุงเทพฯ' },
  { value: 'north', label: 'ภาคเหนือ' },
  { value: 'central', label: 'ภาคกลาง' },
  { value: 'south', label: 'ภาคใต้' },
]

function getRegionLabel(region: Church['region']) {
  return regionOptions.find((option) => option.value === region)?.label ?? region
}

function serializeMassSchedule(church: Church) {
  return church.massSchedule
    .map((row) => `${row.day}: ${row.times.map((entry) => typeof entry === 'string' ? entry : entry.time).join(', ')}`)
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
      const day = item.slice(0, separatorIndex).trim()
      const times = item.slice(separatorIndex + 1).split(',').map((time) => time.trim()).filter(Boolean)
      return day && times.length ? { day, times } : null
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
}

export default function AdminDashboard() {
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
      massScheduleText: serializeMassSchedule(church),
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
      if (!response.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ผู้ดูแลระบบแล้วลองอีกครั้ง')
      const updatedChurch: Church = await response.json()
      setChurches((current) => current.map((church) => church.id === updatedChurch.id ? updatedChurch : church))
      setEditingChurch(null)
      setEditForm(null)
      setNotice(`บันทึกข้อมูล ${updatedChurch.name} เรียบร้อยแล้ว`)
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : 'เกิดข้อผิดพลาดขณะบันทึกข้อมูล')
    } finally {
      setSaving(false)
    }
  }

  const statCards = [
    { label: 'จำนวนวัดทั้งหมด', value: stats.total, accent: true },
    { label: 'กำลังมีมิสซาตอนนี้', value: stats.massNow },
    { label: 'ครอบคลุม (ภาค)', value: stats.regions },
    { label: 'ข้อมูลยังไม่ครบ', value: stats.missingPriest + stats.missingMass },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1C1C1A] mb-6">ภาพรวมข้อมูลวัด</h1>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
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
        <div className="flex flex-wrap gap-2" aria-label="กรองตามภาค">
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
                {region.label} <span className="ml-1 opacity-75">{loading ? '—' : count}</span>
              </button>
            )
          })}
        </div>
        <label className="sr-only" htmlFor="church-search">ค้นหาชื่อวัด</label>
        <input
          id="church-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหาชื่อวัด..."
          className="px-3 py-2 text-sm border border-[#DDD9D0] rounded-md w-56"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        { !loading && filteredChurches.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#8A8780]">ไม่พบวัดในภาคหรือคำค้นหานี้</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F8F6F2] text-[#8A8780]">
              <tr>
                <th className="text-left px-6 py-3 font-medium">ชื่อวัด</th>
                <th className="text-left px-6 py-3 font-medium">ภาค</th>
                <th className="text-left px-6 py-3 font-medium">เขต/อำเภอ</th>
                <th className="text-left px-6 py-3 font-medium">คุณพ่อเจ้าอาวาส</th>
                <th className="text-left px-6 py-3 font-medium">ตารางมิสซา</th>
                <th className="text-left px-6 py-3 font-medium">สถานะข้อมูล</th>
                <th className="text-left px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredChurches.map((church) => {
                const complete = church.priest && church.massSchedule?.length && church.imageUrl
                return (
                  <tr key={church.id} className="border-t border-[#DDD9D0]">
                    <td className="px-6 py-4 font-medium text-[#1C1C1A]">{church.name}</td>
                    <td className="px-6 py-4 text-[#1C1C1A]">{getRegionLabel(church.region)}</td>
                    <td className="px-6 py-4 text-[#1C1C1A]">{church.district}</td>
                    <td className="px-6 py-4 text-[#1C1C1A]">
                      {church.priest || <span className="text-red-500">ยังไม่มีข้อมูล</span>}
                    </td>
                    <td className="px-6 py-4 text-[#1C1C1A]">
                      {church.massSchedule?.length
                        ? `${church.massSchedule.length} วัน`
                        : <span className="text-red-500">ยังไม่มีข้อมูล</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        complete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {complete ? 'ข้อมูลครบ' : 'ข้อมูลไม่ครบ'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openEditor(church)}
                        className="text-[#6B2737] font-medium hover:underline whitespace-nowrap"
                      >
                        แก้ไขข้อมูล
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
              <h2 id="edit-church-title" className="text-lg font-semibold text-[#1C1C1A]">แก้ไขข้อมูลวัด</h2>
              <button type="button" onClick={closeEditor} aria-label="ปิดหน้าต่าง" className="px-2 py-1 text-xl text-[#6B2737]" disabled={saving}>×</button>
            </header>
            <form onSubmit={saveChurch} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">ชื่อวัด (ไทย)
                <input required value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">ชื่อวัด (English)
                <input required value={editForm.nameEn} onChange={(event) => setEditForm({ ...editForm, nameEn: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">ภาค
                <select value={editForm.region} onChange={(event) => setEditForm({ ...editForm, region: event.target.value as Church['region'] })} className="rounded border border-[#DDD9D0] px-3 py-2">
                  {regionOptions.filter((region) => region.value !== 'all').map((region) => <option key={region.value} value={region.value}>{region.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">เขต/อำเภอ
                <input required value={editForm.district} onChange={(event) => setEditForm({ ...editForm, district: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">จังหวัด
                <input value={editForm.province ?? ''} onChange={(event) => setEditForm({ ...editForm, province: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">คุณพ่อเจ้าอาวาส
                <input value={editForm.priest} onChange={(event) => setEditForm({ ...editForm, priest: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945] sm:col-span-2">ที่อยู่
                <input required value={editForm.address} onChange={(event) => setEditForm({ ...editForm, address: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945] sm:col-span-2">URL รูปภาพ
                <input type="url" value={editForm.imageUrl ?? ''} onChange={(event) => setEditForm({ ...editForm, imageUrl: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">ละติจูด
                <input type="number" step="any" required value={editForm.lat} onChange={(event) => setEditForm({ ...editForm, lat: Number(event.target.value) })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945]">ลองจิจูด
                <input type="number" step="any" required value={editForm.lng} onChange={(event) => setEditForm({ ...editForm, lng: Number(event.target.value) })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945] sm:col-span-2">ตารางมิสซา
                <textarea rows={3} value={editForm.massScheduleText} onChange={(event) => setEditForm({ ...editForm, massScheduleText: event.target.value })} placeholder="จันทร์ - เสาร์: 06:00, 18:00; อาทิตย์: 07:00, 09:00" className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4B4945] sm:col-span-2">เวลาเปิด-ปิด
                <input value={editForm.openHours} onChange={(event) => setEditForm({ ...editForm, openHours: event.target.value })} className="rounded border border-[#DDD9D0] px-3 py-2" />
              </label>
              {editError && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{editError}</p>}
              <div className="flex justify-end gap-3 sm:col-span-2">
                <button type="button" onClick={closeEditor} disabled={saving} className="rounded border border-[#DDD9D0] px-4 py-2 text-sm">ยกเลิก</button>
                <button type="submit" disabled={saving} className="rounded bg-[#6B2737] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}