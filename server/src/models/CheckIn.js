import mongoose from 'mongoose'

const checkInSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Church uses its stable public `id` field rather than exposing Mongo IDs to clients.
  churchId: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  checkedInAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true })

checkInSchema.index({ userId: 1, churchId: 1 }, { unique: true })

export default mongoose.model('CheckIn', checkInSchema)
