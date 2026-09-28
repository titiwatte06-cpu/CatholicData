import axios from 'axios'
import * as cheerio from 'cheerio'
import DailyReading from '../models/DailyReading.js'
import CatholicNews from '../models/CatholicNews.js'

const DAILY_READING_ARCHIVE_URL = 'https://kamsonbkk.com/dailyreading/2012-03-09-06-41-09'
const CATHOLIC_NEWS_URL = 'https://www.catholic.or.th/main/index.php?option=com_content&view=category&id=72&Itemid=369'
const NEWS_PAGE_SIZE = 5
const NEWS_TARGET_COUNT = 50
const NEWS_PAGE_COUNT = Math.ceil(NEWS_TARGET_COUNT / NEWS_PAGE_SIZE)
const NEWS_ARTICLE_CONCURRENCY = 5
const USER_AGENT = 'Mozilla/5.0 (compatible; CatholicDataApp/1.0)'
const MAX_EXCERPT_LENGTH = 280
const thaiMonths = {
  'มกราคม': 1, 'กุมภาพันธ์': 2, 'มีนาคม': 3, 'เมษายน': 4,
  'พฤษภาคม': 5, 'มิถุนายน': 6, 'กรกฎาคม': 7, 'สิงหาคม': 8,
  'กันยายน': 9, 'ตุลาคม': 10, 'พฤศจิกายน': 11, 'ธันวาคม': 12,
}
const thaiWeekdays = {
  'อาทิตย์': 0,
  'จันทร์': 1,
  'อังคาร': 2,
  'พุธ': 3,
  'พฤหัสบดี': 4,
  'ศุกร์': 5,
  'เสาร์': 6,
}

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: 20000,
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
  })
  return response.data
}

function parseThaiDate(text) {
  const numericDate = text.match(/(\d{1,2})-(\d{1,2})-(\d{4})/)
  if (numericDate) {
    const year = Number(numericDate[3]) > 2400 ? Number(numericDate[3]) - 543 : Number(numericDate[3])
    return `${year}-${String(Number(numericDate[2])).padStart(2, '0')}-${String(Number(numericDate[1])).padStart(2, '0')}`
  }

  const namedDate = text.match(/(\d{1,2})\s+([ก-๙]+),?\s+(\d{4})/)
  if (!namedDate || !thaiMonths[namedDate[2]]) return null
  const year = Number(namedDate[3]) > 2400 ? Number(namedDate[3]) - 543 : Number(namedDate[3])
  return `${year}-${String(thaiMonths[namedDate[2]]).padStart(2, '0')}-${String(Number(namedDate[1])).padStart(2, '0')}`
}

export function getReadingDate(title, publishedDate) {
  const weekdayName = title.match(/จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์/)?.[0]
  const targetWeekday = thaiWeekdays[weekdayName]
  if (targetWeekday === undefined) return null

  const [year, month, day] = publishedDate.split('-').map(Number)
  const publishedTimestamp = Date.UTC(year, month - 1, day)
  const publishedWeekday = new Date(publishedTimestamp).getUTCDay()
  const dayOffset = (targetWeekday - publishedWeekday + 7) % 7
  const readingTimestamp = publishedTimestamp + dayOffset * 24 * 60 * 60 * 1000
  const readingDate = new Date(readingTimestamp)
  const readingYear = readingDate.getUTCFullYear()
  const readingMonth = String(readingDate.getUTCMonth() + 1).padStart(2, '0')
  const readingDay = String(readingDate.getUTCDate()).padStart(2, '0')
  return `${readingYear}-${readingMonth}-${readingDay}`
}

function toExcerpt(text) {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_EXCERPT_LENGTH)
}

function removeLeadingEventDate(text) {
  return text.replace(/^(?:วัน)?(?:จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์)(?:ที่)?\s+\d{1,2}\s+[ก-๙]+\s+(?:(?:ค\.ศ\.)\s*)?\d{4}(?:\s*\/\s*\d{4})?\s*/, '').trim()
}

export async function scrapeDailyReadingArticle(sourceUrl) {
  const articleHtml = await fetchHtml(sourceUrl)
  const $ = cheerio.load(articleHtml)
  const articleContainer = $('.item-page').first()
  const title = $('#component h2').first().text().replace(/\s+/g, ' ').trim()
  const articleText = articleContainer.text().replace(/\s+/g, ' ').trim()
  const publishedDateText = articleText.match(/เผยแพร่เมื่อ:\s*(.+?)\s+สร้างเมื่อ:/)?.[1] ?? ''
  const publishedDate = parseThaiDate(publishedDateText)
  const readingDate = publishedDate && getReadingDate(title, publishedDate)
  const contentParagraphs = articleContainer.find('p').toArray()
    .map((paragraph) => $(paragraph).text().replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph && paragraph !== title && !/^เผยแพร่เมื่อ:|^สร้างเมื่อ:|^เขียนโดย/.test(paragraph))
  const content = contentParagraphs.join('\n\n')

  if (!title || !publishedDate || !readingDate || !content) throw new Error('Daily reading page did not contain the expected title, dates, and content')
  return { publishedDate, readingDate, title, content, sourceUrl }
}

export async function scrapeDailyReading() {
  const archiveHtml = await fetchHtml(DAILY_READING_ARCHIVE_URL)
  const archive = cheerio.load(archiveHtml)
  const firstLink = archive('td.list-title a[href*="/dailyreading/"]').first()
  if (!firstLink.length) throw new Error('Daily reading archive contains no reading links')

  const sourceUrl = new URL(firstLink.attr('href'), DAILY_READING_ARCHIVE_URL).href
  return scrapeDailyReadingArticle(sourceUrl)
}

export async function scrapeCatholicNews() {
  const articleLinksByUrl = new Map()
  for (let pageIndex = 0; pageIndex < NEWS_PAGE_COUNT; pageIndex += 1) {
    const pageUrl = new URL(CATHOLIC_NEWS_URL)
    pageUrl.searchParams.set('limitstart', String(pageIndex * NEWS_PAGE_SIZE))
    const categoryHtml = await fetchHtml(pageUrl.href)
    const $ = cheerio.load(categoryHtml)
    $('td.list-title a[href*="option=com_content"][href*="view=article"]').each((_, element) => {
      const url = new URL($(element).attr('href'), pageUrl.href).href
      articleLinksByUrl.set(url, { title: $(element).text().replace(/\s+/g, ' ').trim(), url })
    })
    if (articleLinksByUrl.size >= NEWS_TARGET_COUNT) break
  }
  const articleLinks = [...articleLinksByUrl.values()].slice(0, NEWS_TARGET_COUNT)
  if (!articleLinks.length) throw new Error('Catholic news category contains no article links')

  const scrapeArticle = async ({ title: linkedTitle, url }) => {
    const articleHtml = await fetchHtml(url)
    const article = cheerio.load(articleHtml)
    const articleContent = article('.articleContent').first()
    const title = article('#component h2').first().text().replace(/\s+/g, ' ').trim() || linkedTitle
    const metadata = article('dl.article-info').text().replace(/\s+/g, ' ').trim()
    const publishedDate = parseThaiDate(metadata)
    const paragraphs = articleContent.find('p').toArray()
      .map((paragraph) => article(paragraph).text().replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    const firstBodyParagraph = paragraphs.find((paragraph) => paragraph.length > 30) ?? articleContent.text().replace(/\s+/g, ' ').trim()
    const excerpt = toExcerpt(removeLeadingEventDate(firstBodyParagraph.replace(title, '').trim()))
    const imageUrl = articleContent.find('img[src]').toArray()
      .map((image) => new URL(article(image).attr('src'), url).href)
      .find((image) => !/printButton|emailButton/.test(image)) ?? ''

    if (!title || !publishedDate) throw new Error(`News article is missing title or publication date: ${url}`)
    return { title, url, publishedDate, excerpt, imageUrl }
  }

  const news = []
  for (let offset = 0; offset < articleLinks.length; offset += NEWS_ARTICLE_CONCURRENCY) {
    const batch = articleLinks.slice(offset, offset + NEWS_ARTICLE_CONCURRENCY)
    news.push(...await Promise.all(batch.map(scrapeArticle)))
  }

  return news
}

export async function refreshDailyReading() {
  const reading = await scrapeDailyReading()
  return DailyReading.findOneAndUpdate(
    { readingDate: reading.readingDate },
    { $set: reading },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )
}

export async function refreshCatholicNews() {
  const news = await scrapeCatholicNews()
  const operations = news.map((item) => ({
    updateOne: {
      filter: { url: item.url },
      update: { $set: item },
      upsert: true,
    },
  }))
  await CatholicNews.bulkWrite(operations, { ordered: false })

  const olderNews = await CatholicNews.find()
    .sort({ publishedDate: -1, createdAt: -1 })
    .skip(NEWS_TARGET_COUNT)
    .select('_id')
    .lean()
  if (olderNews.length) {
    await CatholicNews.deleteMany({ _id: { $in: olderNews.map((item) => item._id) } })
  }

  return { count: news.length }
}

export async function refreshExternalContent() {
  const outcomes = await Promise.allSettled([refreshDailyReading(), refreshCatholicNews()])
  const [dailyResult, newsResult] = outcomes

  if (dailyResult.status === 'rejected') console.error('Daily reading refresh failed:', dailyResult.reason)
  if (newsResult.status === 'rejected') console.error('Catholic news refresh failed:', newsResult.reason)

  return {
    dailyReading: dailyResult.status === 'fulfilled' ? 'updated' : 'failed',
    news: newsResult.status === 'fulfilled' ? newsResult.value.count : 'failed',
  }
}
