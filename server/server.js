import 'dotenv/config'

import app from './src/app.js'
import { connectDB } from './src/config/db.js'
import { startExternalContentScheduler } from './src/services/externalContentScheduler.js'

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  startExternalContentScheduler()
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})