import { useCallback, useEffect, useRef, useState, type ReactNode, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
// ⬅️ แก้ตรงนี้ (cluster): ต้องติดตั้ง npm i leaflet.markercluster @types/leaflet.markercluster
// และต้อง import หลัง 'leaflet' เสมอ (ปลั๊กอินใช้ตัวแปร L ที่ leaflet ตั้งไว้ให้)
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import './App.css'
import logo from '../src/assets/logo.svg';

import { getDistrictLabel, getMassDayLabel, getOpenHoursLabel, type Church } from './data/churches'
import { useAdminAuth } from './admin/AdminAuth.tsx'
import { getMassAlert } from './utils/massAlert'
import { API_BASE_URL } from './config'
import { useLanguage } from './LanguageContext'
// ...existing code...
// ...existing code...
import { RegionFilter } from './components/RegionFilter'
import type { Region } from './data/churches'

const mapCenter: L.LatLngExpression = [13.7563, 100.5018]
const churchPlaceholderImage = '/church-placeholder.svg'

function useMinuteTick(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

// ⬅️ แก้ตรงนี้ (ลูกศรบนมือถือ): ตรวจว่าตอนนี้เป็นจอมือถือหรือไม่ (breakpoint เดียวกับ CSS ที่ 700px)
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}

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


const homeText = {
  th: {
    eyebrow: 'ขอเชิญทุกท่าน',
    subtitle1: '"จงตามเรามา แล้วเราจะทำให้ท่านเป็นชาวประมงมนุษย์"',
    subtitle2: 'ยินดีต้อนรับสู่บ้านหลังนี้ของทุกคน',
    ctaSolid: 'ดูตารางมิสซา',
    ctaOutline: 'เรียนรู้เพิ่มเติม',
  },
  en: {
    eyebrow: 'Welcome all',
    subtitle1: '"Follow me, and I will make you fishers of men"',
    subtitle2: "Welcome to everyone's home",
    ctaSolid: 'View Mass Schedule',
    ctaOutline: 'Learn More',
  },
}

const mapText = {
  th: {
    home: 'หน้าแรก',
    admin: 'ผู้ดูแลระบบ',
    logout: 'ออกจากระบบ',
    heading: 'วัดคาทอลิกกรุงเทพฯ',
    searchPlaceholder: 'ค้นหาชื่อวัด',
    add: '+ เพิ่มข้อมูล',
    remove: '− ลบข้อมูล',
    hint: 'การเพิ่ม/ลบข้อมูลจะถูกส่งเป็นคำขอให้ทีมงานตรวจสอบก่อน',
    loading: 'กำลังโหลดข้อมูลวัด...',
    loadError: 'โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าใหม่',
    noResults: 'ไม่พบวัดที่ค้นหา',
  },
  en: {
    home: 'Home',
    admin: 'Admin',
    logout: 'Log out',
    heading: 'Catholic Churches in Bangkok',
    searchPlaceholder: 'Search church name',
    add: '+ Add',
    remove: '− Delete',
    hint: 'Add/delete requests will be reviewed by our team before being applied.',
    loading: 'Loading churches...',
    loadError: 'Failed to load. Please refresh.',
    noResults: 'No churches found',
  },
}

// ⬅️ แก้ตรงนี้ (จุดที่ 1): เพิ่ม dictionary ใหม่สำหรับ label ในหน้า ChurchDetail
const detailText = {
  th: {
    back: '← กลับไปยังรายการวัด',
    openHours: 'เวลาเปิด-ปิดวัด',
    massSchedule: 'ตารางมิสซา',
    priest: 'คุณพ่อเจ้าอาวาส',
    address: 'ที่อยู่',
    sources: 'แหล่งข้อมูลอ้างอิง',          // ⬅️ แก้ตรงนี้ (แหล่งข้อมูล)
    noSources: 'ยังไม่ระบุแหล่งข้อมูล',      // ⬅️ แก้ตรงนี้ (แหล่งข้อมูล)
    editDirect: 'แก้ไขข้อมูล',
    editRequest: 'เสนอแก้ไขข้อมูล',
    directions: '↗ นำทางด้วย Google Maps',
    timeUnit: ' น.',
  },
  en: {
    back: '← Back to church list',
    openHours: 'Opening Hours',
    massSchedule: 'Mass Schedule',
    priest: 'Parish Priest',
    address: 'Address',
    sources: 'Sources',                        // ⬅️ แก้ตรงนี้ (แหล่งข้อมูล)
    noSources: 'No source listed yet',         // ⬅️ แก้ตรงนี้ (แหล่งข้อมูล)
    editDirect: 'Edit Information',
    editRequest: 'Suggest an Edit',
    directions: '↗ Get Directions via Google Maps',
    timeUnit: '',
  },
}

export function HomePage() {
  const { lang, toggleLang } = useLanguage()
  const t = homeText[lang]

  return (
    <main className="home-page">
      <header className="home-topbar">
        <span className="home-brand">
          <img src={logo} alt="วัดคาทอลิก" className="home-logo" />
        </span>
        <button
          type="button"
          className="home-btn home-btn-outline home-lang-btn"
          onClick={toggleLang}
        >
          {lang === 'th' ? 'EN' : 'Thai'}
        </button>
      </header>

      <section className="home-hero">
        
        
        <img src="/IHSicon.svg" alt="IHS" className="home-hero-logo"/>
        <div className="home-divider" />
        <p className="home-subtitle">
          {t.subtitle1}
          <br />
          {t.subtitle2}
        </p>

        <div className="home-cta-row">
          <Link to="/map" className="home-btn home-btn-solid">
            {t.ctaSolid}
          </Link>
          <button type="button" className="home-btn home-btn-outline">
            {t.ctaOutline}
          </button>
        </div>

        <nav className="home-feature-grid" aria-label="เมนูหลัก">
          {menuItems.map((item) => (
            <Link className="home-feature-card" key={item.to} to={item.to} aria-label={item.title}>
              <span className="home-feature-icon">
                <MenuIcon>{item.icon}</MenuIcon>
              </span>
              <span className="home-feature-title">
                {lang === 'th' ? item.title : item.english}
              </span>
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}

// ⬅️ แก้ตรงนี้ (cluster): แยกการสร้างไอคอนหมุดออกมา เพื่อใช้ซ้ำตอนเปลี่ยนสถานะ "ถูกเลือก" โดยไม่ต้องสร้างหมุดใหม่ทั้งหมด
function createChurchIcon(church: Church, now: Date, isSelected: boolean) {
  const alert = getMassAlert(church, now)
  return L.divIcon({
    className: `church-marker-icon ${alert.active ? 'is-open' : ''} ${isSelected ? 'is-selected' : ''}`,
    html: `<span class="church-marker-pin"></span>${alert.active ? `<span class="church-marker-badge">มิสซา ${alert.time} น.</span>` : ''}`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
  })
}

// ⬅️ แก้ตรงนี้ (การ์ดแยก): ระยะที่ต้องเว้นไว้ฝั่งซ้าย/ล่าง ตอนเลื่อนแผนที่ไปหาวัดที่เลือก
// เพื่อไม่ให้หมุดไปอยู่ใต้การ์ด filter และการ์ดรายละเอียด (ตัวเลขต้องสัมพันธ์กับความกว้างใน App.css)
function getFocusPadding(): { topLeft: [number, number]; bottomRight: [number, number] } {
  const width = window.innerWidth
  if (width <= 700) return { topLeft: [0, 0], bottomRight: [0, Math.round(window.innerHeight * 0.55)] }
  if (width <= 1150) return { topLeft: [700, 0], bottomRight: [0, 0] }
  return { topLeft: [790, 0], bottomRight: [0, 0] }
}

// ⬅️ แก้ตรงนี้ (การ์ดแยก): เพิ่ม prop selected เพื่อให้แผนที่รู้ว่าวัดไหนถูกเลือกอยู่
// ⬅️ แก้ตรงนี้ (ซ่อนการ์ด): เพิ่ม prop children เพื่อให้วางปุ่ม "เรียกการ์ดกลับมา" ลอยบนแผนที่ได้
function MapView({ onSelect, now, churches, selected, children }: { onSelect: (id: string) => void; now: Date; churches: Church[]; selected?: Church; children?: ReactNode }) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  // ⬅️ แก้ตรงนี้ (cluster): เปลี่ยนจาก L.LayerGroup เป็น MarkerClusterGroup
  const markerLayerRef = useRef<L.MarkerClusterGroup | null>(null)
  const markersRef = useRef<Map<string, { marker: L.Marker; church: Church }>>(new Map())
  const prevSelectedIdRef = useRef<string | undefined>(undefined)
  const locationLayerRef = useRef<L.LayerGroup | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const selectedId = selected?.id
  const selectedLat = selected?.lat
  const selectedLng = selected?.lng
  // ⬅️ แก้ตรงนี้ (cluster): สรุปสถานะ "มีมิสซาตอนนี้" ของทุกวัดเป็นข้อความเดียว
  // ใช้แทนการ rebuild ทุก 30 วินาที เพื่อไม่ให้กลุ่มหมุดที่กางอยู่หุบกลับเอง
  const markerSignature = churches.map((church) => {
    const alert = getMassAlert(church, now)
    return `${church.id}:${alert.active}:${alert.time}`
  }).join('|')

  useEffect(() => {
    if (!mapElement.current) return
    const map = L.map(mapElement.current, { zoomControl: false }).setView(mapCenter, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map
    markerLayerRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 18,
    }).addTo(map)
    locationLayerRef.current = L.layerGroup().addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
      markerLayerRef.current = null
      locationLayerRef.current = null
      markersRef.current.clear()
    }
  }, [])

  const locateUser = () => {
    if (!navigator.geolocation || !mapRef.current || !locationLayerRef.current) {
      setLocationError(true)
      return
    }

    setLocating(true)
    setLocationError(false)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position: L.LatLngExpression = [coords.latitude, coords.longitude]
        const map = mapRef.current
        const locationLayer = locationLayerRef.current
        if (map && locationLayer) {
          locationLayer.clearLayers()
          L.circle(position, {
            radius: Math.max(coords.accuracy, 30),
            color: '#2563eb',
            fillColor: '#60a5fa',
            fillOpacity: 0.2,
            weight: 2,
          }).addTo(locationLayer)
          L.circleMarker(position, {
            radius: 8,
            color: '#ffffff',
            weight: 3,
            fillColor: '#2563eb',
            fillOpacity: 1,
          }).bindTooltip('ตำแหน่งปัจจุบัน', { direction: 'top' }).addTo(locationLayer)
          map.setView(position, Math.max(map.getZoom(), 15), { animate: true })
        }
        setLocating(false)
      },
      () => {
        setLocating(false)
        setLocationError(true)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  // ⬅️ แก้ตรงนี้ (cluster): สร้างหมุดทั้งหมดแล้วใส่ใน cluster group ทีเดียว (addLayers เร็วกว่าใส่ทีละอัน)
  // สร้างใหม่เฉพาะตอนรายชื่อวัดเปลี่ยน หรือสถานะ "มีมิสซา" เปลี่ยน — ไม่ใช่ทุกครั้งที่นาฬิกาเดิน
  useEffect(() => {
    const markerLayer = markerLayerRef.current
    if (!markerLayer) return
    markerLayer.clearLayers()
    markersRef.current.clear()
    const markers = churches.map((church) => {
      const marker = L.marker([church.lat, church.lng], {
        icon: createChurchIcon(church, now, church.id === selectedId),
      })
      marker.bindTooltip(church.name, { direction: 'top', offset: [0, -36] })
      marker.on('click', () => onSelect(church.id))
      markersRef.current.set(church.id, { marker, church })
      return marker
    })
    markerLayer.addLayers(markers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelect, churches, markerSignature])

  // ⬅️ แก้ตรงนี้ (การ์ดแยก): เปลี่ยนไอคอนเฉพาะหมุดเดิม/หมุดใหม่ที่ถูกเลือก (มีวงแสงอำพันรอบหมุด)
  useEffect(() => {
    const prevId = prevSelectedIdRef.current
    prevSelectedIdRef.current = selectedId
    ;[prevId, selectedId].forEach((id) => {
      if (!id) return
      const entry = markersRef.current.get(id)
      if (entry) entry.marker.setIcon(createChurchIcon(entry.church, now, id === selectedId))
    })
  }, [selectedId, now])

  // ⬅️ แก้ตรงนี้ (การ์ดแยก): เมื่อเลือกวัด ให้เลื่อน/ซูมแผนที่ไปที่วัดนั้น โดยเว้นที่ให้การ์ด
  // ถ้าหมุดยังซ่อนอยู่ใน cluster จะซูมลงจนเห็นเป็นหมุดเดี่ยวก่อน
  useEffect(() => {
    const map = mapRef.current
    const markerLayer = markerLayerRef.current
    if (!map || !markerLayer || !selectedId || selectedLat === undefined || selectedLng === undefined) return
    const padding = getFocusPadding()
    const topLeft: [number, number] = padding.topLeft[0] > map.getSize().x - 160 ? [0, 0] : padding.topLeft
    const focus = () => {
      map.fitBounds(
        L.latLngBounds([[selectedLat, selectedLng], [selectedLat, selectedLng]]),
        { paddingTopLeft: topLeft, paddingBottomRight: padding.bottomRight, maxZoom: Math.max(map.getZoom(), 16), animate: true },
      )
    }
    const entry = markersRef.current.get(selectedId)
    if (entry && markerLayer.getVisibleParent(entry.marker) !== entry.marker) {
      markerLayer.zoomToShowLayer(entry.marker, focus)
    } else {
      focus()
    }
  }, [selectedId, selectedLat, selectedLng])

  return (
    <div className="map-container">
      <div ref={mapElement} className="map" aria-label="แผนที่วัดคาทอลิกในกรุงเทพฯ" />
      <button type="button" className="locate-button" onClick={locateUser} disabled={locating}>
        <span aria-hidden="true">⌖</span>
        {locating ? 'กำลังค้นหา...' : 'ตำแหน่งของฉัน'}
      </button>
      {locationError && <p className="location-error">ไม่สามารถอ่านตำแหน่งได้ กรุณาอนุญาต Location ใน browser</p>}
      {/* ⬅️ แก้ตรงนี้ (ซ่อนการ์ด): พื้นที่สำหรับปุ่มที่ส่งมาจาก MapPage (ปุ่มเรียกการ์ดค้นหากลับมา) */}
      {children}
    </div>
  )
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className="detail-block"><div className="detail-label">{label}</div><div className="detail-value">{children}</div></div>
}

// ⬅️ แก้ตรงนี้ (แหล่งข้อมูล): ลิงก์ต้องขึ้นต้นด้วย http(s) เท่านั้น กันกรณีมีคนส่งข้อมูลแปลกๆ เข้ามาในอนาคต (เช่น javascript:)
const isSafeUrl = (url?: string) => !!url && /^https?:\/\//i.test(url)

// ⬅️ แก้ตรงนี้ (จุดที่ 2): รับ lang เข้ามา, ใช้ detailText[lang] แทน label ที่ hardcode ไว้เดิม, สลับ primary/secondary name
function ChurchDetail({ church, onEditClick, canEditDirectly, lang }: { church: Church; onEditClick: () => void; canEditDirectly: boolean; lang: 'th' | 'en' }) {
  const td = detailText[lang]
  const primaryName = lang === 'th' ? church.name : church.nameEn
  const secondaryName = lang === 'th' ? church.nameEn : null
  const [imageExpanded, setImageExpanded] = useState(false)

  useEffect(() => {
    if (!imageExpanded) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImageExpanded(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageExpanded])

  return (
    <section className="detail">
      {/* ⬅️ แก้ตรงนี้ (การ์ดแยก): เอาปุ่ม "← กลับไปยังรายการวัด" ออก เพราะการ์ดนี้มีปุ่มปิด (×) ของตัวเองแล้ว (อยู่ใน MapPage) */}
      <button type="button" className="church-detail-image-trigger" onClick={() => setImageExpanded(true)} aria-label={lang === 'th' ? `ขยายรูป${primaryName}` : `View larger image of ${primaryName}`}>
        <img
          className="church-detail-image"
          src={church.imageUrl || churchPlaceholderImage}
          alt={primaryName}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = churchPlaceholderImage
          }}
        />
      </button>
      {imageExpanded && (
        <div className="church-image-lightbox" role="dialog" aria-modal="true" aria-label={primaryName} onClick={() => setImageExpanded(false)}>
          <button type="button" className="church-image-lightbox-close" onClick={() => setImageExpanded(false)} aria-label={lang === 'th' ? 'ปิดรูปภาพ' : 'Close image'}>×</button>
          <img
            src={church.imageUrl || churchPlaceholderImage}
            alt={primaryName}
            onClick={(event) => event.stopPropagation()}
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = churchPlaceholderImage
            }}
          />
        </div>
      )}
      <h2>{primaryName}</h2>
      {secondaryName && <p className="detail-en">{secondaryName}</p>}
      <span className="district">{getDistrictLabel(church.district, lang)}</span>
      <InfoBlock label={td.openHours}>{lang === 'en' ? church.openHoursEn ?? getOpenHoursLabel(church.openHours, lang) : church.openHours}</InfoBlock>
      <InfoBlock label={td.massSchedule}>
        <table><tbody>{church.massSchedule.map((row) => <tr key={row.day}><th>{getMassDayLabel(row.day, lang)}</th><td>{row.times.join(' · ')}{td.timeUnit}</td></tr>)}</tbody></table>
      </InfoBlock>
      <InfoBlock label={td.priest}>{lang === 'en' ? church.priestEn ?? 'English information unavailable' : church.priest}</InfoBlock>
      <InfoBlock label={td.address}>{lang === 'en' ? church.addressEn ?? 'English information unavailable' : church.address}</InfoBlock>
      {/* ⬅️ แก้ตรงนี้ (แหล่งข้อมูล): บล็อกแสดงแหล่งอ้างอิง ถ้าไม่มีข้อมูลจะขึ้นข้อความ "ยังไม่ระบุ" */}
      <InfoBlock label={td.sources}>
        {church.sources?.length ? (
          <ul className="source-list">
            {church.sources.map((source, index) => {
              const text = lang === 'en' ? source.labelEn ?? source.label : source.label
              return (
                <li key={index}>
                  {isSafeUrl(source.url)
                    ? <a href={source.url} target="_blank" rel="noreferrer noopener">{text} ↗</a>
                    : text}
                </li>
              )
            })}
          </ul>
        ) : (
          <span className="source-empty">{td.noSources}</span>
        )}
      </InfoBlock>
      <button type="button" className="edit-detail-btn" onClick={onEditClick}>✎ {canEditDirectly ? td.editDirect : td.editRequest}</button>
      <a className="nav-btn" href={`https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lng}`} target="_blank" rel="noreferrer">{td.directions}</a>
    </section>
  )
}

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

type AddChurchFormState = {
  name: string
  nameEn: string
  district: string
  address: string
  imageUrl: string
  lat: string
  lng: string
  priest: string
  mass: string
  openHours: string
}

const emptyAddForm: AddChurchFormState = { name: '', nameEn: '', district: '', address: '', imageUrl: '', lat: '', lng: '', priest: '', mass: '', openHours: '' }

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

// ⬇️ เพิ่มใหม่: แปลง massSchedule ที่มีอยู่แล้วกลับเป็นข้อความ ให้ขึ้นมาในฟอร์มตอนกดแก้ไข
function serializeMassSchedule(massSchedule: Church['massSchedule']): string {
  return massSchedule.map((row) => `${row.day}: ${row.times.join(', ')}`).join('; ')
}

// ⬇️ เพิ่มใหม่: เตรียมค่าเริ่มต้นของฟอร์มแก้ไขจากข้อมูลวัดที่เลือกอยู่
function buildFormFromChurch(church: Church): AddChurchFormState {
  return {
    name: church.name,
    nameEn: church.nameEn,
    district: church.district,
    address: church.address,
    imageUrl: church.imageUrl ?? '',
    lat: String(church.lat),
    lng: String(church.lng),
    priest: church.priest,
    mass: serializeMassSchedule(church.massSchedule),
    openHours: church.openHours,
  }
}

function AddChurchModal({ direct, onClose, onSuccess }: { direct: boolean; onClose: () => void; onSuccess?: () => void }) {
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
      imageUrl: form.imageUrl || undefined,
      lat: Number(form.lat),
      lng: Number(form.lng),
      priest: form.priest,
      openHours: form.openHours,
      massSchedule: parseMassScheduleInput(form.mass),
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

// ⬇️ เพิ่มใหม่ทั้งฟังก์ชันนี้ — โครงเดียวกับ AddChurchModal แต่ยิง PUT แทน POST และมีค่าเริ่มต้นจากวัดเดิม
function EditChurchModal({ direct, church, onClose, onSuccess }: { direct: boolean; church: Church; onClose: () => void; onSuccess?: () => void }) {
  const [form, setForm] = useState<AddChurchFormState>(() => buildFormFromChurch(church))
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  const updateField = (key: keyof AddChurchFormState) => (event: ChangeEvent<HTMLInputElement>) =>
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
      lat: Number(form.lat),
      lng: Number(form.lng),
      priest: form.priest,
      openHours: form.openHours,
      massSchedule: parseMassScheduleInput(form.mass),
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

function DeleteChurchModal({ direct, churches, onClose, onSuccess }: { direct: boolean; churches: Church[]; onClose: () => void; onSuccess?: () => void }) {
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

export function MapPage() {
  const { churchId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAdminAuth()
  const { lang, toggleLang } = useLanguage()
  const tm = mapText[lang]
  const [query, setQuery] = useState('')
  const [activeModal, setActiveModal] = useState<'add' | 'delete' | 'edit' | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const now = useMinuteTick()
  const isMobile = useMediaQuery('(max-width: 700px)')   // ⬅️ แก้ตรงนี้ (ลูกศรบนมือถือ)

  const [churches, setChurches] = useState<Church[]>([])

  // ⬇️ เพิ่มใหม่: state เก็บภาคที่เลือก (เซ็ตว่าง = แสดงทุกภาค กันหน้าว่างเปล่าตอนเปิดหน้าครั้งแรก)
  const [selectedRegions, setSelectedRegions] = useState<Set<Region>>(new Set())
  const [showLiveMassOnly, setShowLiveMassOnly] = useState(false)
  // ⬅️ แก้ตรงนี้ (bottom sheet มือถือ): เปิด/พับการ์ด filter (ปุ่มจับจะแสดงเฉพาะจอมือถือ ตาม CSS)
  const [sheetOpen, setSheetOpen] = useState(true)
  // ⬅️ แก้ตรงนี้ (ซ่อนการ์ด): ซ่อนการ์ด filter ทั้งแผ่นบนจอเดสก์ท็อป/แท็บเล็ต (แยกจาก sheetOpen ของมือถือ)
  const [panelHidden, setPanelHidden] = useState(false)

  const toggleRegion = useCallback((region: Region) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev)
      next.has(region) ? next.delete(region) : next.add(region)
      return next
    })
  }, [])

  const fetchChurches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/churches`)
      if (!res.ok) throw new Error('failed to fetch churches')
      const data: Church[] = await res.json()
      setChurches(data)
    } catch {
      setChurches([])
    }
  }, [])

  useEffect(() => {
    fetchChurches()
  }, [fetchChurches])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const selectedChurch = churches.find((church) => church.id === churchId)

  // ⬅️ แก้ตรงนี้: กรองตามภาคก่อน แล้วค่อยกรองตาม query ค้นหาต่อ (สองชั้น)
  const regionFilteredChurches = selectedRegions.size === 0
    ? churches
    : churches.filter((church) => selectedRegions.has(church.region))

  const liveMassFilteredChurches = showLiveMassOnly
    ? regionFilteredChurches.filter((church) => getMassAlert(church, now).active)
    : regionFilteredChurches

  const visibleChurches = liveMassFilteredChurches.filter((church) =>
    `${church.name} ${church.nameEn} ${church.district} ${church.province ?? ''} ${church.address}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )

  const selectChurch = useCallback((id: string) => navigate(`/map/church/${id}`), [navigate])

  return (
    <div className="map-page">
      <header className="map-header">
        <Link to="/" className="map-brand"><img src="/logo.svg" alt="โลโก้" className="map-logo" /><strong>วัดคาทอลิก</strong></Link>
        <nav className="map-header-actions">
          {!isAuthenticated && <Link to="/" className="map-home-link">{tm.home}</Link>}
          {isAuthenticated ? (
            <div className="map-user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="map-user-avatar"
                onClick={() => setShowUserMenu((prev) => !prev)}
                aria-label="เมนูผู้ใช้"
                aria-expanded={showUserMenu}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9z" fill="currentColor" />
                </svg>
              </button>
              {showUserMenu && (
                <div className="map-user-dropdown">
                  <Link to="/" className="map-user-dropdown-item" onClick={() => setShowUserMenu(false)}>{tm.home}</Link>
                  <Link to="/admin" className="map-user-dropdown-item" onClick={() => setShowUserMenu(false)}>{tm.admin}</Link>
                  <button
                    type="button"
                    className="map-user-dropdown-item"
                    onClick={async () => {
                      setShowUserMenu(false)
                      await logout()
                      navigate('/')
                    }}
                  >
                    {tm.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/admin/login" className="map-admin-link">{tm.admin}</Link>
          )}
          <button
            type="button"
            className="home-btn home-btn-outline home-lang-btn"
            onClick={toggleLang}
          >
            {lang === 'th' ? 'EN' : 'Thai'}
          </button>
        </nav>
      </header>
      <div className="map-layout">
        {/* ⬅️ แก้ตรงนี้ (ซ่อนการ์ด): เพิ่ม class is-panel-hidden ตอนซ่อน (มีผลเฉพาะจอ >700px ตาม CSS) */}
        <aside className={`map-sidebar${sheetOpen ? '' : ' is-collapsed'}${panelHidden ? ' is-panel-hidden' : ''}`}>
          {/* ⬅️ แก้ตรงนี้ (bottom sheet มือถือ): ปุ่มจับสำหรับพับ/เปิดการ์ด (ซ่อนบนเดสก์ท็อปด้วย CSS) */}
          <button
            type="button"
            className="map-sheet-handle"
            onClick={() => setSheetOpen((current) => !current)}
            aria-expanded={sheetOpen}
            aria-label={lang === 'th' ? 'เปิด/พับแผงค้นหา' : 'Toggle search panel'}
          />
          <header className="map-sidebar-heading">
            <p className="map-sidebar-eyebrow">{lang === 'th' ? 'สำรวจแผนที่' : 'EXPLORE THE MAP'}</p>
            <h1>{tm.heading}</h1>
            {/* ⬅️ แก้ตรงนี้ (ซ่อนการ์ด): ปุ่มซ่อนการ์ดทั้งแผ่น (แสดงเฉพาะเดสก์ท็อป/แท็บเล็ต ตาม CSS) */}
            <button
              type="button"
              className={`map-panel-hide-btn${isMobile && !sheetOpen ? ' is-flipped' : ''}`}
              onClick={() => (isMobile ? setSheetOpen((current) => !current) : setPanelHidden(true))}   // ⬅️ มือถือ: พับ/เปิดการ์ด, คอม: ซ่อนทั้งแผ่นเหมือนเดิม
              aria-expanded={isMobile ? sheetOpen : undefined}
              aria-label={
                isMobile
                  ? (sheetOpen ? (lang === 'th' ? 'พับแผงค้นหา' : 'Collapse search panel') : (lang === 'th' ? 'เปิดแผงค้นหา' : 'Expand search panel'))
                  : (lang === 'th' ? 'ซ่อนแผงค้นหา' : 'Hide search panel')
              }
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </header>
          {/* ⬅️ แก้ตรงนี้ (การ์ดแยก): การ์ด filter แสดงตลอด ไม่ซ่อนตอนเลือกวัดแล้ว (เดิมมีเงื่อนไข !selectedChurch) */}
          <section className="map-control-section" aria-labelledby="region-filter-heading">
            <div className="map-control-heading">
              <span className="map-control-index">01</span>
              <h2 id="region-filter-heading">{lang === 'th' ? 'เลือกภาค' : 'Regions'}</h2>
            </div>
            <RegionFilter
              selected={selectedRegions}
              onToggle={toggleRegion}
              onReset={() => setSelectedRegions(new Set())}
              lang={lang}
            />
          </section>
          <section className="map-control-section map-search-section" aria-labelledby="church-search-heading">
            <div className="map-control-heading">
              <span className="map-control-index">02</span>
              <h2 id="church-search-heading">{lang === 'th' ? 'ค้นหาวัด' : 'Find a church'}</h2>
            </div>
            <div className="map-search-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.3" />
                <path d="m15.4 15.4 4.1 4.1" />
              </svg>
              <input
                id="map-church-search"
                className="map-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tm.searchPlaceholder}
                aria-label={tm.searchPlaceholder}
              />
              {query && (
                <button type="button" className="map-search-clear" onClick={() => setQuery('')} aria-label={lang === 'th' ? 'ล้างคำค้นหา' : 'Clear search'}>
                  ×
                </button>
              )}
            </div>
          </section>
          <button
            type="button"
            className={`live-mass-filter ${showLiveMassOnly ? 'is-active' : ''}`}
            onClick={() => setShowLiveMassOnly((current) => !current)}
            aria-pressed={showLiveMassOnly}
          >
            <span className="live-mass-dot" aria-hidden="true" />
            {lang === 'th' ? 'วัดที่กำลังมีมิสซา' : 'Mass happening now'}
          </button>
          <section className="map-control-section map-manage-section" aria-labelledby="map-manage-heading">
            <div className="map-control-heading">
              <span className="map-control-index">03</span>
              <h2 id="map-manage-heading">{lang === 'th' ? 'จัดการข้อมูล' : 'Church data'}</h2>
            </div>
            <div className="sidebar-actions">
            <button type="button" className="sidebar-action-btn sidebar-action-add" onClick={() => setActiveModal('add')}>
              {tm.add}
            </button>
            <button type="button" className="sidebar-action-btn sidebar-action-remove" onClick={() => setActiveModal('delete')}>
              {tm.remove}
            </button>
            </div>
          </section>
          <div className="map-sidebar-results" aria-live="polite">
            <span className="map-sidebar-results-dot" aria-hidden="true" />
            {lang === 'th' ? `แสดง ${visibleChurches.length} วัดบนแผนที่` : `Showing ${visibleChurches.length} churches on map`}
          </div>
          {!isAuthenticated && (
            <p className="sidebar-hint">{tm.hint}</p>
          )}
        </aside>
        {/* ⬅️ แก้ตรงนี้ (การ์ดแยก): การ์ดรายละเอียดวัดเป็นอีกใบ แยกออกมาจากการ์ด filter (เดิมอยู่ใน <aside> เดียวกัน) */}
        {selectedChurch && (
          <aside
            className={`church-popcard${panelHidden ? ' is-panel-hidden' : ''}`}   // ⬅️ แก้ตรงนี้ (การ์ดเลื่อนลงใต้ปุ่ม): เพิ่ม class ตอนแผง filter ถูกซ่อน
            aria-label={lang === 'th' ? 'รายละเอียดวัด' : 'Church details'}
          >
            <button
              type="button"
              className="church-popcard-close"
              onClick={() => navigate('/map')}
              aria-label={lang === 'th' ? 'ปิดรายละเอียดวัด' : 'Close church details'}
            >
              ×
            </button>
            <ChurchDetail church={selectedChurch} onEditClick={() => setActiveModal('edit')} canEditDirectly={isAuthenticated} lang={lang} />
          </aside>
        )}
        <main className="map-wrap">
          <MapView onSelect={selectChurch} now={now} churches={visibleChurches} selected={selectedChurch}>
            {/* ⬅️ แก้ตรงนี้ (ซ่อนการ์ด): ปุ่มลอยมุมซ้ายบนของแผนที่ กดแล้วเรียกการ์ดค้นหากลับมา (โผล่เฉพาะตอนซ่อนอยู่) */}
            {panelHidden && (
              <button
                type="button"
                className="map-panel-reveal"
                onClick={() => setPanelHidden(false)}
                aria-label={lang === 'th' ? 'แสดงแผงค้นหา' : 'Show search panel'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M4 7h16M7 12h10M10 17h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {lang === 'th' ? 'สำรวจแผนที่' : 'Explore the map'}
              </button>
            )}
          </MapView>
        </main>
      </div>
      {activeModal === 'add' && <AddChurchModal direct={isAuthenticated} onClose={() => setActiveModal(null)} onSuccess={fetchChurches} />}
      {activeModal === 'delete' && <DeleteChurchModal direct={isAuthenticated} churches={churches} onClose={() => setActiveModal(null)} onSuccess={fetchChurches} />}
      {activeModal === 'edit' && selectedChurch && <EditChurchModal direct={isAuthenticated} church={selectedChurch} onClose={() => setActiveModal(null)} onSuccess={fetchChurches} />}
    </div>
  )
}

export function ContentPage({ title, english }: { title: string; english: string }) {
  return <main className="content-page"><Link to="/" className="content-back">← กลับหน้าแรก</Link><p className="eyebrow">{english}</p><h1>{title}</h1><p>หน้านี้เตรียมไว้สำหรับข้อมูลในหมวดนี้ และสามารถเติมเนื้อหาต่อได้ในอนาคต</p></main>
}