export type MassTimeEntry = string | { time: string; durationMinutes: number }

export type MassSchedule = {
  day: string
  times: MassTimeEntry[]
  durationMinutes?: number // ระยะเวลา default ของทุกรอบในแถวนี้ (ถ้าไม่ตั้งจะใช้ของวัด หรือ 60 นาที)
}

export type Church = {
  id: string
  name: string
  nameEn: string
  district: string
  address: string
  lat: number
  lng: number
  openHours: string
  priest: string
  defaultMassDurationMinutes?: number // ระยะเวลา default ของทั้งวัด
  massSchedule: MassSchedule[]
}
