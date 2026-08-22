import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import churchesRouter from './routes/churches.js'
import authRouter from './routes/auth.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/churches', churchesRouter)
app.use('/api/auth', authRouter)

export default app