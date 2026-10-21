import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMassAlert } from '../utils/massAlert'
import { useChurches } from '../hooks/useChurches'
import { useAdminAuth } from '../admin/AdminAuth'
import { useLanguage } from '../LanguageContext'
import { RegionFilter } from '../components/RegionFilter'
import { MapView } from '../components/map/MapView'
import { useMinuteTick } from '../hooks/useMinuteTick'
import { ChurchDetail } from '../components/map/ChurchDetail'
import { AddChurchModal, DeleteChurchModal, EditChurchModal } from '../components/map/ChurchModals'
import { mapText } from './map/mapText'
import type { Region } from '../data/churches'
import './map-page.css'

function useMediaQuery(query: string) {
  const mediaQuery = useMemo(() => window.matchMedia(query), [query])
  const subscribe = useCallback((onChange: () => void) => {
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [mediaQuery])
  const getSnapshot = useCallback(() => mediaQuery.matches, [mediaQuery])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
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
  const isMobile = useMediaQuery('(max-width: 1024px)')

  const { churches, loading: churchesLoading, error: churchesError, refetch: fetchChurches } = useChurches()

  const [selectedRegions, setSelectedRegions] = useState<Set<Region>>(new Set())
  const [showLiveMassOnly, setShowLiveMassOnly] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(true)
  const [panelHidden, setPanelHidden] = useState(false)

  const toggleRegion = useCallback((region: Region) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev)
      if (next.has(region)) next.delete(region)
      else next.add(region)
      return next
    })
  }, [])

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

  const selectableChurches = regionFilteredChurches.filter((church) =>
    `${church.name} ${church.nameEn} ${church.district} ${church.province ?? ''} ${church.address}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  )

  const selectChurch = useCallback((id: string) => {
    if (isMobile) setSheetOpen(true)
    navigate(`/map/church/${id}`)
  }, [isMobile, navigate])

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
        <aside className={`map-sidebar${sheetOpen ? '' : ' is-collapsed'}${panelHidden ? ' is-panel-hidden' : ''}`}>
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
            <label className="map-church-select-label" htmlFor="map-church-select">
              {lang === 'th' ? 'หรือเลือกวัดจากรายการ' : 'Or choose a church'}
            </label>
            <select
              id="map-church-select"
              className="map-church-select"
              value={selectedChurch && selectableChurches.some((church) => church.id === selectedChurch.id) ? selectedChurch.id : ''}
              onChange={(event) => {
                if (event.target.value) selectChurch(event.target.value)
              }}
              aria-label={lang === 'th' ? 'เลือกวัดจากสังฆมณฑลที่เลือก' : 'Choose a church from the selected dioceses'}
            >
              <option value="">{lang === 'th' ? `เลือกวัด (${selectableChurches.length} แห่ง)` : `Choose a church (${selectableChurches.length})`}</option>
              {selectableChurches.map((church) => (
                <option key={church.id} value={church.id}>
                  {lang === 'th' ? church.name : church.nameEn} · {church.district}
                </option>
              ))}
            </select>
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
          {isAuthenticated && <section className="map-control-section map-manage-section" aria-labelledby="map-manage-heading">
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
          </section>}
          <div className="map-sidebar-results" aria-live="polite">
            <span className="map-sidebar-results-dot" aria-hidden="true" />
            {churchesLoading && churches.length === 0
              ? tm.loading
              : lang === 'th' ? `แสดง ${visibleChurches.length} วัดบนแผนที่` : `Showing ${visibleChurches.length} churches on map`}
          </div>
          <section className="map-church-directory" aria-label={lang === 'th' ? 'รายชื่อวัด' : 'Churches'}>
            {visibleChurches.length === 0 ? (
              <p className="map-directory-empty">{tm.noResults}</p>
            ) : visibleChurches.map((church) => (
              <button
                type="button"
                className={`map-directory-card${selectedChurch?.id === church.id ? ' is-selected' : ''}`}
                key={church.id}
                onClick={() => selectChurch(church.id)}
                aria-label={`${lang === 'th' ? church.name : church.nameEn}, ${lang === 'th' ? 'ดูรายละเอียดวัด' : 'view church details'}`}
              >
                <img src={church.imageUrl || '/church-placeholder.svg'} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = '/church-placeholder.svg' }} />
                <span className="map-directory-card-body">
                  <strong>{lang === 'th' ? church.name : church.nameEn}</strong>
                  {lang === 'th' && <span lang="en">{church.nameEn}</span>}
                  <small>{church.district}</small>
                </span>
                <span className="map-directory-arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </section>
        </aside>
        {selectedChurch && (
          <aside
            className={`church-popcard${panelHidden ? ' is-panel-hidden' : ''}`}
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
            {churchesLoading && churches.length === 0 && (
              <div className="map-data-loading" role="status">
                <span className="map-data-loading-bar" aria-hidden="true" />
                {tm.loading}
              </div>
            )}
            {churchesError && churches.length === 0 && (
              <button type="button" className="map-data-error" role="alert" onClick={() => void fetchChurches()}>
                {tm.loadError}
              </button>
            )}
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
