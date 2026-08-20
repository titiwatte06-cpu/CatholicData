import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { churches, type Church } from './data/churches'

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

function HomePage() {
  return <main className="home-page"><section className="hero-menu"><p className="eyebrow">ขอเชิญทุกท่าน</p><h1>วัดคาทอลิก</h1><p className="hero-subtitle">“จงตามเรามา แล้วเราจะทำให้ท่านเป็นชาวประมงหามนุษย์”<br />ยินดีต้อนรับสู่บ้านหลังนี้ของทุกคน</p><div className="gold-rule" /><nav className="menu-windows" aria-label="เมนูหลัก">{menuItems.map((item) => <Link className="menu-window" key={item.to} to={item.to} aria-label={item.title}><span className="window-frame"><span className="window-finial" /><MenuIcon>{item.icon}</MenuIcon><span className="window-label"><strong>{item.title}</strong><small>{item.english}</small></span></span></Link>)}</nav><Link className="map-entry" to="/map">ดูแผนที่และตารางมิสซา <span aria-hidden="true">↗</span></Link></section></main>
}

function MapView({ onSelect }: { onSelect: (id: string) => void }) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  useEffect(() => {
    if (!mapElement.current) return
    const map = L.map(mapElement.current, { zoomControl: false }).setView(mapCenter, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    churches.forEach((church) => { const marker = L.marker([church.lat, church.lng]).addTo(map); marker.bindTooltip(church.name, { direction: 'top', offset: [0, -12] }); marker.on('click', () => onSelect(church.id)) })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [onSelect])
  return <div ref={mapElement} className="map" aria-label="แผนที่วัดคาทอลิกในกรุงเทพฯ" />
}

function ChurchCard({ church }: { church: Church }) {
  return <Link className="church-card" to={`/map/church/${church.id}`}><span className="card-pin">+</span><span className="card-body"><strong>{church.name}</strong><small>{church.district}</small></span></Link>
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className="detail-block"><div className="detail-label">{label}</div><div className="detail-value">{children}</div></div>
}

function ChurchDetail({ church }: { church: Church }) {
  return <section className="detail"><Link className="back-btn" to="/map">← กลับไปยังรายการวัด</Link><h2>{church.name}</h2><p className="detail-en">{church.nameEn}</p><span className="district">{church.district}</span><InfoBlock label="เวลาเปิด-ปิดวัด">{church.openHours}</InfoBlock><InfoBlock label="ตารางมิสซ"><table><tbody>{church.massSchedule.map((row) => <tr key={row.day}><th>{row.day}</th><td>{row.times.join(' · ')} น.</td></tr>)}</tbody></table></InfoBlock><InfoBlock label="คุณพ่อเจ้าอาวาส">{church.priest}</InfoBlock><InfoBlock label="ที่อยู่">{church.address}</InfoBlock><a className="nav-btn" href={`https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lng}`} target="_blank" rel="noreferrer">↗ นำทางด้วย Google Maps</a></section>
}

function MapPage() {
  const { churchId } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const selectedChurch = churches.find((church) => church.id === churchId)
  const filteredChurches = churches.filter((church) => `${church.name} ${church.nameEn} ${church.district}`.toLowerCase().includes(query.toLowerCase()))
  const selectChurch = useCallback((id: string) => navigate(`/map/church/${id}`), [navigate])
  return <div className="map-page"><header className="map-header"><Link to="/" className="map-brand"><span>✚</span><strong>วัดคาทอลิก</strong></Link><Link to="/" className="map-home-link">หน้าแรก</Link></header><div className="map-layout"><aside className="map-sidebar"><h1>วัดคาทอลิกกรุงเทพฯ</h1>{!selectedChurch && <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อวัด" aria-label="ค้นหาวัด" />}{selectedChurch ? <ChurchDetail church={selectedChurch} /> : <div className="church-list">{filteredChurches.length ? filteredChurches.map((church) => <ChurchCard key={church.id} church={church} />) : <p className="no-results">ไม่พบวัดที่ค้นหา</p>}</div>}</aside><main className="map-wrap"><MapView onSelect={selectChurch} /></main></div></div>
}

function ContentPage({ title, english }: { title: string; english: string }) {
  return <main className="content-page"><Link to="/" className="content-back">← กลับหน้าแรก</Link><p className="eyebrow">{english}</p><h1>{title}</h1><p>หน้านี้เตรียมไว้สำหรับข้อมูลในหมวดนี้ และสามารถเติมเนื้อหาต่อได้ในอนาคต</p></main>
}

function App() {
  return <BrowserRouter><Routes><Route path="/" element={<HomePage />} /><Route path="/map" element={<MapPage />} /><Route path="/map/church/:churchId" element={<MapPage />} /><Route path="/sermons" element={<ContentPage title="บทเทศน์" english="Sermons" />} /><Route path="/about" element={<ContentPage title="เกี่ยวกับเรา" english="About Us" />} /><Route path="/news" element={<ContentPage title="ข่าว & กิจกรรม" english="News & Events" />} /><Route path="/contact" element={<ContentPage title="ติดต่อเรา" english="Contact" />} /><Route path="*" element={<HomePage />} /></Routes></BrowserRouter>
}

export default App
