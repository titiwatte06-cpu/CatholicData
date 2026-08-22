import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = express.Router()

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const emailOk = email === process.env.ADMIN_EMAIL
  const passwordOk = emailOk && (await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH))

  if (!emailOk || !passwordOk) {
    return res.status(401).json({ message: 'invalid credentials' })
  }

  const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.cookie('token', token, cookieOptions)
  res.json({ role: 'admin' })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions)
  res.json({ message: 'logged out' })
})

// GET /api/auth/me — เช็คว่ายัง login อยู่ไหม
router.get('/me', (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: 'unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    res.json({ role: payload.role, email: payload.email })
  } catch {
    res.status(401).json({ message: 'invalid token' })
  }
})

export default router