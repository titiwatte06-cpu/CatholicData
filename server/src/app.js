import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import compression from 'compression'

import churchesRouter from './routes/churches.js'
import authRouter from './routes/auth.js'
import churchRequestsRouter from './routes/churchRequests.js'
import externalContentRouter from './routes/externalContent.js'
import { getCacheHealth } from './services/churchCache.js'
import mongoose from 'mongoose'

const app = express()

app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173'].filter(Boolean),
  credentials: true,
  exposedHeaders: ['ETag', 'X-Cache', 'Cache-Control'],
}))
app.use(compression())
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store').json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cache: getCacheHealth(),
  })
})
app.use('/api/churches', churchesRouter)
app.use('/api/church-requests', churchRequestsRouter)
app.use('/api/auth', authRouter)
app.use('/api', externalContentRouter)

export default app
