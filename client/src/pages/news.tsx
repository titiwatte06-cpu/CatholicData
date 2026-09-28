import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import { useLanguage } from '../LanguageContext'
import logo from '../assets/logo.svg'

type CatholicNews = {
  _id: string
  title: string
  url: string
  publishedDate: string
  excerpt: string
  imageUrl: string
}

type NewsPageResponse = {
  items: CatholicNews[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const newsText = {
  th: {
    title: 'ข่าว & กิจกรรม',
    back: '← กลับหน้าแรก',
    loading: 'กำลังโหลดข่าวคาทอลิก...',
    error: 'โหลดข่าวไม่สำเร็จ',
    retry: 'ลองอีกครั้ง',
    empty: 'ยังไม่มีข่าวในระบบ',
    source: 'อ่านข่าวต้นฉบับ',
    sourceLabel: 'แหล่งข่าว: สื่อมวลชนคาทอลิกประเทศไทย',
    previous: 'ก่อนหน้า',
    next: 'ถัดไป',
    page: 'หน้า',
  },
  en: {
    title: 'News & Events',
    back: '← Back to home',
    loading: 'Loading Catholic news...',
    error: 'Could not load the news',
    retry: 'Try again',
    empty: 'No news is available yet',
    source: 'Read original article',
    sourceLabel: 'Source: Catholic Media Thailand',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
  },
}

function formatNewsDate(date: string, lang: 'th' | 'en') {
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en', { dateStyle: 'long' }).format(parsed)
}

export function NewsPage() {
  const { lang, toggleLang } = useLanguage()
  const text = newsText[lang]
  const [news, setNews] = useState<CatholicNews[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    fetch(`${API_BASE_URL}/api/news?page=${page}&limit=${pageSize}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Catholic news request failed')
        return response.json() as Promise<NewsPageResponse>
      })
      .then((result) => {
        setNews(result.items)
        setTotalPages(result.totalPages)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, pageSize, retryKey])

  return (
    <main className="content-page">
      <header className="home-topbar">
        <Link to="/" className="home-brand" aria-label={text.back}>
          <img src={logo} alt="วัดคาทอลิก" className="home-logo" />
        </Link>
        <button type="button" className="home-btn home-btn-outline home-lang-btn" onClick={toggleLang}>
          {lang === 'th' ? 'EN' : 'Thai'}
        </button>
      </header>

      <section className="content-hero news-page-content">
        <Link to="/" className="content-back">{text.back}</Link>
        <h1>{text.title}</h1>
        {loading ? (
          <p className="content-empty" role="status">{text.loading}</p>
        ) : error ? (
          <div className="content-empty">
            <p>{text.error}</p>
            <button type="button" className="content-retry" onClick={() => setRetryKey((value) => value + 1)}>{text.retry}</button>
          </div>
        ) : news.length === 0 ? (
          <p className="content-empty">{text.empty}</p>
        ) : (
          <div className="external-news-list">
            {news.map((item) => (
              <article className="external-news-item" key={item._id ?? item.url}>
                {item.imageUrl && (
                  <img
                    className="external-news-image"
                    src={`${API_BASE_URL}/api/news/image?url=${encodeURIComponent(item.imageUrl)}`}
                    alt=""
                    loading="lazy"
                    onError={(event) => { event.currentTarget.hidden = true }}
                  />
                )}
                <div className="external-news-body">
                  <time className="external-news-date" dateTime={item.publishedDate}>{formatNewsDate(item.publishedDate, lang)}</time>
                  <h2>{item.title}</h2>
                  {item.excerpt && <p>{item.excerpt}</p>}
                  <div className="external-news-footer">
                    <span>{text.sourceLabel}</span>
                    <a href={item.url} target="_blank" rel="noreferrer">{text.source} ↗</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && !error && news.length > 0 && (
          <nav className="news-pagination" aria-label={lang === 'th' ? 'แบ่งหน้าข่าว' : 'News pagination'}>
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
              {text.previous}
            </button>
            <span>{text.page} {page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
              {text.next}
            </button>
          </nav>
        )}
      </section>
    </main>
  )
}
