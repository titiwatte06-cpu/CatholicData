export type MassTimeEntry = string | { time: string; durationMinutes: number }

export type MassSchedule = {
  day: string
  times: MassTimeEntry[]
  durationMinutes?: number // ระยะเวลา default ของทุกรอบในแถวนี้ (ถ้าไม่ตั้งจะใช้ของวัด หรือ 60 นาที)
}

export type Region = 'bangkok' | 'north' | 'central' | 'south'

const districtLabelsEn: Record<string, string> = {
  'เขตบางรัก': 'Bang Rak District',
  'เขตสาทร': 'Sathon District',
  'เขตดุสิต': 'Dusit District',
  'เขตวัฒนา': 'Watthana District',
  'เขตดินแดง': 'Din Daeng District',
  'เขตจตุจักร': 'Chatuchak District',
  'เขตบางเขน': 'Bang Khen District',
  'อำเภอธัญบุรี': 'Thanyaburi District',
  'เขตสัมพันธวงศ์': 'Samphanthawong District',
  'เขตธนบุรี': 'Thon Buri District',
  'เขตตลิ่งชัน': 'Taling Chan District',
  'เขตวังทองหลาง': 'Wang Thonglang District',
  'เขตยานนาวา': 'Yan Nawa District',
  'เขตหลักสี่': 'Lak Si District',
  'เขตดอนเมือง': 'Don Mueang District',
  'อำเภอเมืองปทุมธานี': 'Mueang Pathum Thani District',
  'เขตบางกะปิ': 'Bang Kapi District',
  'อำเภอปากเกร็ด': 'Pak Kret District',
  'อำเภอเมืองเชียงใหม่': 'Mueang Chiang Mai District',
  'อำเภอเมืองเชียงราย': 'Mueang Chiang Rai District',
  'อำเภอเมืองลำปาง': 'Mueang Lampang District',
}

export function getDistrictLabel(district: string, lang: 'th' | 'en') {
  return lang === 'th' ? district : districtLabelsEn[district] ?? district
}

const dayLabelsEn: Record<string, string> = {
  'จันทร์': 'Monday',
  'อังคาร': 'Tuesday',
  'พุธ': 'Wednesday',
  'พฤหัสบดี': 'Thursday',
  'ศุกร์': 'Friday',
  'เสาร์': 'Saturday',
  'อาทิตย์': 'Sunday',
}

export function getMassDayLabel(day: string, lang: 'th' | 'en') {
  if (lang === 'th') return day
  return day.split(' - ').map((part) => dayLabelsEn[part] ?? part).join(' - ')
}

export function getOpenHoursLabel(openHours: string, lang: 'th' | 'en') {
  if (lang === 'th') return openHours
  return openHours
    .replaceAll('ยังไม่มีข้อมูล', 'Information unavailable')
    .replaceAll('ทุกวัน', 'daily')
    .replaceAll('จันทร์', 'Monday')
    .replaceAll('อังคาร', 'Tuesday')
    .replaceAll('พุธ', 'Wednesday')
    .replaceAll('พฤหัสบดี', 'Thursday')
    .replaceAll('ศุกร์', 'Friday')
    .replaceAll('เสาร์', 'Saturday')
    .replaceAll('อาทิตย์', 'Sunday')
    .replaceAll('น.', '')
}

export type Church = {
  id: string
  name: string
  nameEn: string
  district: string
  address: string
  addressEn?: string
  region: Region
  lat: number
  lng: number
  openHours: string
  openHoursEn?: string
  priest: string
  priestEn?: string
  defaultMassDurationMinutes?: number // ระยะเวลา default ของทั้งวัด
  massSchedule: MassSchedule[]
}
