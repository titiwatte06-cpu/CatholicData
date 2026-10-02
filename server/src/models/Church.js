import mongoose from 'mongoose'

const massScheduleSchema = new mongoose.Schema({
  day: String,
  times: [mongoose.Schema.Types.Mixed], // string เช่น '09:00' หรือ object { time, durationMinutes }
  durationMinutes: Number,
}, { _id: false })

const churchSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true, index: true },
  name: String,
  nameEn: String,
  imageUrl: String,
  district: String,
  province: String,
  address: String,
  addressEn: String,
  region: {
  type: String,
  enum: [
    'bangkok',
    'tharae-nongsaeng',
    'chiang-mai',
    'nakhon-sawan',
    'ratchaburi',
    'nakhon-ratchasima',
    'ubon-ratchathani',
    'udon-thani',
    'chanthaburi',
    'surat-thani',
    'chiang-rai',
  ],
  default: 'bangkok',
},
  lat: Number,
  lng: Number,
  openHours: String,
  openHoursEn: String,
  priest: String,
  priestEn: String,
  defaultMassDurationMinutes: Number,
  massSchedule: [massScheduleSchema],
}, { timestamps: true })

export default mongoose.model('Church', churchSchema)