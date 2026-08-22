import 'dotenv/config'

console.log('ENV CHECK:', {
  email: process.env.ADMIN_EMAIL,
  hasHash: !!process.env.ADMIN_PASSWORD_HASH,
  hashPreview: process.env.ADMIN_PASSWORD_HASH?.slice(0, 10),
})

import app from './src/app.js'
import { connectDB } from './src/config/db.js'

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})