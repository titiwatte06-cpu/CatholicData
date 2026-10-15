import 'dotenv/config'

import app from './src/app.js'
import { connectDB } from './src/config/db.js'
import { startExternalContentScheduler } from './src/services/externalContentScheduler.js'
import { warmChurchCache, watchChurchChanges } from './src/services/churchCache.js'

const PORT = process.env.PORT || 5000

// เปิด HTTP ก่อน เพื่อให้ Render health check ผ่านได้ระหว่างรอ MongoDB
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

let schedulerStarted = false
async function connectAndWarm() {
  let delayMs = 2000
  while (true) {
    try {
      await connectDB()
      if (!schedulerStarted) {
        startExternalContentScheduler()
        watchChurchChanges()
        schedulerStarted = true
      }
      // อุ่น cache เบื้องหลัง ไม่หน่วงการรับ request
      void warmChurchCache().catch((err) => console.error('Church cache warm-up failed:', err.message))
      return
    } catch (err) {
      console.error(`Database connection retry in ${Math.round(delayMs / 1000)}s:`, err.message)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      delayMs = Math.min(delayMs * 2, 30000)
    }
  }
}

void connectAndWarm()
