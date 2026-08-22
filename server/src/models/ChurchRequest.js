import mongoose from 'mongoose'

const churchRequestSchema = new mongoose.Schema({
  type: { type: String, enum: ['add', 'edit', 'delete'], required: true },
  targetChurchId: { type: String }, // ใช้กับ edit/delete เท่านั้น
  proposedData: { type: mongoose.Schema.Types.Mixed }, // shape เดียวกับ Church
  reason: { type: String },
  submitterContact: { type: String }, // optional ไม่บังคับ
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String },
  reviewedAt: { type: Date },
}, { timestamps: true })

export default mongoose.model('ChurchRequest', churchRequestSchema)