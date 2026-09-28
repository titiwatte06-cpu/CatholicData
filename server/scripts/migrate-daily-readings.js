import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import DailyReading from '../src/models/DailyReading.js'
import { scrapeDailyReadingArticle } from '../src/services/externalContent.js'

async function migrateDailyReadings() {
  await connectDB()
  const collection = DailyReading.collection
  const records = await collection.find({}).toArray()
  const migratedRecords = []

  for (const record of records) {
    const refreshed = record.sourceUrl ? await scrapeDailyReadingArticle(record.sourceUrl) : null
    const publishedDate = refreshed?.publishedDate ?? record.publishedDate ?? record.date
    const readingDate = refreshed?.readingDate ?? record.readingDate
    const title = refreshed?.title ?? record.title
    if (!publishedDate || !readingDate || !title) {
      throw new Error(`Cannot derive readingDate for daily reading record ${record._id}`)
    }
    migratedRecords.push({ record, publishedDate, readingDate, title, content: refreshed?.content ?? record.content })
  }

  for (const { record, publishedDate, readingDate, title, content } of migratedRecords) {
    await collection.updateOne(
      { _id: record._id },
      { $set: { publishedDate, readingDate, title, content } },
    )
  }

  const indexes = await collection.indexes()
  const legacyDateIndex = indexes.find((index) => index.name === 'date_1')
  if (legacyDateIndex) await collection.dropIndex('date_1')
  await collection.updateMany({ date: { $exists: true } }, { $unset: { date: '' } })
  await collection.createIndex({ readingDate: 1 })

  console.log(`Migrated ${records.length} daily reading records`)
}

migrateDailyReadings()
  .catch((error) => {
    console.error('Daily reading migration failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
