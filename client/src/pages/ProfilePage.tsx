import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../admin/AdminAuth'
import { useLanguage } from '../LanguageContext'
import './profile-page.css'

type Stamp = { name: string; place: string; visited: boolean; rotation: number }

const stamps: Stamp[] = [
  { name: 'อาสนวิหารอัสสัมชัญ', place: 'บางรัก · 12 ต.ค.', visited: true, rotation: -6 },
  { name: 'วัดเซนต์หลุยส์', place: 'สาทร · 5 ต.ค.', visited: true, rotation: 5 },
  { name: 'วัดคอนเซ็ปชัญ', place: 'ดุสิต · 28 ก.ย.', visited: true, rotation: -3 },
  { name: 'วัดซางตาครู้ส', place: 'ธนบุรี · 14 ก.ย.', visited: true, rotation: 7 },
  { name: 'วัดเซนต์ปอล (แปดริ้ว)', place: 'ฉะเชิงเทรา · 1 ก.ย.', visited: true, rotation: -5 },
  { name: 'วัดแม่พระฟาติมา', place: 'ดินแดง · ยังไม่เคยไป', visited: false, rotation: 0 },
  { name: 'วัดนักบุญเทเรซา หนองจอก', place: 'หนองจอก · ยังไม่เคยไป', visited: false, rotation: 0 },
  { name: 'วัดพระกุมารเยซู กม.8', place: 'บางพลี · ยังไม่เคยไป', visited: false, rotation: 0 },
]

function CrossIcon({ muted }: { muted: boolean }) {
  return <svg className={`profile-stamp-cross${muted ? ' is-muted' : ''}`} width="26" height="34" viewBox="0 0 26 34" aria-hidden="true"><path d="M13 3v28M4 12h18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" /></svg>
}

export function ProfilePage() {
  const { lang } = useLanguage()
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [isPublic, setIsPublic] = useState(false)
  const isThai = lang === 'th'

  const handleLogout = async () => { await logout(); navigate('/') }

  return (
    <main className="profile-page">
      <header className="profile-header">
        <Link to="/" className="profile-brand">วัดคาทอลิก</Link>
        <nav className="profile-nav" aria-label={isThai ? 'เมนูโปรไฟล์' : 'Profile menu'}>
          <Link to="/map">{isThai ? 'แผนที่' : 'Map'}</Link>
          <button type="button" onClick={handleLogout}>{isThai ? 'ออกจากระบบ' : 'Log out'}</button>
        </nav>
      </header>

      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">ส</div>
          <button type="button" className="profile-camera" aria-label={isThai ? 'เปลี่ยนรูปโปรไฟล์' : 'Change profile photo'}>⌑</button>
        </div>
        <div className="profile-identity">
          <h1 id="profile-title">ชื่อผู้ใช้</h1>
          <p>@username · เข้าร่วมเมื่อ มกราคม 2025</p>
          <button type="button" className="profile-edit-button">แก้ไขโปรไฟล์</button>
        </div>
        <div className="profile-stats"><div><strong>5</strong><span>วัดที่เคยไป</span></div><div><strong>3</strong><span>สมุดตราประทับ</span></div></div>
      </section>

      <div className="profile-main">
        <section className="profile-card profile-stamp-card" aria-labelledby="stamp-title">
          <div className="profile-card-heading"><div><h2 id="stamp-title">สมุดตราประทับ</h2><p>เก็บตราประทับเมื่อเช็คอินที่วัด</p></div><span>{stamps.filter((stamp) => stamp.visited).length} / {stamps.length}</span></div>
          <div className="profile-stamps">
            {stamps.map((stamp) => <div className={`profile-stamp${stamp.visited ? '' : ' is-empty'}`} key={stamp.name}>
              <div className="profile-stamp-mark" style={{ transform: `rotate(${stamp.rotation}deg)` }}><CrossIcon muted={!stamp.visited} /></div>
              <strong>{stamp.name}</strong><small>{stamp.place}</small>
            </div>)}
          </div>
        </section>
        <aside className="profile-side">
          <section className="profile-card profile-help-card"><h2>เก็บตราประทับอย่างไร</h2><p>เมื่อไปถึงวัด เปิดหน้าวัดแล้วกดเช็คอิน ระบบจะตรวจว่าตำแหน่งของคุณอยู่ใกล้วัดจริงก่อนประทับตรา</p><Link to="/map" className="profile-primary-button">เปิดแผนที่</Link></section>
          <section className="profile-card profile-privacy-card"><h2>ความเป็นส่วนตัว</h2><div className="profile-switch-row"><span>ให้ผู้อื่นเห็นสมุดตราประทับของฉัน</span><button type="button" role="switch" aria-checked={isPublic} aria-label="ให้ผู้อื่นเห็นสมุดตราประทับ" className={`profile-switch${isPublic ? ' is-on' : ''}`} onClick={() => setIsPublic((value) => !value)}><span /></button></div><p>ค่าเริ่มต้นคือเห็นได้เฉพาะคุณ</p></section>
        </aside>
      </div>
    </main>
  )
}
