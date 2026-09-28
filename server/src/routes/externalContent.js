import { timingSafeEqual } from 'node:crypto'
import axios from 'axios'
import express from 'express'
import CatholicNews from '../models/CatholicNews.js'
import DailyReading from '../models/DailyReading.js'
import { refreshExternalContent } from '../services/externalContent.js'

const router = express.Router()

function bangkokDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(Date.now())
}

router.get('/daily-reading/today', async (_req, res) => {
  try {
    const today = bangkokDateString()
    const reading = await DailyReading.findOne({ readingDate: today }).lean()
      ?? await DailyReading.findOne({ readingDate: { $lte: today } }).sort({ readingDate: -1 }).lean()
      ?? await DailyReading.findOne().sort({ readingDate: -1 }).lean()

    if (!reading) return res.status(404).json({ message: 'ยังไม่มีข้อมูลบทอ่านประจำวัน' })
    res.json(reading)
  } catch (error) {
    console.error('Daily reading query failed:', error)
    res.status(500).json({ message: 'โหลดบทอ่านประจำวันไม่สำเร็จ' })
  }
})

router.get('/news', async (_req, res) => {
  try {
    const requestedPage = Number.parseInt(_req.query.page, 10) || 1
    const requestedPageSize = Number.parseInt(_req.query.limit, 10) || 10
    const pageSize = Math.min(Math.max(requestedPageSize, 1), 20)
    const total = await CatholicNews.countDocuments()
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(Math.max(requestedPage, 1), totalPages)
    const items = await CatholicNews.find()
      .sort({ publishedDate: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()
    res.json({ items, page, pageSize, total, totalPages })
  } catch (error) {
    console.error('Catholic news query failed:', error)
    res.status(500).json({ message: 'โหลดข่าวคาทอลิกไม่สำเร็จ' })
  }
})

router.get('/news/image', async (req, res) => {
  let imageUrl
  try {
    imageUrl = new URL(String(req.query.url ?? ''))
  } catch {
    return res.status(400).json({ message: 'Invalid image URL' })
  }

  if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'www.catholic.or.th' || !imageUrl.pathname.startsWith('/main/images/news/')) {
    return res.status(400).json({ message: 'Image URL is not allowed' })
  }

  try {
    const upstream = await axios.get(imageUrl.href, { responseType: 'stream', timeout: 15000 })
    const contentType = upstream.headers['content-type'] ?? ''
    const contentLength = Number(upstream.headers['content-length'] ?? 0)
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(contentType) || contentLength > 5 * 1024 * 1024) {
      upstream.data.destroy()
      return res.status(502).json({ message: 'News image is unavailable' })
    }

    res.set('Content-Type', contentType)
    res.set('Cache-Control', 'public, max-age=86400')
    upstream.data.on('error', (error) => {
      console.error('Catholic news image stream failed:', error.message)
      if (res.headersSent) res.destroy(error)
      else res.status(502).end()
    })
    upstream.data.pipe(res)
  } catch (error) {
    console.error('Catholic news image proxy failed:', error.message)
    res.status(502).json({ message: 'News image is unavailable' })
  }
})

router.post('/content/refresh', async (req, res) => {
  const expectedToken = process.env.CONTENT_REFRESH_SECRET
  const authorization = req.get('authorization') ?? ''
  const suppliedToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''

  if (!expectedToken) return res.status(503).json({ message: 'Content refresh endpoint is not configured' })
  const suppliedBuffer = Buffer.from(suppliedToken)
  const expectedBuffer = Buffer.from(expectedToken)
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const outcome = await refreshExternalContent()
  const failed = outcome.dailyReading === 'failed' || outcome.news === 'failed'
  res.status(failed ? 207 : 200).json(outcome)
})

export default router
