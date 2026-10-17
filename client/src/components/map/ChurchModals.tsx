import { useEffect, useId, useState, type FormEvent, type ChangeEvent, type ReactNode } from 'react'
import type { Church } from '../../data/churches'
import { API_BASE_URL } from '../../config'
import { isSafeUrl } from '../../pages/map/mapUtils'

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section className="modal-box" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="ปิดหน้าต่าง">×</button>
        </div>
        {children}
      </section>
    </div>
  )
}

type AddChurchFormState = {
  name: string
  nameEn: string
  district: string
  address: string
  imageUrl: string
  facebookUrl: string
  lat: string
  lng: string
  priest: string
  mass: string
  sources: string
  openHours: string
}

const emptyAddForm: AddChurchFormState = { name: '', nameEn: '', district: '', address: '', imageUrl: '', facebookUrl: '', lat: '', lng: '', priest: '', mass: '', sources: '', openHours: '' }

// แปลงข้อความช่อง "ตารางมิสซา" เช่น "จันทร์ - เสาร์: 06:00, 18:00; อาทิตย์: 07:00, 09:00, 18:00"
// ให้เป็น massSchedule array ตามโครงสร้างที่ backend ต้องการ
function parseMassScheduleInput(raw: string): { day: string; times: string[] }[] {
  return raw
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const colonIndex = entry.indexOf(':')   // ⬅️ หาตำแหน่ง : ตัวแรกเท่านั้น
      if (colonIndex === -1) return { day: entry.trim(), times: [] }
      const day = entry.slice(0, colonIndex)
      const timesPart = entry.slice(colonIndex + 1)   // ⬅️ เอาทุกอย่างหลัง : ตัวแรก รวม : ที่เหลือในเวลาด้วย
      return {
        day: day.trim(),
        times: timesPart.split(',').map((t) => t.trim()).filter(Boolean),
      }
    })
    .filter((row) => row.day && row.times.length > 0)
}

function serializeMassSchedule(massSchedule: Church['massSchedule']): string {
  return massSchedule.map((row) => `${row.day}: ${row.times.join(', ')}`).join('; ')
}

type SourceItem = NonNullable<Church['sources']>[number]

// รูปแบบต่อบรรทัด: ชื่อแหล่ง | ลิงก์ | ชื่อภาษาอังกฤษ (สองช่องหลังไม่ใส่ก็ได้)
// ถ้าวางลิงก์ล้วนๆ จะใช้ลิงก์นั้นเป็นทั้งชื่อและลิงก์ / ลิงก์ที่ไม่ขึ้นต้น http(s) จะไม่ถูกเก็บ
function parseSourcesInput(raw: string): SourceItem[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [first = '', second = '', third = ''] = line.split('|').map((part) => part.trim())
      const url = isSafeUrl(first) && !second ? first : second
      return {
        label: first,
        ...(isSafeUrl(url) ? { url } : {}),
        ...(third ? { labelEn: third } : {}),
      }
    })
    .filter((source) => source.label)
}

// ต้องรวม labelEn ด้วย ไม่งั้นพอกดบันทึก ชื่อภาษาอังกฤษของทุกแหล่งจะหายไป
function serializeSources(sources: Church['sources']): string {
  return (sources ?? [])
    .map((source) => {
      const parts = [source.label, source.url ?? '', source.labelEn ?? '']
      while (parts.length > 1 && !parts[parts.length - 1]) parts.pop()   // ตัดช่องว่างท้ายบรรทัดทิ้ง
      return parts.join(' | ')
    })
    .join('\n')
}

function buildFormFromChurch(church: Church): AddChurchFormState {
  return {
    name: church.name,
    nameEn: church.nameEn,
    district: church.district,
    address: church.address,
    imageUrl: church.imageUrl ?? '',
    facebookUrl: church.facebookUrl ?? '',
    lat: String(church.lat),
    lng: String(church.lng),
    priest: church.priest,
    mass: serializeMassSchedule(church.massSchedule),
    sources: serializeSources(church.sources),
    openHours: church.openHours,
  }
}

export function AddChurchModal({ direct, onClose, onSuccess }: { direct: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState<AddChurchFormState>(emptyAddForm)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const updateField = (key: keyof AddChurchFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    const proposedData = {
      id: form.name.trim().toLowerCase().replace(/\s+/g, '-'),
      name: form.name,
      nameEn: form.nameEn,
      district: form.district,
      address: form.address,
      imageUrl: form.imageUrl || undefined,
      facebookUrl: form.facebookUrl || undefined,
      lat: Number(form.lat),
      lng: Number(form.lng),
      priest: form.priest,
      openHours: form.openHours,
      massSchedule: parseMassScheduleInput(form.mass),
      sources: parseSourcesInput(form.sources),
    }
    try {
      const res = direct
        ? await fetch(`${API_BASE_URL}/api/churches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(proposedData),
          })
        : await fetch(`${API_BASE_URL}/api/church-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'add', proposedData, reason }),
          })
      if (!res.ok) throw new Error('request failed')
      onSuccess?.()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <Modal title={direct ? 'เพิ่มข้อมูลวัด' : 'ส่งคำขอเพิ่มข้อมูลวัด'} onClose={onClose}>
        <p className="modal-success">
          {direct ? 'บันทึกข้อมูลวัดเรียบร้อยแล้ว' : 'ส่งคำขอเรียบร้อยแล้ว ขอบคุณครับ ทีมงานจะตรวจสอบและดำเนินการต่อไป'}
        </p>
        <button type="button" className="modal-primary-btn" onClick={onClose}>ปิดหน้าต่าง</button>
      </Modal>
    )
  }

  return (
    <Modal title={direct ? 'เพิ่มข้อมูลวัด' : 'ส่งคำขอเพิ่มข้อมูลวัด'} onClose={onClose}>
      <form className="church-form" onSubmit={handleSubmit}>
        {!direct && <p className="modal-hint">กรอกข้อมูลวัดที่ต้องการเสนอ ทีมงานจะตรวจสอบก่อนเผยแพร่</p>}
        <label>ชื่อวัด (ไทย)
          <input value={form.name} onChange={updateField('name')} required />
        </label>
        <label>ชื่อวัด (English)
          <input value={form.nameEn} onChange={updateField('nameEn')} required />
        </label>
        <label>เขต
          <input value={form.district} onChange={updateField('district')} required />
        </label>
        <label>ที่อยู่
          <input value={form.address} onChange={updateField('address')} required />
        </label>
        <label>URL รูปภาพวัด
          <input value={form.imageUrl} onChange={updateField('imageUrl')} type="url" placeholder="https://..." />
        </label>
        <label>ลิงก์ Facebook วัด
          <input value={form.facebookUrl} onChange={updateField('facebookUrl')} type="url" placeholder="https://www.facebook.com/..." />
        </label>
        <div className="form-row">
          <label>ละติจูด (lat)
            <input value={form.lat} onChange={updateField('lat')} inputMode="decimal" required />
          </label>
          <label>ลองจิจูด (lng)
            <input value={form.lng} onChange={updateField('lng')} inputMode="decimal" required />
          </label>
        </div>
        <label>คุณพ่อเจ้าอาวาส
          <input value={form.priest} onChange={updateField('priest')} />
        </label>
        <label>ตารางมิสซา
          <input
            value={form.mass}
            onChange={updateField('mass')}
            placeholder="จันทร์ - เสาร์: 06:00, 18:00; อาทิตย์: 07:00, 09:00, 18:00"
          />
          <small className="field-hint">คั่นแต่ละวันด้วย ; และคั่นแต่ละเวลาในวันเดียวกันด้วย , (ไม่กรอกก็ได้ ถ้ายังไม่มีข้อมูล)</small>
        </label>
        <label>เวลาเปิด-ปิด
          <input value={form.openHours} onChange={updateField('openHours')} placeholder="เช่น 06:00 - 19:00 น. ทุกวัน" />
        </label>
        <label>แหล่งข้อมูลอ้างอิง
          <textarea
            value={form.sources}
            onChange={updateField('sources')}
            rows={3}
            placeholder={'ป้ายตารางมิสซาของวัด\nสังฆมณฑลจันทบุรี | https://example.com | Diocese of Chanthaburi'}
          />
          <small className="field-hint">บรรทัดละ 1 แหล่ง รูปแบบ: ชื่อแหล่ง | ลิงก์ | ชื่อภาษาอังกฤษ (ลิงก์และชื่ออังกฤษไม่ใส่ก็ได้ ลิงก์ต้องขึ้นต้นด้วย https://)</small>
        </label>
        {!direct && (
          <label>เหตุผล / แหล่งที่มาของข้อมูล (ไม่บังคับ)
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} />
          </label>
        )}
        {status === 'error' && <p className="modal-error">เกิดข้อผิดพลาด ลองใหม่อีกครั้งครับ</p>}
        <button type="submit" className="modal-primary-btn" disabled={status === 'saving'}>
          {status === 'saving' ? 'กำลังบันทึก...' : direct ? 'บันทึกข้อมูล' : 'ส่งคำขอ'}
        </button>
      </form>
    </Modal>
  )
}

export function EditChurchModal({ direct, church, onClose, onSuccess }: { direct: boolean; church: Church; onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState<AddChurchFormState>(() => buildFormFromChurch(church))
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const updateField = (key: keyof AddChurchFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus('saving')
    const proposedData = {
      name: form.name,
      nameEn: form.nameEn,
      district: form.district,
      address: form.address,
      imageUrl: form.imageUrl || undefined,
      facebookUrl: form.facebookUrl || undefined,
      lat: Number(form.lat),
      lng: Number(form.lng),
      priest: form.priest,
      openHours: form.openHours,
      massSchedule: parseMassScheduleInput(form.mass),
      sources: parseSourcesInput(form.sources),
    }
    try {
      const res = direct
        ? await fetch(`${API_BASE_URL}/api/churches/${church.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(proposedData),
          })
        : await fetch(`${API_BASE_URL}/api/church-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'edit', targetChurchId: church.id, proposedData, reason }),
          })
      if (!res.ok) throw new Error('request failed')
      onSuccess?.()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <Modal title={direct ? 'แก้ไขข้อมูลวัด' : 'ส่งคำขอแก้ไขข้อมูลวัด'} onClose={onClose}>
        <p className="modal-success">
          {direct ? 'บันทึกการแก้ไขเรียบร้อยแล้ว' : 'ส่งคำขอแก้ไขเรียบร้อยแล้ว ขอบคุณครับ ทีมงานจะตรวจสอบและดำเนินการต่อไป'}
        </p>
        <button type="button" className="modal-primary-btn" onClick={onClose}>ปิดหน้าต่าง</button>
      </Modal>
    )
  }

  return (
    <Modal title={direct ? `แก้ไขข้อมูลวัด: ${church.name}` : `เสนอแก้ไขข้อมูลวัด: ${church.name}`} onClose={onClose}>
      <form className="church-form" onSubmit={handleSubmit}>
        {!direct && <p className="modal-hint">แก้ไขเฉพาะช่องที่ต้องการเปลี่ยน ทีมงานจะตรวจสอบก่อนนำไปปรับปรุงจริง</p>}
        <label>ชื่อวัด (ไทย)
          <input value={form.name} onChange={updateField('name')} required />
        </label>
        <label>ชื่อวัด (English)
          <input value={form.nameEn} onChange={updateField('nameEn')} required />
        </label>
        <label>เขต
          <input value={form.district} onChange={updateField('district')} required />
        </label>
        <label>ที่อยู่
          <input value={form.address} onChange={updateField('address')} required />
        </label>
        <label>URL รูปภาพวัด
          <input value={form.imageUrl} onChange={updateField('imageUrl')} type="url" placeholder="https://..." />
        </label>
        <label>ลิงก์ Facebook วัด
          <input value={form.facebookUrl} onChange={updateField('facebookUrl')} type="url" placeholder="https://www.facebook.com/..." />
        </label>
        <div className="form-row">
          <label>ละติจูด (lat)
            <input value={form.lat} onChange={updateField('lat')} inputMode="decimal" required />
          </label>
          <label>ลองจิจูด (lng)
            <input value={form.lng} onChange={updateField('lng')} inputMode="decimal" required />
          </label>
        </div>
        <label>คุณพ่อเจ้าอาวาส
          <input value={form.priest} onChange={updateField('priest')} />
        </label>
        <label>ตารางมิสซา
          <input
            value={form.mass}
            onChange={updateField('mass')}
            placeholder="จันทร์ - เสาร์: 06:00, 18:00; อาทิตย์: 07:00, 09:00, 18:00"
          />
          <small className="field-hint">คั่นแต่ละวันด้วย ; และคั่นแต่ละเวลาในวันเดียวกันด้วย ,</small>
        </label>
        <label>เวลาเปิด-ปิด
          <input value={form.openHours} onChange={updateField('openHours')} placeholder="เช่น 06:00 - 19:00 น. ทุกวัน" />
        </label>
        <label>แหล่งข้อมูลอ้างอิง
          <textarea
            value={form.sources}
            onChange={updateField('sources')}
            rows={3}
            placeholder={'ป้ายตารางมิสซาของวัด\nสังฆมณฑลจันทบุรี | https://example.com | Diocese of Chanthaburi'}
          />
          <small className="field-hint">บรรทัดละ 1 แหล่ง รูปแบบ: ชื่อแหล่ง | ลิงก์ | ชื่อภาษาอังกฤษ (ลบทั้งช่องเพื่อเอาแหล่งข้อมูลออกทั้งหมด)</small>
        </label>
        {!direct && (
          <label>เหตุผล / แหล่งที่มาของข้อมูล (ไม่บังคับ)
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} />
          </label>
        )}
        {status === 'error' && <p className="modal-error">เกิดข้อผิดพลาด ลองใหม่อีกครั้งครับ</p>}
        <button type="submit" className="modal-primary-btn" disabled={status === 'saving'}>
          {status === 'saving' ? 'กำลังบันทึก...' : direct ? 'บันทึกการแก้ไข' : 'ส่งคำขอ'}
        </button>
      </form>
    </Modal>
  )
}

export function DeleteChurchModal({ direct, churches, onClose, onSuccess }: { direct: boolean; churches: Church[]; onClose: () => void; onSuccess?: () => void }) {
  const [targetId, setTargetId] = useState('')
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!targetId) return
    setStatus('saving')
    try {
      const res = direct
        ? await fetch(`${API_BASE_URL}/api/churches/${targetId}`, { method: 'DELETE', credentials: 'include' })
        : await fetch(`${API_BASE_URL}/api/church-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'delete', targetChurchId: targetId, reason }),
          })
      if (!res.ok) throw new Error('request failed')
      onSuccess?.()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <Modal title={direct ? 'ลบข้อมูลวัด' : 'ส่งคำขอลบข้อมูลวัด'} onClose={onClose}>
        <p className="modal-success">
          {direct ? 'ลบข้อมูลวัดเรียบร้อยแล้ว' : 'ส่งคำขอเรียบร้อยแล้ว ขอบคุณครับ ทีมงานจะตรวจสอบและดำเนินการต่อไป'}
        </p>
        <button type="button" className="modal-primary-btn" onClick={onClose}>ปิดหน้าต่าง</button>
      </Modal>
    )
  }

  return (
    <Modal title={direct ? 'ลบข้อมูลวัด' : 'ส่งคำขอลบข้อมูลวัด'} onClose={onClose}>
      <form className="church-form" onSubmit={handleSubmit}>
        {!direct && <p className="modal-hint">เลือกวัดที่ต้องการเสนอให้ลบ พร้อมระบุเหตุผล ทีมงานจะตรวจสอบก่อนดำเนินการ</p>}
        <label>เลือกวัด
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)} required>
            <option value="">-- เลือกวัด --</option>
            {churches.map((church) => <option key={church.id} value={church.id}>{church.name}</option>)}
          </select>
        </label>
        <label>เหตุผล{!direct && ' (ไม่บังคับ)'}
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} required={direct} />
        </label>
        {status === 'error' && <p className="modal-error">เกิดข้อผิดพลาด ลองใหม่อีกครั้งครับ</p>}
        <button type="submit" className="modal-primary-btn" disabled={status === 'saving'}>
          {status === 'saving' ? 'กำลังบันทึก...' : direct ? 'ยืนยันการลบ' : 'ส่งคำขอ'}
        </button>
      </form>
    </Modal>
  )
}
