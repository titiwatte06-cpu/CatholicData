import 'dotenv/config'
import { connectDB } from '../config/db.js'
import Church from '../models/Church.js'
import { churchSeedData } from './churches.data.js'

async function seed() {
  await connectDB()
  await Church.deleteMany({})
  await Church.insertMany(churchSeedData)
  console.log(`Seeded ${churchSeedData.length} churches`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})