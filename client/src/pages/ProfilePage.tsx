import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../LanguageContext'
import { API_BASE_URL } from '../config'
import './profile-page.css'

type AccountUser = {
  username: string
  displayName: string
  privacy?: { stampBookVisible?: boolean }
  joinedAt?: string
}

type CheckIn = {
  churchId: string
  checkedInAt: string
  church: { name?: string; district?: string; province?: string; imageUrl?: string } | null
}

function CrossIcon() {
  return <svg className="profile-stamp-cross" width="26" height="34" viewBox="0 0 26 34" aria-hidden="true"><path d="M13 3v28M4 12h18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" /></svg>
}

export function ProfilePage() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const isThai = lang === 'th'
  const [user, setUser] = useState<AccountUser | null>(null)
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [userResponse, checkinsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/account/me`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/api/account/checkins`, { credentials: 'include' }),
        ])
        if (!userResponse.ok || !checkinsResponse.ok) throw new Error('profile unavailable')

        const userPayload = await userResponse.json() as { user: AccountUser }
        const checkinsPayload = await checkinsResponse.json() as { checkins: CheckIn[] }
        setUser(userPayload.user)
        setCheckins(checkinsPayload.checkins)
        setIsPublic(userPayload.user.privacy?.stampBookVisible ?? false)
      } catch {
        setError(isThai ? 'กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์' : 'Please log in to view your profile')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [isThai])

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/api/account/logout`, { method: 'POST', credentials: 'include' })
    navigate('/')
  }

  const handlePrivacyChange = async () => {
    const nextValue = !isPublic
    setIsPublic(nextValue)
    const response = await fetch(`${API_BASE_URL}/api/account/privacy`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ stampBookVisible: nextValue }),
    })
    if (!response.ok) setIsPublic(!nextValue)
  }

  if (loading) return <main className="profile-page"><p>Loading profile…</p></main>
  if (error || !user) return (
    <main className="profile-page profile-auth-state">
      <section className="profile-auth-card">
        <h1>{isThai ? 'โปรไฟล์ของฉัน' : 'My profile'}</h1>
        <p>{error}</p>
        <div><Link to="/login" className="profile-primary-button">{isThai ? 'เข้าสู่ระบบ' : 'Log in'}</Link><Link to="/" className="profile-back-link">{isThai ? 'กลับหน้าหลัก' : 'Back home'}</Link></div>
      </section>
    </main>
  )

  const stampSlots = Array.from({ length: Math.max(8, checkins.length) }, (_, index) => checkins[index] || null)

  return (
    <main className="profile-page">
      <header className="profile-header">
        <Link to="/" className="profile-brand">วัดคาทอลิก</Link>
        <nav className="profile-nav" aria-label={isThai ? 'เมนูโปรไฟล์' : 'Profile menu'}>
          <Link to="/map">{isThai ? 'แผนที่' : 'Map'}</Link>
          <button type="button" onClick={() => void handleLogout()}>{isThai ? 'ออกจากระบบ' : 'Log out'}</button>
        </nav>
      </header>

      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{user.displayName.slice(0, 1).toUpperCase()}</div>
        </div>
        <div className="profile-identity">
          <h1 id="profile-title">{user.displayName}</h1>
          <p>@{user.username} · {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString(isThai ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long' }) : ''}</p>
        </div>
        <div className="profile-stats">
          <div><strong>{checkins.length}</strong><span>{isThai ? 'วัดที่เคยไป' : 'Churches visited'}</span></div>
          <div><strong>{checkins.length}</strong><span>{isThai ? 'ตราประทับ' : 'Stamps'}</span></div>
        </div>
      </section>

      <div className="profile-main">
        <section className="profile-card profile-stamp-card" aria-labelledby="stamp-title">
          <div className="profile-card-heading">
            <div>
              <h2 id="stamp-title">{isThai ? 'สมุดตราประทับ' : 'Stamp book'}</h2>
              <p>{isThai ? 'เก็บตราประทับเมื่อเช็คอินที่วัด' : 'Your church check-ins'}</p>
            </div>
            <span>{checkins.length}</span>
          </div>
          <div className="profile-stamps">
            {stampSlots.map((checkin, index) => (
              <div className={`profile-stamp${checkin ? '' : ' is-empty'}`} key={checkin?.churchId || `empty-${index}`}>
                <div className="profile-stamp-mark">
                  {checkin?.church?.imageUrl
                    ? <img src={checkin.church.imageUrl} alt="" />
                    : <CrossIcon />}
                  {checkin && <span className="profile-stamp-checkin-label">CHECK-IN</span>}
                </div>
                <strong>{checkin?.church?.name || (isThai ? 'วัดที่ยังไม่ได้เช็คอิน' : 'Available stamp')}</strong>
                <small>{checkin ? [checkin.church?.district, checkin.church?.province].filter(Boolean).join(' · ') : (isThai ? 'ยังไม่ได้ไป' : 'Not visited yet')}</small>
              </div>
            ))}
            {checkins.length === 0 && <p>{isThai ? 'ยังไม่มีประวัติการเช็คอิน' : 'No check-ins yet'}</p>}
          </div>
        </section>

        <aside className="profile-side">
          <section className="profile-card profile-help-card">
            <h2>{isThai ? 'เก็บตราประทับอย่างไร' : 'How to collect stamps'}</h2>
            <p>{isThai ? 'เปิดหน้าวัดจากแผนที่ แล้วกดเช็คอินเมื่อคุณอยู่ใกล้วัด' : 'Open a church from the map and check in when you are nearby.'}</p>
            <Link to="/map" className="profile-primary-button">{isThai ? 'เปิดแผนที่' : 'Open map'}</Link>
          </section>
          <section className="profile-card profile-privacy-card">
            <h2>{isThai ? 'ความเป็นส่วนตัว' : 'Privacy'}</h2>
            <div className="profile-switch-row">
              <span>{isThai ? 'ให้ผู้อื่นเห็นสมุดตราประทับของฉัน' : 'Let others see my stamp book'}</span>
              <button type="button" role="switch" aria-checked={isPublic} className={`profile-switch${isPublic ? ' is-on' : ''}`} onClick={() => void handlePrivacyChange()}>
                <span />
              </button>
            </div>
            <p>{isThai ? 'ค่าเริ่มต้นคือเห็นได้เฉพาะคุณ' : 'Private by default'}</p>
          </section>
        </aside>
      </div>
    </main>
  )
}
