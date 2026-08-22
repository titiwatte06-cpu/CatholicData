import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import churchesRouter from './routes/churches.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/churches', churchesRouter)

export default app