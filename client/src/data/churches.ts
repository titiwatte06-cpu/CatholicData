export type MassTimeEntry = string | { time: string; durationMinutes: number }

export type MassSchedule = {
  day: string
  times: MassTimeEntry[]
  durationMinutes?: number // ระยะเวลา default ของทุกรอบในแถวนี้ (ถ้าไม่ตั้งจะใช้ของวัด หรือ 60 นาที)
}

export type Region = 'bangkok' | 'north' | 'central' | 'south'


export type Church = {
  id: string
  name: string
  nameEn: string
  district: string
  address: string
  region:Region
  lat: number
  lng: number
  openHours: string
  priest: string
  defaultMassDurationMinutes?: number // ระยะเวลา default ของทั้งวัด
  massSchedule: MassSchedule[]
}
