import mongoose from 'mongoose'

const dailyReadingSchema = new mongoose.Schema({
  publishedDate: { type: String, required: true },
  readingDate: { type: String, required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  sourceUrl: { type: String, required: true },
}, { timestamps: true })

export default mongoose.model('DailyReading', dailyReadingSchema)
