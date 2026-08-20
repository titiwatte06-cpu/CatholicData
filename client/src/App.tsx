import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { churches, type Church } from './data/churches'

const mapCenter: L.LatLngExpression = [13.7563, 100.5018]

function MapView({ selectedId, onSelect }: { selectedId?: string; onSelect: (id: string) => void }) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapElement.current) return
    const map = L.map(mapElement.current, { zoomControl: false }).setView(mapCenter, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    churches.forEach((church) => {
      const marker = L.marker([church.lat, church.lng]).addTo(map)
      marker.bindTooltip(church.name, { direction: 'top', offset: [0, -12] })
      marker.on('click', () => onSelect(church.id))
    })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [onSelect])

  useEffect(() => {
    const church = churches.find((item) => item.id === selectedId)
    if (church && mapRef.current) mapRef.current.flyTo([church.lat, church.lng], 15, { duration: 0.8 })
  }, [selectedId])

  return <div ref={mapElement} className="map" aria-label="แผนที่วัดคาทอลิกในกรุงเทพฯ" />
}

function ChurchCard({ church, active }: { church: Church; active: boolean }) {
  return <Link className={`church-card${active ? ' active' : ''}`} to={`/church/${church.id}`}>
    <span className="card-pin">+</span><span className="card-body"><strong>{church.name}</strong><small>{church.district}</small></span>
  </Link>
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className="detail-block"><div className="detail-label">{label}</div><div className="detail-value">{children}</div></div>
}

function ChurchDetail({ church }: { church: Church }) {
  return <section className="detail">
    <Link className="back-btn" to="/">← กลับไปยังรายการวัด</Link>
    <h2>{church.name}</h2><p className="detail-en">{church.nameEn}</p><span className="district">{church.district}</span>
    <InfoBlock label="เวลาเปิด-ปิดวัด">{church.openHours}</InfoBlock>
    <InfoBlock label="ตารางมิสซ"><table><tbody>{church.massSchedule.map((row) => <tr key={row.day}><th>{row.day}</th><td>{row.times.join(' · ')} น.</td></tr>)}</tbody></table></InfoBlock>
    <InfoBlock label="คุณพ่อเจ้าอาวาส">{church.priest}</InfoBlock><InfoBlock label="ที่อยู่">{church.address}</InfoBlock>
    <a className="nav-btn" href={`https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lng}`} target="_blank" rel="noreferrer">↗ นำทางด้วย Google Maps</a>
  </section>
}

function AppLayout() {
  const { churchId } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const selectedChurch = churches.find((church) => church.id === churchId)
  const filteredChurches = churches.filter((church) => `${church.name} ${church.nameEn} ${church.district}`.toLowerCase().includes(query.toLowerCase()))
  const selectChurch = useCallback((id: string) => navigate(`/church/${id}`), [navigate])

  return <div className="app-shell">
    <aside className="sheet"><header className="sheet-header"><div className="brand"><span className="brand-mark">✚</span><div><h1>วัดคาทอลิกกรุงเทพฯ</h1><p>แผนที่ & ตารางมิสซา</p></div></div></header>
      {!selectedChurch && <div className="search-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อวัด เช่น อัสสัมชัญ" aria-label="ค้นหาวัด" /></div>}
      <div className="panel-scroll">{selectedChurch ? <ChurchDetail church={selectedChurch} /> : <div className="church-list">{filteredChurches.length ? filteredChurches.map((church) => <ChurchCard key={church.id} church={church} active={false} />) : <p className="no-results">ไม่พบวัดที่ค้นหา</p>}</div>}</div>
    </aside><main className="map-wrap"><MapView selectedId={churchId} onSelect={selectChurch} /></main>
  </div>
}

function App() {
  return <BrowserRouter><Routes><Route path="/" element={<AppLayout />} /><Route path="/church/:churchId" element={<AppLayout />} /><Route path="*" element={<AppLayout />} /></Routes></BrowserRouter>
}

export default App