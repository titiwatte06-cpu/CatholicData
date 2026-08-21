import mongoose from 'mongoose'

const massScheduleSchema = new mongoose.Schema({
  day: String,
  times: [String],
}, { _id: false })

const churchSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: String,
  nameEn: String,
  district: String,
  address: String,
  lat: Number,
  lng: Number,
  openHours: String,
  priest: String,
  massSchedule: [massScheduleSchema],
})

export default mongoose.model('Church', churchSchema)