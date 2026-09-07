import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLanguage } from '../LanguageContext'
import logo from '../assets/logo.svg'

export type Sermon = {
  id: string
  title: string
  titleEn?: string
  preacher: string
  preacherEn?: string
  date: string
  scripture?: string
  scriptureEn?: string
  summary: string
  summaryEn?: string
  content: string
  contentEn?: string
  audioUrl?: string
  videoUrl?: string
}

// ข้อมูลจำลองสำหรับแสดงผลก่อนเชื่อมต่อ backend
export const sermons: Sermon[] = [
  {
    id: 'follow-me',
    title: 'จงตามเรามา',
    titleEn: 'Follow Me',
    preacher: 'คุณพ่อสมชาย ใจดี',
    preacherEn: 'Fr. Somchai Jaidee',
    date: '2026-09-06',
    scripture: 'มัทธิว 4:19',
    scriptureEn: 'Matthew 4:19',
    summary: 'พระเยซูเจ้าทรงเชื้อเชิญเราให้ติดตามพระองค์ด้วยความเชื่อและความไว้วางใจ',
    summaryEn: 'Jesus invites us to follow Him with faith and trust.',
    content:
      'พระเยซูเจ้าทรงเรียกเราแต่ละคนให้เดินติดตามพระองค์ในชีวิตประจำวัน ความเชื่อไม่ได้หมายถึงการไม่มีปัญหา แต่หมายถึงการไว้วางใจว่าพระองค์จะทรงเดินไปพร้อมกับเรา\n\nเมื่อเราตอบรับคำเชิญของพระองค์ ชีวิตของเราจะกลายเป็นพยานแห่งความรักและความหวังให้กับผู้อื่น',
    contentEn:
      'Jesus calls each of us to follow Him in our daily lives. Faith does not mean having no problems; it means trusting that He walks with us.\n\nWhen we accept His invitation, our lives become witnesses of love and hope to others.',
  },
  {
    id: 'light-of-the-world',
    title: 'ท่านทั้งหลายเป็นความสว่างของโลก',
    titleEn: 'You Are the Light of the World',
    preacher: 'คุณพ่อประเสริฐ เมตตาธรรม',
    preacherEn: 'Fr. Prasert Metthatham',
    date: '2026-08-30',
    scripture: 'มัทธิว 5:14-16',
    scriptureEn: 'Matthew 5:14-16',
    summary: 'คริสตชนได้รับเรียกให้เป็นแสงสว่างผ่านการกระทำเล็ก ๆ แห่งความรัก',
    summaryEn: 'Christians are called to be light through small acts of love.',
    content:
      'ความสว่างของคริสตชนไม่ได้เกิดจากความสามารถของเราเอง แต่เกิดจากพระคริสตเจ้าผู้ทรงส่องสว่างผ่านชีวิตของเรา\n\nขอให้การกระทำเล็ก ๆ ในแต่ละวันของเราเป็นแสงสว่างและกำลังใจแก่คนรอบข้าง',
    contentEn:
      'The light of a Christian does not come from our own ability, but from Christ shining through our lives.\n\nMay our small actions each day become light and encouragement for those around us.',
  },
  {
    id: 'love-one-another',
    title: 'จงรักกันและกัน',
    titleEn: 'Love One Another',
    preacher: 'คุณพ่อวิชัย ศิริพร',
    preacherEn: 'Fr. Wichai Siriporn',
    date: '2026-08-23',
    scripture: 'ยอห์น 13:34',
    scriptureEn: 'John 13:34',
    summary: 'ความรักของพระคริสตเจ้าคือแบบอย่างสำหรับการอยู่ร่วมกันในชุมชน',
    summaryEn: 'Christ’s love is our model for living together as a community.',
    content:
      'พระเยซูเจ้าทรงมอบบทบัญญัติใหม่แก่เรา คือให้เรารักกันและกันเช่นเดียวกับที่พระองค์ทรงรักเรา\n\nความรักเช่นนี้เรียกร้องการให้อภัย การรับฟัง และการเสียสละเพื่อผู้อื่น',
    contentEn:
      'Jesus gives us a new commandment: to love one another as He has loved us.\n\nThis love calls us to forgive, listen, and sacrifice for others.',
  },
]

const sermonText = {
  th: {
    eyebrow: 'บทเทศน์',
    heading: 'บทเทศน์',
    back: '← กลับหน้าแรก',
    detailBack: '← กลับรายการบทเทศน์',
    preacher: 'ผู้เทศน์',
    date: 'วันที่',
    scripture: 'พระคัมภีร์',
    audio: 'ฟังบทเทศน์',
    video: 'ชมวิดีโอบทเทศน์',
    readMore: 'อ่านบทเทศน์',
  },
  en: {
    eyebrow: 'Sermons',
    heading: 'Sermons',
    back: '← Back to home',
    detailBack: '← Back to sermons',
    preacher: 'Preacher',
    date: 'Date',
    scripture: 'Scripture',
    audio: 'Listen to sermon',
    video: 'Watch sermon video',
    readMore: 'Read sermon',
  },
}

function SermonLayout({ children }: { children: ReactNode }) {
  const { lang, toggleLang } = useLanguage()
  const t = sermonText[lang]

  return (
    <main className="content-page">
      <header className="home-topbar">
        <Link to="/" className="home-brand">
          <img src={logo} alt="วัดคาทอลิก" className="home-logo" />
        </Link>

        <button
          type="button"
          className="home-btn home-btn-outline home-lang-btn"
          onClick={toggleLang}
        >
          {lang === 'th' ? 'EN' : 'Thai'}
        </button>
      </header>

      <section className="content-hero">
        {children}
      </section>
    </main>
  )
}

export function SermonsPage() {
  const { lang } = useLanguage()
  const t = sermonText[lang]

  return (
    <SermonLayout>
      <Link to="/" className="content-back">{t.back}</Link>
      
      <h1>{t.heading}</h1>

      <div className="sermon-list">
        {sermons.map((sermon) => {
          const title = lang === 'en' ? sermon.titleEn ?? sermon.title : sermon.title
          const preacher = lang === 'en'
            ? sermon.preacherEn ?? sermon.preacher
            : sermon.preacher
          const summary = lang === 'en'
            ? sermon.summaryEn ?? sermon.summary
            : sermon.summary
          const scripture = lang === 'en'
            ? sermon.scriptureEn ?? sermon.scripture
            : sermon.scripture

          return (
            <Link
              key={sermon.id}
              to={`/sermons/${sermon.id}`}
              className="sermon-card"
            >
              <div className="sermon-card-top">
                <span className="sermon-date">{sermon.date}</span>
                {scripture && <span className="sermon-tag">{scripture}</span>}
              </div>

              <h2>{title}</h2>
              <p>{summary}</p>

              <div className="sermon-card-footer">
                <span>{t.preacher}: {preacher}</span>
                <strong>{t.readMore} →</strong>
              </div>
            </Link>
          )
        })}
      </div>
    </SermonLayout>
  )
}

export function SermonDetailPage() {
  const { sermonId } = useParams()
  const { lang } = useLanguage()
  const t = sermonText[lang]
  const sermon = sermons.find((item) => item.id === sermonId)

  if (!sermon) {
    return (
      <SermonLayout>
        <Link to="/sermons" className="content-back">{t.detailBack}</Link>
        
        <h1>{t.heading}</h1>
        <p className="content-empty">
          ไม่พบบทเทศน์ที่ต้องการ
        </p>
      </SermonLayout>
    )
  }

  const title = lang === 'en' ? sermon.titleEn ?? sermon.title : sermon.title
  const preacher = lang === 'en'
    ? sermon.preacherEn ?? sermon.preacher
    : sermon.preacher
  const scripture = lang === 'en'
    ? sermon.scriptureEn ?? sermon.scripture
    : sermon.scripture
  const content = lang === 'en'
    ? sermon.contentEn ?? sermon.content
    : sermon.content

  return (
    <SermonLayout>
      <Link to="/sermons" className="content-back">{t.detailBack}</Link>
      <p className="eyebrow">{t.eyebrow}</p>

      <article className="sermon-detail">
        <h1>{title}</h1>

        <div className="sermon-detail-meta">
          <span>{t.preacher}: {preacher}</span>
          <span>{t.date}: {sermon.date}</span>
        </div>

        {scripture && (
          <p className="sermon-scripture">
            {t.scripture}: {scripture}
          </p>
        )}

        <div className="sermon-content">
          {content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {(sermon.audioUrl || sermon.videoUrl) && (
          <div className="sermon-media">
            {sermon.audioUrl && (
              <section>
                <h2>{t.audio}</h2>
                <audio controls src={sermon.audioUrl} />
              </section>
            )}

            {sermon.videoUrl && (
              <section>
                <h2>{t.video}</h2>
                <iframe
                  src={sermon.videoUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </section>
            )}
          </div>
        )}
      </article>
    </SermonLayout>
  )
}