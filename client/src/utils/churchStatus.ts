import type { Church, MassTimeEntry } from '../data/churches'

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

function resolveTime(entry: MassTimeEntry, rowDuration?: number, churchDuration?: number) {
  if (typeof entry === 'string') return { start: entry, durationMinutes: rowDuration ?? churchDuration ?? 60 }
  return { start: entry.time, durationMinutes: entry.durationMinutes }
}

export function isChurchOpenNow(church: Church, now: Date = new Date()): boolean {
  const todayThai = jsDayToThai[now.getDay()]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  return church.massSchedule.some((row) => {
    if (!dayMatches(row.day, todayThai)) return false
    return row.times.some((entry) => {
      const { start, durationMinutes } = resolveTime(entry, row.durationMinutes, church.defaultMassDurationMinutes)
      const [h, m] = start.split(':').map(Number)
      const startMinutes = h * 60 + m
      const endMinutes = startMinutes + durationMinutes
      return nowMinutes >= startMinutes && nowMinutes < endMinutes
    })
  })
}