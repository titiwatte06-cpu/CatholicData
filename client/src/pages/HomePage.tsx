import { Link } from 'react-router-dom'
import { useLanguage } from '../LanguageContext'
import { useChurches } from '../hooks/useChurches'
import { useMinuteTick } from '../hooks/useMinuteTick'
import { getMassAlert } from '../utils/massAlert'

const landingText = {
  th: {
    home: 'หน้าแรก',
    map: 'แผนที่',
    sermons: 'บทเทศน์',
    news: 'ข่าวและกิจกรรม',
    contact: 'ติดต่อเรา',
    language: 'EN',
    badge: 'ขอเชิญทุกท่าน',
    title: <>ค้นหาวัดและเวลามิสซา<br />ใกล้คุณ</>,
    description: 'แผนที่วัดคาทอลิกพร้อมตารางมิสซา คุณพ่อเจ้าอาวาส และปุ่มนำทาง ใช้งานง่ายทั้งบนมือถือและคอมพิวเตอร์',
    viewMass: 'ดูตารางมิสซา',
    learnMore: 'เรียนรู้เพิ่มเติม',
    liveMass: 'วัดที่กำลังมีมิสซา',
    now: 'ตอนนี้',
    loading: 'กำลังโหลดข้อมูลวัด…',
    empty: 'ขณะนี้ไม่มีวัดที่กำลังมีมิสซา',
    loadError: 'โหลดข้อมูลวัดไม่สำเร็จ ลองดูวัดทั้งหมดบนแผนที่',
  },
  en: {
    home: 'Home',
    map: 'Map',
    sermons: 'Sermons',
    news: 'News & Events',
    contact: 'Contact',
    language: 'ไทย',
    badge: 'Welcome all',
    title: <>Find Catholic churches<br />and Mass times near you</>,
    description: 'Explore Catholic churches, Mass schedules, parish details, and directions in one easy map, on mobile or desktop.',
    viewMass: 'View Mass Schedule',
    learnMore: 'Learn More',
    liveMass: 'Churches with Mass now',
    now: 'Now',
    loading: 'Loading church information…',
    empty: 'No churches have Mass in progress right now.',
    loadError: 'Could not load church information. Browse all churches on the map.',
  },
}

export function HomePage() {
  const { lang, toggleLang } = useLanguage()
  const { churches, loading, error } = useChurches()
  const now = useMinuteTick()
  const t = landingText[lang]
  const activeMasses = churches
    .map((church) => ({ church, alert: getMassAlert(church, now) }))
    .filter(({ alert }) => alert.active)
    .slice(0, 3)

  return (
    <main className="landing-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600&family=Prompt:wght@400;500;600&display=swap');
        .landing-page, .landing-page * { box-sizing: border-box; }
        .landing-page {
          --landing-bg: #f4f6fa;
          --landing-ink: #14213d;
          --landing-muted: #5b6478;
          --landing-line: #d5dae5;
          --landing-line-soft: #e6eaf2;
          --landing-btn-border: #cbd2e0;
          --landing-white: #fff;
          --landing-gold: #c9a544;
          --landing-gold-soft: #f6efdd;
          --landing-gold-ink: #6f5314;
          --landing-green: #1e8a5a;
          --landing-green-soft: #e8f5ee;
          min-height: 100svh;
          padding: 24px 56px 56px;
          background: var(--landing-bg);
          color: var(--landing-ink);
          font-family: 'Noto Sans Thai', 'Prompt', sans-serif;
        }
        .landing-page a { color: inherit; text-decoration: none; }
        .landing-page a:focus-visible, .landing-page button:focus-visible {
          outline: 2px solid #2a4a8a;
          outline-offset: 3px;
        }
        .landing-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .landing-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          flex: 0 0 auto;
          font-family: 'Prompt', 'Noto Sans Thai', sans-serif;
          font-size: 18px;
          font-weight: 600;
        }
        .landing-brand-img {
          display: block;
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          object-fit: contain;
        }
        .landing-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          color: var(--landing-muted);
          font-size: 15px;
        }
        .landing-nav a { transition: color .16s ease; }
        .landing-nav a:hover { color: var(--landing-ink); }
        .landing-lang {
          flex: 0 0 auto;
          padding: 8px 18px;
          border: 1px solid var(--landing-line);
          border-radius: 999px;
          background: var(--landing-white);
          color: var(--landing-ink);
          font: 500 14px 'Noto Sans Thai', 'Prompt', sans-serif;
          cursor: pointer;
        }
        .landing-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          align-items: start;
          gap: 52px;
          margin-top: 80px;
        }
        .landing-hero-copy { min-width: 0; }
        .landing-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          background: var(--landing-gold-soft);
          color: var(--landing-gold-ink);
          font-size: 13px;
          font-weight: 500;
        }
        .landing-title {
          margin: 20px 0 16px;
          font-family: 'Prompt', 'Noto Sans Thai', sans-serif;
          font-size: 62px;
          font-weight: 600;
          line-height: 1.15;
          letter-spacing: -.025em;
        }
        .landing-description {
          max-width: 480px;
          margin: 0 0 32px;
          color: var(--landing-muted);
          font-size: 19px;
          line-height: 1.7;
        }
        .landing-cta { display: flex; flex-wrap: wrap; gap: 12px; }
        .landing-btn {
          display: inline-flex;
          min-height: 56px;
          align-items: center;
          justify-content: center;
          padding: 16px 30px;
          border: 1px solid var(--landing-btn-border);
          border-radius: 999px;
          background: var(--landing-white);
          color: var(--landing-ink);
          font-size: 15px;
          font-weight: 500;
          transition: background .16s ease, transform .16s ease;
        }
        .landing-btn:hover { transform: translateY(-1px); }
        .landing-btn-primary {
          border-color: var(--landing-ink);
          background: var(--landing-ink);
          color: var(--landing-white) !important;
        }
        .landing-btn-primary:hover { background: #20375f; }
        .landing-btn-secondary:hover { background: #f8f9fc; }
        .landing-live-card {
          width: 100%;
          max-width: 703px;
          justify-self: end;
          margin-top: 16px;
          padding: 28px;
          border: 1px solid rgba(213, 218, 229, .65);
          border-radius: 28px;
          background: var(--landing-white);
          box-shadow: 0 24px 60px rgba(20, 33, 61, .12);
        }
        .landing-live-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
          font-family: 'Prompt', 'Noto Sans Thai', sans-serif;
          font-size: 18px;
          font-weight: 600;
        }
        .landing-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
          color: var(--landing-green);
          font-family: 'Noto Sans Thai', 'Prompt', sans-serif;
          font-size: 12px;
          font-weight: 500;
        }
        .landing-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--landing-green);
        }
        .landing-mass-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid var(--landing-line-soft);
        }
        .landing-mass-row:last-child { padding-bottom: 0; border-bottom: 0; }
        .landing-mass-info { min-width: 0; }
        .landing-mass-name {
          overflow: hidden;
          font-weight: 500;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .landing-mass-sub { color: var(--landing-muted); font-size: 14px; }
        .landing-time {
          flex: 0 0 auto;
          padding: 6px 14px;
          border-radius: 999px;
          background: var(--landing-gold-soft);
          color: var(--landing-gold-ink);
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }
        .landing-live-empty { margin: 18px 0 2px; color: var(--landing-muted); font-size: 15px; line-height: 1.65; }
        @media (max-width: 1024px) {
          .landing-page { padding-right: 32px; padding-left: 32px; }
          .landing-hero { gap: 32px; margin-top: 68px; }
          .landing-title { font-size: clamp(42px, 5.9vw, 60px); }
          .landing-nav { gap: 16px; font-size: 14px; }
        }
        @media (max-width: 860px) {
          .landing-page { padding: 20px; }
          .landing-nav { display: none; }
          .landing-hero { grid-template-columns: minmax(0, 1fr); gap: 24px; margin-top: 40px; }
          .landing-title { font-size: clamp(44px, 7.4vw, 56px); }
          .landing-description { font-size: 18px; }
          .landing-live-card { justify-self: stretch; max-width: none; margin-top: 0; }
        }
        @media (max-width: 480px) {
          .landing-page { padding: 16px; }
          .landing-header { gap: 12px; }
          .landing-brand { gap: 9px; font-size: 16px; }
          .landing-lang { padding: 7px 14px; }
          .landing-hero { margin-top: 36px; }
          .landing-title { font-size: clamp(36px, 10vw, 44px); letter-spacing: -.03em; }
          .landing-description { margin-bottom: 24px; font-size: 16px; }
          .landing-cta { display: grid; grid-template-columns: 1fr; gap: 10px; }
          .landing-btn { width: 100%; min-height: 52px; padding: 14px 24px; }
          .landing-live-card { margin-top: 0; padding: 20px; border-radius: 24px; }
          .landing-live-head { font-size: 16px; }
          .landing-mass-row { gap: 10px; }
          .landing-mass-name { font-size: 14px; }
          .landing-mass-sub, .landing-time { font-size: 12px; }
          .landing-time { padding: 6px 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .landing-page *, .landing-page *::before, .landing-page *::after { transition: none !important; }
        }
      `}</style>

      <div className="landing-shell">
        <header className="landing-header">
          <Link to="/" className="landing-brand" aria-label={t.home}>
            <img src="/logo.svg" alt="" className="landing-brand-img" />
            <span>วัดคาทอลิก</span>
          </Link>

          <nav className="landing-nav" aria-label={lang === 'th' ? 'เมนูหลัก' : 'Main navigation'}>
            <Link to="/map">{t.map}</Link>
            <Link to="/sermons">{t.sermons}</Link>
            <Link to="/news">{t.news}</Link>
            <Link to="/contact">{t.contact}</Link>
          </nav>

          <button type="button" className="landing-lang" onClick={toggleLang} aria-label={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}>
            {t.language}
          </button>
        </header>

        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <span className="landing-badge">{lang === 'th' ? 'ขอเชิญทุกท่าน' : 'Welcome all'}</span>
            <h1 className="landing-title" id="landing-title">{t.title}</h1>
            <p className="landing-description">{t.description}</p>
            <div className="landing-cta">
              <Link to="/map" className="landing-btn landing-btn-primary">{t.viewMass}</Link>
              <Link to="/about" className="landing-btn landing-btn-secondary">{t.learnMore}</Link>
            </div>
          </div>

          <section className="landing-live-card" aria-labelledby="landing-live-title">
            <div className="landing-live-head">
              <span id="landing-live-title">{t.liveMass}</span>
              <span className="landing-status"><i className="landing-status-dot" aria-hidden="true" />{t.now}</span>
            </div>
            {loading && churches.length === 0 ? (
              <p className="landing-live-empty" role="status">{t.loading}</p>
            ) : error && churches.length === 0 ? (
              <p className="landing-live-empty" role="status">{t.loadError}</p>
            ) : activeMasses.length ? (
              activeMasses.map(({ church, alert }) => (
                <Link className="landing-mass-row" to={`/map/church/${church.id}`} key={church.id}>
                  <span className="landing-mass-info">
                    <span className="landing-mass-name">{lang === 'th' ? church.name : church.nameEn || church.name}</span>
                    <span className="landing-mass-sub">{lang === 'th' ? church.district : church.province || church.district}</span>
                  </span>
                  {alert.time && <span className="landing-time">{alert.time} {lang === 'th' ? 'น.' : ''}</span>}
                </Link>
              ))
            ) : (
              <p className="landing-live-empty" role="status">{t.empty}</p>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
