import axios from 'axios'
import * as cheerio from 'cheerio'

const sourceUrl = 'https://www.catholic.or.th/main/index.php?option=com_content&view=category&id=72&Itemid=369'
const requestConfig = {
  timeout: 20000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatholicDataPreview/1.0)' },
}

function parseThaiPublishedDate(text) {
  const numericDate = text.match(/(\d{1,2})-(\d{1,2})-(\d{4})/)
  if (numericDate) {
    const year = Number(numericDate[3]) - 543
    return `${year}-${String(Number(numericDate[2])).padStart(2, '0')}-${String(Number(numericDate[1])).padStart(2, '0')}`
  }

  const match = text.match(/(\d{1,2})\s+([ก-๙]+),?\s+(\d{4})/)
  if (!match) return null
  const months = {
    'มกราคม': 1, 'กุมภาพันธ์': 2, 'มีนาคม': 3, 'เมษายน': 4,
    'พฤษภาคม': 5, 'มิถุนายน': 6, 'กรกฎาคม': 7, 'สิงหาคม': 8,
    'กันยายน': 9, 'ตุลาคม': 10, 'พฤศจิกายน': 11, 'ธันวาคม': 12,
  }
  const month = months[match[2]]
  if (!month) return null
  const year = Number(match[3]) - 543
  return `${year}-${String(month).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`
}

function removeLeadingEventDate(text) {
  return text.replace(/^(?:วัน)?(?:จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์|อาทิตย์)(?:ที่)?\s+\d{1,2}\s+[ก-๙]+\s+(?:(?:ค\.ศ\.)\s*)?\d{4}(?:\s*\/\s*\d{4})?\s*/, '').trim()
}

async function testCatholicNewsFetch() {
  const categoryResponse = await axios.get(sourceUrl, requestConfig)
  const $ = cheerio.load(categoryResponse.data)
  const newsLinks = $('td.list-title a[href*="option=com_content"][href*="view=article"]').toArray()
  if (!newsLinks.length) throw new Error('No news links found in td.list-title')

  console.log(`Category HTTP: ${categoryResponse.status}`)
  console.log(`News links found with td.list-title a[href*="view=article"]: ${newsLinks.length}`)
  console.log(`Date conversion example 26-09-2569 -> ${parseThaiPublishedDate('26-09-2569')}`)

  const results = []
  for (const element of newsLinks.slice(0, 5)) {
    const link = $(element)
    const title = link.text().replace(/\s+/g, ' ').trim()
    const url = new URL(link.attr('href'), sourceUrl).href
    const response = await axios.get(url, requestConfig)
    const article = cheerio.load(response.data)
    const articleContent = article('.articleContent').first()
    const metadata = article('dl.article-info').text().replace(/\s+/g, ' ').trim()
    const publishedDate = parseThaiPublishedDate(metadata)
    const paragraphs = articleContent.find('p').toArray()
      .map((paragraph) => article(paragraph).text().replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    const firstParagraph = paragraphs.find((paragraph) => paragraph.length > 30) ?? articleContent.text().replace(/\s+/g, ' ').trim()
    const excerpt = removeLeadingEventDate(firstParagraph.replace(title, '').trim()).slice(0, 320)
    const imageUrl = articleContent.find('img[src]').toArray()
      .map((image) => new URL(article(image).attr('src'), url).href)
      .find((image) => !/printButton|emailButton/.test(image)) ?? null

    results.push({
      title: article('#component h2').first().text().replace(/\s+/g, ' ').trim() || title,
      url,
      publishedDate,
      publishedDateSourceText: metadata,
      excerpt: excerpt.slice(0, 320),
      imageUrl,
      selectors: {
        title: '#component h2',
        publishedDate: 'dl.article-info',
        excerpt: '.articleContent',
        image: '.articleContent img[src]',
      },
    })
  }

  console.log('\nExtracted news preview (first 5):')
  console.log(JSON.stringify(results, null, 2))
}

testCatholicNewsFetch().catch((error) => {
  console.error('Catholic news fetch test failed:', error.response?.status, error.message)
  process.exitCode = 1
})
