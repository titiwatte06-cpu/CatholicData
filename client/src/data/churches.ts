export type MassSchedule = { day: string; times: string[] }

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
  massSchedule: MassSchedule[]
}

export const churches: Church[] = [
  { id: 'assumption', name: 'อาสนวิหารอัสสัมชัญ', nameEn: 'Assumption Cathedral', district: 'เขตบางรัก', address: '23 ซอยเจริญกรุง 40 บางรัก กรุงเทพฯ 10500', lat: 13.7231103, lng: 100.5151403, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'บาทหลวงสุรชัย ชุ่มศรีพันธุ์', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:00', '18:00'] }, { day: 'อาทิตย์', times: ['06:30', '08:00', '10:00', '16:00', '18:00'] }] },
  { id: 'st-louis', name: 'วัดเซนต์หลุยส์', nameEn: 'St. Louis Church', district: 'เขตสาทร', address: '215 ถนนสาทรใต้ ยานนาวา สาทร กรุงเทพฯ 10120', lat: 13.7195062, lng: 100.5238826, openHours: '06:30 - 19:30 น. ทุกวัน', priest: 'บาทหลวงวัชศิลป์ กฤษเจริญ', massSchedule: [{ day: 'จันทร์ - ศุกร์', times: ['06:30', '19:00'] }, { day: 'เสาร์', times: ['19:00'] }, { day: 'อาทิตย์', times: ['07:00', '08:30', '10:00', '19:00'] }] },
  { id: 'conception', name: 'วัดคอนเซปชัญ', nameEn: 'Immaculate Conception Church', district: 'เขตดุสิต', address: '72 ซอยมิตรคาม ถนนสามเสน ดุสิต กรุงเทพฯ 10300', lat: 13.7769277, lng: 100.5037426, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'บาทหลวงเปโตร วิทยา คู่วิรัตน์', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:00', '19:00'] }, { day: 'อาทิตย์', times: ['06:00', '08:00', '10:00', '19:00'] }] },
  { id: 'redemptorist', name: 'วัดพระมหาไถ่', nameEn: 'Redemptorist Church', district: 'เขตวัฒนา', address: '5 ซอยร่วมฤดี ถนนวิทยุ ลุมพินี ปทุมวัน กรุงเทพฯ 10330', lat: 13.7348007, lng: 100.5492047, openHours: '06:00 - 20:00 น. ทุกวัน', priest: 'บาทหลวงชวลิต กิจเจริญ', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:30', '12:10', '19:00'] }, { day: 'อาทิตย์', times: ['07:00', '08:30', '10:00', '17:00', '19:00'] }] },
  { id: 'st-francis-xavier', name: 'วัดเซนต์ฟรังซิสเซเวียร์', nameEn: 'St. Francis Xavier Church', district: 'เขตดุสิต', address: '84 ซอยวัดนักบุญฟรังซิสเซเวียร์ สามเสน ดุสิต กรุงเทพฯ 10300', lat: 13.812519, lng: -259.439433, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'บาทหลวงสมเกียรติ บุญอนันตบุตร', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:00', '19:00'] }, { day: 'อาทิตย์', times: ['06:30', '08:30', '10:00', '16:00', '19:00'] }] },
  { id: 'holy-redeemer', name: 'วัดแม่พระฟาติมา', nameEn: 'Our Lady of Fatima Church', district: 'เขตดินแดง', address: '251 ถนนดินแดง ดินแดง กรุงเทพฯ 10400', lat: 13.7596675, lng: 100.5558626, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'บาทหลวงอนุชา ไชยเดช', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:00', '18:30'] }, { day: 'อาทิตย์', times: ['07:00', '09:00', '10:30', '18:00'] }] },
  { id: 'st-john', name: 'วัดเซนต์จอห์น', nameEn: "St. John's Church", district: 'เขตจตุจักร', address: '111/9 ถนนพหลโยธิน แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900', lat: 13.812503, lng: 100.560619, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'คุณพ่อมงซิออร์ วิษณุ ธัญญอนัตญ์', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:30', '19:00'] }, { day: 'อาทิตย์', times: ['07:00', '09:00', '11:00', '18:00'] }] },
]