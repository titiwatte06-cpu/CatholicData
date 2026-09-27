import mongoose from 'mongoose'

const dailyReadingSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  sourceUrl: { type: String, required: true },
}, { timestamps: true })

export default mongoose.model('DailyReading', dailyReadingSchema)
