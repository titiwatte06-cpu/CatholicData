import type { Church, MassTimeEntry } from '../data/churches'

const NOTICE_MINUTES_BEFORE = 60   // แจ้งเตือนล่วงหน้ากี่นาทีก่อนมิสซาเริ่ม (ปรับได้ตามต้องการ)
const MASS_DURATION_MINUTES = 60   // สมมติแต่ละรอบมิสซาใช้เวลากี่นาที (ยังไม่ขึ้นถ้าเลยช่วงนี้ไปแล้ว)

const thaiDaysInOrder = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']
const jsDayToThai = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

function dayMatches(dayField: string, todayThai: string): boolean {
  const parts = dayField.split('-').map((s) => s.trim())
  if (parts.length === 1) return parts[0] === todayThai
  const [startDay, endDay] = parts
  const startIdx = thaiDaysInOrder.indexOf(startDay)
  const endIdx = thaiDaysInOrder.indexOf(endDay)
  const todayIdx = thaiDaysInOrder.indexOf(todayThai)
  if (startIdx === -1 || endIdx === -1 || todayIdx === -1) return false
  return startIdx <= endIdx ? todayIdx >= startIdx && todayIdx <= endIdx : todayIdx >= startIdx || todayIdx <= endIdx
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// ↓ เพิ่มใหม่: ดึงเวลาเริ่มออกมาเป็น string เสมอ ไม่ว่า entry จะเป็น string หรือ object
function resolveStartTime(entry: MassTimeEntry): string {
  return typeof entry === 'string' ? entry : entry.time
}

export type MassAlert = { active: boolean; time?: string }

export function getMassAlert(church: Church, now: Date = new Date()): MassAlert {
  const todayThai = jsDayToThai[now.getDay()]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (const row of church.massSchedule) {
    if (!dayMatches(row.day, todayThai)) continue
    for (const entry of row.times) {
      const startTime = resolveStartTime(entry)          // ← เปลี่ยนจาก time เป็น entry แล้วดึง startTime
      const startMinutes = toMinutes(startTime)
      const windowStart = startMinutes - NOTICE_MINUTES_BEFORE
      const windowEnd = startMinutes + MASS_DURATION_MINUTES
      if (nowMinutes >= windowStart && nowMinutes < windowEnd) {
        return { active: true, time: startTime }          // ← ใช้ startTime แทน time เดิม
      }
    }
  }
  return { active: false }
}