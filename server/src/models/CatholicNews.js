import mongoose from 'mongoose'

const catholicNewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true, unique: true, index: true },
  publishedDate: { type: String, required: true, index: true },
  excerpt: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('CatholicNews', catholicNewsSchema)
