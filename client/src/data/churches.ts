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

export const churches: Church[] = [
  { id: 'assumption', name: 'อาสนวิหารอัสสัมชัญ', nameEn: 'Assumption Cathedral', district: 'เขตบางรัก', address: '23 ซอยเจริญกรุง 40 บางรัก กรุงเทพฯ 10500', lat: 13.7231103, lng: 100.5151403, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'บาทหลวงสุรชัย ชุ่มศรีพันธุ์', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:00', '18:00'] }, { day: 'อาทิตย์', times: ['06:30', '08:00', '10:00', '16:00', '18:00'] }] },
  { id: 'st-louis', name: 'วัดเซนต์หลุยส์', nameEn: 'St. Louis Church', district: 'เขตสาทร', address: '215 ถนนสาทรใต้ ยานนาวา สาทร กรุงเทพฯ 10120', lat: 13.7195062, lng: 100.5238826, openHours: '06:30 - 19:30 น. ทุกวัน', priest: 'บาทหลวงวัชศิลป์ กฤษเจริญ', massSchedule: [{ day: 'จันทร์ - ศุกร์', times: ['06:30', '19:00'] }, { day: 'เสาร์', times: ['19:00'] }, { day: 'อาทิตย์', times: ['07:00', '08:30', '10:00', '19:00'] }] },
  { id: 'conception', name: 'วัดคอนเซปชัญ', nameEn: 'Immaculate Conception Church', district: 'เขตดุสิต', address: '72 ซอยมิตรคาม ถนนสามเสน ดุสิต กรุงเทพฯ 10300', lat: 13.7769277, lng: 100.5037426, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'บาทหลวงเปโตร วิทยา คู่วิรัตน์', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:00', '19:00'] }, { day: 'อาทิตย์', times: ['06:00', '08:00', '10:00', '19:00'] }] },
  { id: 'redemptorist', name: 'วัดพระมหาไถ่', nameEn: 'Redemptorist Church', district: 'เขตวัฒนา', address: '5 ซอยร่วมฤดี ถนนวิทยุ ลุมพินี ปทุมวัน กรุงเทพฯ 10330', lat: 13.7348007, lng: 100.5492047, openHours: '06:00 - 20:00 น. ทุกวัน', priest: 'บาทหลวงชวลิต กิจเจริญ', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:30', '12:10', '19:00'] }, { day: 'อาทิตย์', times: ['07:00', '08:30', '10:00', '17:00', '19:00'] }] },
  { id: 'st-francis-xavier', name: 'วัดเซนต์ฟรังซิสเซเวียร์', nameEn: 'St. Francis Xavier Church', district: 'เขตดุสิต', address: '84 ซอยวัดนักบุญฟรังซิสเซเวียร์ สามเสน ดุสิต กรุงเทพฯ 10300', lat: 13.812519, lng: -259.439433, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'บาทหลวงสมเกียรติ บุญอนันตบุตร', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:00', '19:00'] }, { day: 'อาทิตย์', times: ['06:30', '08:30', '10:00', '16:00', '19:00'] }] },
  { id: 'holy-redeemer', name: 'วัดแม่พระฟาติมา', nameEn: 'Our Lady of Fatima Church', district: 'เขตดินแดง', address: '251 ถนนดินแดง ดินแดง กรุงเทพฯ 10400', lat: 13.7596675, lng: 100.5558626, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'บาทหลวงอนุชา ไชยเดช', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:00', '18:30'] }, { day: 'อาทิตย์', times: ['07:00', '09:00', '10:30', '18:00'] }] },
  { id: 'st-john', name: 'วัดเซนต์จอห์น', nameEn: "St. John's Church", district: 'เขตจตุจักร', address: '111/9 ถนนพหลโยธิน แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900', lat: 13.812503, lng: 100.560619, openHours: '06:00 - 19:00 น. ทุกวัน', priest: 'คุณพ่อมงซิออร์ วิษณุ ธัญญอนัตญ์', massSchedule: [{ day: 'จันทร์ - เสาร์', times: ['06:30', '19:00'] }, { day: 'อาทิตย์', times: ['07:00', '09:00', '11:00', '18:00'] }] },
  { id: 'st-joseph-trok-chan', name: 'วัดนักบุญโยเซฟตรอกจันทร์', nameEn: 'St. Joseph Trok Chan Church', district: 'เขตสาทร', address: 'ตรอกจันทร์ กรุงเทพฯ', lat: 13.7098, lng: 100.5264, openHours: 'ยังไม่มีข้อมูล', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'carmel-monastery', name: 'อารามคาร์แมล', nameEn: 'Carmelite Monastery', district: 'เขตบางรัก', address: '14 ถนนคอนแวนต์ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500', lat: 13.7259326, lng: 100.533789, openHours: '06:00 - 18:00 น. ทุกวัน', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'st-michael-saphan-mai', name: 'วัดอัครเทวดามีคาเอลสะพานใหม่', nameEn: 'St. Michael the Archangel Church', district: 'เขตบางเขน', address: '343/59 หมู่ 7 ถนนพหลโยธิน แขวงคลองถนน เขตบางเขน กรุงเทพฯ 10220', lat: 13.8937243, lng: 100.6049243, openHours: 'ยังไม่มีข้อมูล', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'our-lady-rangsit', name: 'วัดพระชนนีรังสิต', nameEn: 'Our Lady of Rangsit Church', district: 'อำเภอธัญบุรี', address: '22 ซอยพหลโยธิน 121 หมู่ 1 ต.ประชาธิปัตย์ อ.ธัญบุรี ปทุมธานี 12130', lat: 13.9812764, lng: 100.6148227, openHours: 'ยังไม่มีข้อมูล', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'kalawar', name: 'วัดพระแม่ลูกประคำ กาลหว่าร์', nameEn: 'Holy Rosary Church (Kalawar)', district: 'เขตสัมพันธวงศ์', address: '1318 ถนนโยธา แขวงตลาดน้อย เขตสัมพันธวงศ์ กรุงเทพฯ 10100', lat: 13.7312207, lng: 100.5132944, openHours: 'จันทร์ - เสาร์ 16:30 - 18:30 น. / อาทิตย์ 07:00 - 11:00, 16:30 - 18:30 น.', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'santa-cruz', name: 'วัดซางตาครู้ส', nameEn: 'Santa Cruz Church', district: 'เขตธนบุรี', address: '112 ซอยกุฎีจีน แขวงวัดกัลยาณ์ เขตธนบุรี กรุงเทพฯ 10600', lat: 13.7391169, lng: 100.4938326, openHours: '05:00 - 10:00, 17:00 - 19:00 น. ทุกวัน', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'blessed-sacrament-taling-chan', name: 'วัดศีลมหาสนิท', nameEn: 'The Blessed Sacrament Church', district: 'เขตตลิ่งชัน', address: '2, 35 ถนนราชพฤกษ์ แขวงตลิ่งชัน เขตตลิ่งชัน กรุงเทพฯ 10170', lat: 13.7964911, lng: 100.4502687, openHours: 'จันทร์ - ศุกร์ 19:00 - 20:00 น. / เสาร์ 18:00 - 19:00 น. / อาทิตย์ 08:00 - 10:30, 18:00 - 19:00 น.', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'holy-spirit-chapel', name: 'วัดน้อยพระจิตเจ้า', nameEn: 'Holy Spirit Chapel', district: 'เขตสาทร', address: '215 ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพฯ 10120', lat: 13.7191029, lng: 100.5246338, openHours: 'ศุกร์ 11:30 - 13:30 น. / อาทิตย์ 10:59 - 13:30 น.', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'maria-rosa-mystica', name: 'วัดแม่พระกุหลาบทิพย์', nameEn: 'Maria Rosa Mystica Church', district: 'เขตวังทองหลาง', address: '3 ซอยลาดพร้าว 124 แขวงพลับพลา เขตวังทองหลาง กรุงเทพฯ 10310', lat: 13.775796, lng: 100.6260739, openHours: '08:00 - 17:00 น. ทุกวัน / อาทิตย์ 08:00 - 14:00 น.', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'our-lady-of-lourdes-yannawa', name: 'วัดแม่พระประจักษ์เมืองลูร์ด', nameEn: 'Our Lady of Lourdes Chapel', district: 'เขตยานนาวา', address: '2094/1 ถนนนราธิวาสราชนครินทร์ ซอย 22 แขวงช่องนนทรี เขตยานนาวา กรุงเทพฯ 10120', lat: 13.7040263, lng: 100.5364912, openHours: 'ยังไม่มีข้อมูล', priest: 'ยังไม่มีข้อมูล', massSchedule: [{ day: 'อาทิตย์', times: ['08:30'] }] },
  { id: 'st-jude-chinnaket', name: 'วัดนักบุญยูดา อัครสาวก', nameEn: 'Saint Jude the Apostle Church', district: 'เขตหลักสี่', address: '79-82 ซอยชินเขต 1/45 แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพฯ 10210', lat: 13.8614255, lng: 100.555327, openHours: 'อาทิตย์ 09:30 - 13:00 น.', priest: 'ยังไม่มีข้อมูล', massSchedule: [{ day: 'อาทิตย์', times: ['07:00', '11:00'] }] },
  { id: 'mary-heaven-don-mueang', name: 'วัดมารีย์สวรรค์ ดอนเมือง', nameEn: 'Mary Heaven Church', district: 'เขตดอนเมือง', address: '18/95 ถนนสรงประภา แขวงดอนเมือง เขตดอนเมือง กรุงเทพฯ 10210', lat: 13.9252962, lng: 100.5889179, openHours: '06:30 - 17:00 น. ทุกวัน', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'st-mark-pathum-thani', name: 'วัดนักบุญมาร์โก ปทุมธานี', nameEn: 'Saint Mark the Evangelist Catholic Church', district: 'อำเภอเมืองปทุมธานี', address: '47/9 หมู่ 9 ตำบลบางปรอก อำเภอเมืองปทุมธานี ปทุมธานี 12000', lat: 14.0117795, lng: 100.5152775, openHours: 'ยังไม่มีข้อมูล', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'perpetual-help-khlong-chan', name: 'วัดพระมารดานิจจานุเคราะห์ คลองจั่น', nameEn: 'Our Mother of Perpetual Help Church', district: 'เขตบางกะปิ', address: '49 หมู่ 5 ซอยโอฬาร 2 ถนนนวมินทร์ แขวงคลองจั่น เขตบางกะปิ กรุงเทพฯ 10240', lat: 13.7906706, lng: 100.6396258, openHours: 'ยังไม่มีข้อมูล', priest: 'ยังไม่มีข้อมูล', massSchedule: [] },
  { id: 'our-lady-of-mercy-nonthaburi', name: 'วัดพระแม่มหาการุณย์ (วัดเมืองนนท์)', nameEn: 'Our Lady of Mercy Church', district: 'อำเภอปากเกร็ด', address: 'ถนนติวานนท์-ปทุมธานี ตำบลบ้านใหม่ อำเภอปากเกร็ด นนทบุรี 11120', lat: 13.9468856, lng: 100.5566612, openHours: 'ยังไม่มีข้อมูล', priest: 'ยังไม่มีข้อมูล', massSchedule: [{ day: 'เสาร์', times: ['18:00'] }, { day: 'อาทิตย์', times: ['09:00', '10:30', '16:00'] }] },
]