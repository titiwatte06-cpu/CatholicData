import mongoose from 'mongoose'

const churchRequestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['add', 'edit', 'delete'], required: true },
    proposedData: { type: mongoose.Schema.Types.Mixed },
    targetChurchId: { type: String },
    reason: { type: String, default: '' },
    submitterContact: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: { type: String, default: '' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.model('ChurchRequest', churchRequestSchema)