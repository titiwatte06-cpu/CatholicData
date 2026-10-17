import { Link } from 'react-router-dom'
import { useLanguage } from '../LanguageContext'

export function ContentPage({ title, english }: { title: string; english: string }) {
  const { lang, toggleLang } = useLanguage()
  const isAbout = english === 'About Us'
  const content = lang === 'th'
    ? isAbout
      ? {
          eyebrow: 'เกี่ยวกับ Catholic Data',
          title: 'พื้นที่ข้อมูลวัดคาทอลิก',
          body: 'เรากำลังเตรียมข้อมูลเกี่ยวกับเว็บไซต์และที่มาของข้อมูลวัด เพื่อให้ผู้ใช้เข้าใจขอบเขตและวิธีตรวจสอบข้อมูลได้ชัดเจน',
          items: ['วัตถุประสงค์ของเว็บไซต์', 'ผู้ดูแลและที่มาของข้อมูล', 'วิธีแจ้งแก้ไขข้อมูล'],
          action: 'สำรวจแผนที่วัด',
        }
      : {
          eyebrow: 'ติดต่อ Catholic Data',
          title: 'ช่องทางติดต่อ',
          body: 'ช่องทางติดต่อกำลังอยู่ระหว่างจัดเตรียม ข้อมูลจะเพิ่มในหน้านี้เมื่อได้รับการยืนยัน',
          items: ['อีเมลหรือโทรศัพท์', 'เพจหรือช่องทางออนไลน์', 'เวลาที่สามารถติดต่อได้'],
          action: 'กลับไปสำรวจแผนที่',
        }
    : isAbout
      ? {
          eyebrow: 'About Catholic Data',
          title: 'A directory for Catholic churches',
          body: 'We are preparing information about this website and its church data sources so visitors can understand the directory and how to verify its information.',
          items: ['Purpose of the website', 'Data owners and sources', 'How to request a correction'],
          action: 'Explore the church map',
        }
      : {
          eyebrow: 'Contact Catholic Data',
          title: 'Contact information',
          body: 'Contact channels are being prepared and will be added here once confirmed.',
          items: ['Email or phone', 'Official social channels', 'Available contact hours'],
          action: 'Explore the church map',
        }

  return (
    <main className="content-page">
      <header className="home-topbar">
        <Link to="/" className="home-brand" aria-label={lang === 'th' ? 'กลับหน้าแรก' : 'Back to home'}>
          <span className="home-brand-mark" aria-hidden="true">✝</span>
          <span>Catholic Data</span>
        </Link>
        <button type="button" className="home-btn home-btn-outline home-lang-btn" onClick={toggleLang}>
          {lang === 'th' ? 'EN' : 'ไทย'}
        </button>
      </header>
      <section className="content-hero info-page-content">
        <Link to="/" className="content-back">{lang === 'th' ? '← กลับหน้าแรก' : '← Back to home'}</Link>
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{isAbout ? content.title : lang === 'th' ? title : content.title}</h1>
        <p className="info-page-intro">{content.body}</p>
        <section className="info-page-card" aria-labelledby="info-page-details">
          <h2 id="info-page-details">{lang === 'th' ? 'ข้อมูลที่จะเผยแพร่ในหน้านี้' : 'Information planned for this page'}</h2>
          <ul>{content.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <Link to="/map" className="content-primary-link">{content.action}<span aria-hidden="true">→</span></Link>
      </section>
    </main>
  )
}
