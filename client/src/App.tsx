import { useCallback, useEffect, useRef, useState, type ReactNode, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { churches, type Church } from './data/churches'
import { useAdminAuth } from './admin/AdminAuth.tsx'
import { getMassAlert } from './utils/massAlert'

function useMinuteTick(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}


const mapCenter: L.LatLngExpression = [13.7563, 100.5018]

type MenuItem = { to: string; title: string; english: string; icon: ReactNode }

const menuItems: MenuItem[] = [
  { to: '/sermons', title: 'บทเทศน์', english: 'Sermons', icon: <path d="M20 78 50 68 80 78M50 68V34M50 38C40 32 28 32 20 37v33c8-5 20-5 30 1M50 38c10-6 22-6 30-1v33c-8-5-20-5-30 1M50 20v7m-4-3.5h8" /> },
  { to: '/about', title: 'เกี่ยวกับเรา', english: 'About Us', icon: <><path d="M50 16v10m-5-6h10M50 26 74 44H26Z" /><path d="M28 44v36h44V44M20 80h60" /><circle cx="50" cy="55" r="7" /><path d="M43 80v-5c0-4 3-7 7-7s7 3 7 7v5" /></> },
  { to: '/news', title: 'ข่าว & กิจกรรม', english: 'News & Events', icon: <><path d="M50 22v5M32 66c0-22 6-36 18-36s18 14 18 36M26 66h48" /><path d="M40 72c0 5 4 8 10 8s10-3 10-8" /></> },
  { to: '/contact', title: 'ติดต่อเรา', english: 'Contact', icon: <><rect x="20" y="32" width="60" height="42" rx="2" /><path d="m20 34 30 24 30-24M50 47v-9m-4 4h8" /></> },
]

function MenuIcon({ children }: { children: ReactNode }) {
  return <svg className="menu-icon" viewBox="0 0 100 100" fill="none" aria-hidden="true">{children}</svg>
}

export function HomePage() {
  return <main className="home-page"><section className="hero-menu"><p className="eyebrow">ขอเชิญทุกท่าน</p><h1>วัดคาทอลิก</h1><p className="hero-subtitle">“จงตามเรามา แล้วเราจะทำให้ท่านเป็นชาวประมงหามนุษย์”<br />ยินดีต้อนรับสู่บ้านหลังนี้ของทุกคน</p><div className="gold-rule" /><nav className="menu-windows" aria-label="เมนูหลัก">{menuItems.map((item) => <Link className="menu-window" key={item.to} to={item.to} aria-label={item.title}><span className="window-frame"><span className="window-finial" /><MenuIcon>{item.icon}</MenuIcon><span className="window-label"><strong>{item.title}</strong><small>{item.english}</small></span></span></Link>)}</nav><Link className="map-entry" to="/map">ดูแผนที่และตารางมิสซา <span aria-hidden="true">↗</span></Link></section></main>
}

function MapView({ onSelect, now }: { onSelect: (id: string) => void; now: Date }) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  useEffect(() => {
    if (!mapElement.current) return
    const map = L.map(mapElement.current, { zoomControl: false }).setView(mapCenter, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    churches.forEach((church) => {
      const alert = getMassAlert(church, now)
      const marker = L.marker([church.lat, church.lng], {
        icon: L.divIcon({
          className: `church-marker-icon ${alert.active ? 'is-open' : ''}`,
          html: `<span class="church-marker-pin"></span>${alert.active ? `<span class="church-marker-badge">มิสซา ${alert.time} น.</span>` : ''}`,
          iconSize: [34, 42],
          iconAnchor: [17, 42],
        }),
      }).addTo(map)
      marker.bindTooltip(church.name, { direction: 'top', offset: [0, -36] })
      marker.on('click', () => onSelect(church.id))
    })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [onSelect, now])
  return <div ref={mapElement} className="map" aria-label="แผนที่วัดคาทอลิกในกรุงเทพฯ" />
}

function ChurchCard({ church, now }: { church: Church; now: Date }) {
  const alert = getMassAlert(church, now)
  return (
    <Link className="church-card" to={`/map/church/${church.id}`}>
      <span className="card-pin">+</span>
      <span className="card-body"><strong>{church.name}</strong><small>{church.district}</small></span>
      {alert.active && <span className="church-open-badge">มิสซา {alert.time} น.</span>}
    </Link>
  )
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className="detail-block"><div className="detail-label">{label}</div><div className="detail-value">{children}</div></div>
}

function ChurchDetail({ church }: { church: Church }) {
  return <section className="detail"><Link className="back-btn" to="/map">← กลับไปยังรายการวัด</Link><h2>{church.name}</h2><p className="detail-en">{church.nameEn}</p><span className="district">{church.district}</span><InfoBlock label="เวลาเปิด-ปิดวัด">{church.openHours}</InfoBlock><InfoBlock label="ตารางมิสซ"><table><tbody>{church.massSchedule.map((row) => <tr key={row.day}><th>{row.day}</th><td>{row.times.join(' · ')} น.</td></tr>)}</tbody></table></InfoBlock><InfoBlock label="คุณพ่อเจ้าอาวาส">{church.priest}</InfoBlock><InfoBlock label="ที่อยู่">{church.address}</InfoBlock><a className="nav-btn" href={`https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lng}`} target="_blank" rel="noreferrer">↗ นำทางด้วย Google Maps</a></section>
}

/* ---------- ส่วนที่เพิ่มใหม่: Modal shell ---------- */

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="ปิดหน้าต่าง">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ---------- ส่วนที่เพิ่มใหม่: Add church modal (request หรือ direct) ---------- */

type AddChurchFormState = {
  name: string
  nameEn: string
  district: string
  address: string
  lat: string
  lng: string
  priest: string
  openHours: string
}

const emptyAddForm: AddChurchFormState = { name: '', nameEn: '', district: '', address: '', lat: '', lng: '', priest: '', openHours: '' }

function AddChurchModal({ direct, onClose }: { direct: boolean; onClose: () => void }) {
  const [form, setForm] = useState<AddChurchFormState>(emptyAddForm)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const updateField = (key: keyof AddChurchFormState) => (event: ChangeEvent<HTMLInputElement>) =>
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
      lat: Number(form.lat),
      lng: Number(form.lng),
      priest: form.priest,
      openHours: form.openHours,
      massSchedule: [],
    }
    try {
      const res = direct
        ? await fetch('/api/churches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(proposedData),
          })
        : await fetch('/api/church-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'add', proposedData, reason }),
          })
      if (!res.ok) throw new Error('request failed')
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
        <label>เวลาเปิด-ปิด
          <input value={form.openHours} onChange={updateField('openHours')} placeholder="เช่น 06:00 - 19:00 น. ทุกวัน" />
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

/* ---------- ส่วนที่เพิ่มใหม่: Delete church modal (request หรือ direct) ---------- */

function DeleteChurchModal({ direct, onClose }: { direct: boolean; onClose: () => void }) {
  const [targetId, setTargetId] = useState('')
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!targetId) return
    setStatus('saving')
    try {
      const res = direct
        ? await fetch(`/api/churches/${targetId}`, { method: 'DELETE', credentials: 'include' })
        : await fetch('/api/church-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'delete', targetChurchId: targetId, reason }),
          })
      if (!res.ok) throw new Error('request failed')
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

export function MapPage() {
  const { churchId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAdminAuth() 
  const [query, setQuery] = useState('')
  const [activeModal, setActiveModal] = useState<'add' | 'delete' | null>(null)
  const now = useMinuteTick()
  const selectedChurch = churches.find((church) => church.id === churchId)
  const filteredChurches = churches.filter((church) => `${church.name} ${church.nameEn} ${church.district}`.toLowerCase().includes(query.toLowerCase()))
  const selectChurch = useCallback((id: string) => navigate(`/map/church/${id}`), [navigate])
  return <div className="map-page">
    <header className="map-header">
    <Link to="/" className="map-brand"><span>✚</span><strong>วัดคาทอลิก</strong></Link>
    <nav className="map-header-actions">
      <Link to="/" className="map-home-link">หน้าแรก</Link>
      <Link to="/admin/login" className="map-admin-link">ผู้ดูแลระบบ</Link>
    </nav>
  </header>
    <div className="map-layout">
    <aside className="map-sidebar">
  <h1>วัดคาทอลิกกรุงเทพฯ</h1>
  {!selectedChurch && (
    <>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ค้นหาชื่อวัด"
        aria-label="ค้นหาวัด"
      />
      
        <div className="sidebar-actions">
          <button
            type="button"
            className="sidebar-action-btn sidebar-action-add"
            onClick={() => setActiveModal('add')}
          >
            <span aria-hidden="true">+</span> เพิ่มข้อมูล
          </button>
          <button
            type="button"
            className="sidebar-action-btn sidebar-action-remove"
            onClick={() => setActiveModal('delete')}
          >
            <span aria-hidden="true">−</span> ลบข้อมูล
          </button>
        </div>
      
    </>
  )}
  {selectedChurch ? (
  <ChurchDetail church={selectedChurch} />
    ) : (
      <div className="church-list">
        {filteredChurches.length ? (
          filteredChurches.map((church) => <ChurchCard key={church.id} church={church} now={now} />)
        ) : (
          <p className="no-results">ไม่พบวัดที่ค้นหา</p>
        )}
      </div>
    )}
</aside>
      <main className="map-wrap"><MapView onSelect={selectChurch} now={now} /></main></div>
    {activeModal === 'add' && <AddChurchModal direct={isAuthenticated} onClose={() => setActiveModal(null)} />}
    {activeModal === 'delete' && <DeleteChurchModal direct={isAuthenticated} onClose={() => setActiveModal(null)} />}
    </div>
}

export function ContentPage({ title, english }: { title: string; english: string }) {
  return <main className="content-page"><Link to="/" className="content-back">← กลับหน้าแรก</Link><p className="eyebrow">{english}</p><h1>{title}</h1><p>หน้านี้เตรียมไว้สำหรับข้อมูลในหมวดนี้ และสามารถเติมเนื้อหาต่อได้ในอนาคต</p></main>
}