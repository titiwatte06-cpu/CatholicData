import { useEffect, useState, type ReactNode } from 'react'
import type { Church } from '../../data/churches'
import { getDistrictLabel, getMassDayLabel, getOpenHoursLabel } from '../../data/churches'
import { churchPlaceholderImage, isSafeUrl } from '../../pages/map/mapUtils'

const detailText = {
  th: {
    back: '← กลับไปยังรายการวัด',
    openHours: 'เวลาเปิด-ปิดวัด',
    massSchedule: 'ตารางมิสซา',
    priest: 'คุณพ่อเจ้าอาวาส',
    address: 'ที่อยู่',
    sources: 'แหล่งข้อมูลอ้างอิง',
    noSources: 'ยังไม่ระบุแหล่งข้อมูล',
    editDirect: 'แก้ไขข้อมูล',
    editRequest: 'เสนอแก้ไขข้อมูล',
    directions: 'นำทางด้วย Google Maps',
    timeUnit: ' น.',
  },
  en: {
    back: '← Back to church list',
    openHours: 'Opening Hours',
    massSchedule: 'Mass Schedule',
    priest: 'Parish Priest',
    address: 'Address',
    sources: 'Sources',
    noSources: 'No source listed yet',
    editDirect: 'Edit Information',
    editRequest: 'Suggest an Edit',
    directions: 'Get Directions via Google Maps',
    timeUnit: '',
  },
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className="detail-block"><div className="detail-label">{label}</div><div className="detail-value">{children}</div></div>
}

function FacebookLink({ url, lang }: { url?: string; lang: 'th' | 'en' }) {
  if (!isSafeUrl(url)) return null
  return (
    <a className="church-facebook-link" href={url} target="_blank" rel="noopener noreferrer" aria-label={lang === 'th' ? 'เปิด Facebook ของวัด' : 'Open church Facebook page'} title="Facebook">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.5 1.6-1.5h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V21z" /></svg>
    </a>
  )
}

export function ChurchDetail({ church, onEditClick, canEditDirectly, lang }: { church: Church; onEditClick: () => void; canEditDirectly: boolean; lang: 'th' | 'en' }) {
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
      <div className="detail-meta-row">
        <span className="district">{getDistrictLabel(church.district, lang)}</span>
        <FacebookLink url={church.facebookUrl} lang={lang} />
      </div>
      <InfoBlock label={td.openHours}>{lang === 'en' ? church.openHoursEn ?? getOpenHoursLabel(church.openHours, lang) : church.openHours}</InfoBlock>
      <InfoBlock label={td.massSchedule}>
        <table><tbody>{church.massSchedule.map((row) => <tr key={row.day}><th>{getMassDayLabel(row.day, lang)}</th><td>{row.times.join(' · ')}{td.timeUnit}</td></tr>)}</tbody></table>
      </InfoBlock>
      <InfoBlock label={td.priest}>{lang === 'en' ? church.priestEn ?? 'English information unavailable' : church.priest}</InfoBlock>
      <InfoBlock label={td.address}>{lang === 'en' ? church.addressEn ?? 'English information unavailable' : church.address}</InfoBlock>
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
      <a className="nav-btn" href={`https://www.google.com/maps/dir/?api=1&destination=${church.lat},${church.lng}`} target="_blank" rel="noreferrer noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 10.2c0 5.2-8.2 11.3-8.2 11.3S3.8 15.4 3.8 10.2a8.2 8.2 0 1 1 16.4 0Z" /><circle cx="12" cy="10" r="2.8" /></svg>
        <span>{td.directions}</span>
      </a>
    </section>
  )
}
