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
  district: String,
  address: String,
  lat: Number,
  lng: Number,
  openHours: String,
  priest: String,
  defaultMassDurationMinutes: Number,
  massSchedule: [massScheduleSchema],
}, { timestamps: true })

export default mongoose.model('Church', churchSchema)