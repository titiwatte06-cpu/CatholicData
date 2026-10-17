import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../LanguageContext'

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

export function HomePage() {
  const { lang, toggleLang } = useLanguage()
  const t = homeText[lang]

  return (
    <main className="home-page">
      <header className="home-topbar">
        <span className="home-brand">
          <img src="/logo.svg" alt="วัดคาทอลิก" className="home-logo" />
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
          <Link to="/about" className="home-btn home-btn-outline">
            {t.ctaOutline}
          </Link>
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

