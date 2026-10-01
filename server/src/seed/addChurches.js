import 'dotenv/config'
import { connectDB } from '../config/db.js'
import Church from '../models/Church.js'
import { newChurchesBatch } from './churches.newBatch.js'

const allNewChurches = [...newChurchesBatch]   // ⬅️ รวมทุก batch ไว้ตรงนี้

async function addChurches() {
  await connectDB()

  let created = 0
  let updated = 0

  for (const church of allNewChurches) {
    const result = await Church.findOneAndUpdate(
      { id: church.id },
      { $set: church },
      { upsert: true, new: true, rawResult: true }
    )
    if (result.lastErrorObject?.upserted) {
      created++
      console.log(`+ เพิ่มใหม่: ${church.name}`)
    } else {
      updated++
      console.log(`~ อัปเดต: ${church.name}`)
    }
  }

  console.log(`เสร็จแล้ว: เพิ่มใหม่ ${created} วัด, อัปเดต ${updated} วัด`)
  process.exit(0)
}

addChurches().catch((err) => {
  console.error('Add churches failed:', err)
  process.exit(1)
})