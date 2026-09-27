import axios from 'axios'
import * as cheerio from 'cheerio'

const archiveUrl = 'https://kamsonbkk.com/dailyreading/2012-03-09-06-41-09'
const requestConfig = {
  timeout: 20000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatholicDataPreview/1.0)' },
}

function parseThaiDate(text) {
  const match = text.match(/(\d{1,2})\s+([ก-๙]+)\s+(\d{4})/)
  if (!match) return null
  const months = {
    'มกราคม': 1, 'กุมภาพันธ์': 2, 'มีนาคม': 3, 'เมษายน': 4,
    'พฤษภาคม': 5, 'มิถุนายน': 6, 'กรกฎาคม': 7, 'สิงหาคม': 8,
    'กันยายน': 9, 'ตุลาคม': 10, 'พฤศจิกายน': 11, 'ธันวาคม': 12,
  }
  const month = months[match[2]]
  if (!month) return null
  return `${Number(match[3]) - 543}-${String(month).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`
}

async function testDailyReadingFetch() {
  const archiveResponse = await axios.get(archiveUrl, requestConfig)
  const archive = cheerio.load(archiveResponse.data)
  const firstLink = archive('td.list-title a[href*="/dailyreading/"]').first()
  if (!firstLink.length) throw new Error('No reading links found with td.list-title a[href*="/dailyreading/"]')

  const sourceUrl = new URL(firstLink.attr('href'), archiveUrl).href
  const articleResponse = await axios.get(sourceUrl, requestConfig)
  const $ = cheerio.load(articleResponse.data)
  const title = $('#component h2').first().text().replace(/\s+/g, ' ').trim()
  const articleContainer = $('.item-page').first()
  const articleText = articleContainer.text().replace(/\s+/g, ' ').trim()
  const publishedDateText = articleText.match(/เผยแพร่เมื่อ:\s*([^ฮ]+?)\s+สร้างเมื่อ:/)?.[1]?.trim() ?? null
  const paragraphs = articleContainer.find('p').toArray()
    .map((paragraph) => $(paragraph).text().replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const contentParagraphs = paragraphs.filter((paragraph) => paragraph !== title && !/^เผยแพร่เมื่อ:|^สร้างเมื่อ:|^เขียนโดย/.test(paragraph))
  const content = contentParagraphs.join('\n\n')

  console.log(`Archive HTTP: ${archiveResponse.status}`)
  console.log(`Article HTTP: ${articleResponse.status}`)
  console.log(`Archive selector: td.list-title a[href*="/dailyreading/"]`)
  console.log(`Article title selector: #component h2`)
  console.log(`Article content selector: .item-page p`)
  console.log(`Archive's first entry: ${firstLink.text().replace(/\s+/g, ' ').trim()}`)
  console.log('\nExtracted preview:')
  console.log(JSON.stringify({
    title,
    date: parseThaiDate(publishedDateText ?? ''),
    publishedDateText,
    contentParagraphCount: contentParagraphs.length,
    contentPreview: content.slice(0, 700),
    sourceUrl,
  }, null, 2))
}

testDailyReadingFetch().catch((error) => {
  console.error('Daily reading fetch test failed:', error.response?.status, error.message)
  process.exitCode = 1
})
