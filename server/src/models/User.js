import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  },
  passwordHash: {
    type: String,
    select: false,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-z0-9._-]+$/,
    unique: true,
    index: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  },
  privacy: {
    stampBookVisible: {
      type: Boolean,
      default: false,
    },
  },
  role: {
    type: String,
    enum: ['user'],
    default: 'user',
  },
  consentAt: {
    type: Date,
    default: Date.now,
  },
  consentVersion: {
    type: String,
    default: '2026-01',
  },
}, { timestamps: true })

export default mongoose.model('User', userSchema)
