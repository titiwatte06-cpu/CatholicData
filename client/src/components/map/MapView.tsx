import { useEffect, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { Church } from '../../data/churches'
import { getMassAlert } from '../../utils/massAlert'
import { churchPlaceholderImage, isSafeUrl, mapCenter } from '../../pages/map/mapUtils'

function createChurchIcon(church: Church, now: Date, isSelected: boolean) {
  const alert = getMassAlert(church, now)
  return L.divIcon({
    className: `church-marker-icon ${alert.active ? 'is-open' : ''} ${isSelected ? 'is-selected' : ''}`,
    html: `<span class="church-marker-pin"></span>${alert.active ? `<span class="church-marker-badge">มิสซา ${alert.time} น.</span>` : ''}`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
  })
}

// เพื่อไม่ให้หมุดไปอยู่ใต้การ์ด filter และการ์ดรายละเอียด (ตัวเลขต้องสัมพันธ์กับความกว้างใน App.css)
function getFocusPadding(): { topLeft: [number, number]; bottomRight: [number, number] } {
  const width = window.innerWidth
  if (width <= 1024) return { topLeft: [0, 0], bottomRight: [0, Math.round(window.innerHeight * 0.55)] }
  if (width <= 1150) return { topLeft: [700, 0], bottomRight: [0, 0] }
  return { topLeft: [790, 0], bottomRight: [0, 0] }
}

export function MapView({ onSelect, now, churches, selected, children }: { onSelect: (id: string) => void; now: Date; churches: Church[]; selected?: Church; children?: ReactNode }) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.MarkerClusterGroup | null>(null)
  const markersRef = useRef<Map<string, { marker: L.Marker; church: Church }>>(new Map())
  const prevSelectedIdRef = useRef<string | undefined>(undefined)
  const locationLayerRef = useRef<L.LayerGroup | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const selectedId = selected?.id
  const selectedLat = selected?.lat
  const selectedLng = selected?.lng
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
    const markerLayer = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 18,
    }).addTo(map)
    markerLayerRef.current = markerLayer
    const locationLayer = L.layerGroup().addTo(map)
    locationLayerRef.current = locationLayer
    const markers = markersRef.current
    return () => {
      map.remove()
      mapRef.current = null
      markerLayerRef.current = null
      locationLayerRef.current = null
      markers.clear()
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
      const tooltipContent = document.createElement('div')
      tooltipContent.className = 'church-marker-tooltip'
      const tooltipImage = document.createElement('img')
      tooltipImage.src = isSafeUrl(church.imageUrl) ? church.imageUrl! : churchPlaceholderImage
      tooltipImage.alt = ''
      tooltipImage.loading = 'lazy'
      tooltipImage.onerror = () => {
        tooltipImage.onerror = null
        tooltipImage.src = churchPlaceholderImage
      }
      const tooltipName = document.createElement('span')
      tooltipName.textContent = church.name
      tooltipContent.append(tooltipImage, tooltipName)
      marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -38], className: 'church-marker-tooltip-shell' })
      marker.on('click', () => onSelect(church.id))
      markersRef.current.set(church.id, { marker, church })
      return marker
    })
    markerLayer.addLayers(markers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelect, churches, markerSignature])

  useEffect(() => {
    const prevId = prevSelectedIdRef.current
    prevSelectedIdRef.current = selectedId
    ;[prevId, selectedId].forEach((id) => {
      if (!id) return
      const entry = markersRef.current.get(id)
      if (entry) entry.marker.setIcon(createChurchIcon(entry.church, now, id === selectedId))
    })
  }, [selectedId, now])

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
      {children}
    </div>
  )
}
