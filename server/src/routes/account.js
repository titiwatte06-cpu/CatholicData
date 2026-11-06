import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import CheckIn from '../models/CheckIn.js'
import Church from '../models/Church.js'
import { requireUser } from '../middleware/requireUser.js'

const router = express.Router()
const COOKIE_NAME = 'user_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000
const CONSENT_VERSION = '2026-01'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernamePattern = /^[a-z0-9._-]{3,30}$/
const dummyPasswordHash = await bcrypt.hash('invalid-password-for-timing-only', 10)

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: COOKIE_MAX_AGE,
}

const rateLimitWindowMs = 15 * 60 * 1000
const rateLimitMax = 10
const attemptsByIp = new Map()

function authLimiter(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const current = attemptsByIp.get(key)
  const attempts = current && current.expiresAt > now ? current.count : 0

  if (attempts >= rateLimitMax) {
    return res.status(429).json({ message: 'ลองทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' })
  }

  attemptsByIp.set(key, { count: attempts + 1, expiresAt: now + rateLimitWindowMs })
  return next()
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function usernameFromEmail(email) {
  const candidate = email.split('@')[0].replace(/[^a-z0-9._-]/g, '').slice(0, 30)
  return candidate.length >= 3 ? candidate : `user${Date.now().toString().slice(-8)}`
}

async function hasValidAdminCredentials(email, password) {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL)
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
  if (!adminEmail || !adminPasswordHash || email !== adminEmail) return false
  return bcrypt.compare(password, adminPasswordHash)
}

function setAdminCookie(res, email) {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) return false
  const token = jwt.sign({ role: 'admin', email }, secret, { expiresIn: '7d' })
  res.cookie('token', token, cookieOptions)
  return true
}

async function createOrSyncAdminUser(email, password) {
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
  if (!(await hasValidAdminCredentials(email, password))) return null

  let user = await User.findOne({ email }).select('+passwordHash')
  if (user) {
    user.passwordHash = adminPasswordHash
    await user.save()
    return user
  }

  let username = usernameFromEmail(email)
  if (await User.exists({ username })) username = `${username.slice(0, 23)}-${Date.now().toString().slice(-6)}`
  return User.create({
    email,
    passwordHash: adminPasswordHash,
    username,
    displayName: email.split('@')[0],
    role: 'user',
    consentAt: new Date(),
    consentVersion: CONSENT_VERSION,
  })
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar || '',
    role: user.role,
    privacy: user.privacy,
    consentAt: user.consentAt,
    consentVersion: user.consentVersion,
    joinedAt: user.createdAt,
  }
}

function getUserJwtSecret() {
  const secret = process.env.USER_JWT_SECRET?.trim()
  if (!secret) {
    const error = new Error('USER_JWT_SECRET is not configured')
    error.code = 'USER_JWT_SECRET_MISSING'
    throw error
  }
  return secret
}

function setUserCookie(res, user) {
  const token = jwt.sign(
    { sub: user._id.toString(), role: 'user' },
    getUserJwtSecret(),
    { expiresIn: '7d' },
  )
  res.cookie(COOKIE_NAME, token, cookieOptions)
}

router.post('/register', authLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email)
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const displayName = typeof req.body.displayName === 'string' ? req.body.displayName.trim() : ''
  const username = normalizeUsername(req.body.username) || usernameFromEmail(email)
  const consent = req.body.consent === true

  if (!emailPattern.test(email)) return res.status(400).json({ message: 'อีเมลไม่ถูกต้อง', field: 'email' })
  if (password.length < 8 || password.length > 72 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'รหัสผ่านต้องมีความยาว 8-72 ตัวอักษร', field: 'password' })
  }
  if (displayName.length < 1 || displayName.length > 50) {
    return res.status(400).json({ message: 'ชื่อต้องมีความยาว 1-50 ตัวอักษร', field: 'displayName' })
  }
  if (!usernamePattern.test(username)) return res.status(400).json({ message: 'Invalid username', field: 'username' })
  if (!consent) return res.status(400).json({ message: 'กรุณายอมรับนโยบายความเป็นส่วนตัว', field: 'consent' })

  try {
    const existing = await User.exists({ $or: [{ email }, { username }] })
    if (existing) return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว', field: 'email' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      email,
      passwordHash,
      username,
      displayName,
      role: 'user',
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
    })

    setUserCookie(res, user)
    return res.status(201).json({ user: publicUser(user) })
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว', field: 'email' })
    console.error('User registration failed:', error.message)
    return res.status(500).json({ message: 'สมัครสมาชิกไม่สำเร็จ' })
  }
})

router.post('/login', authLimiter, async (req, res) => {
  const email = normalizeEmail(req.body.email)
  const password = typeof req.body.password === 'string' ? req.body.password : ''

  try {
    const isAdminLogin = await hasValidAdminCredentials(email, password)
    let user = await User.findOne({ email }).select('+passwordHash')
    if (!user && isAdminLogin) user = await createOrSyncAdminUser(email, password)
    const passwordHash = user?.passwordHash ?? dummyPasswordHash
    const passwordMatches = await bcrypt.compare(password, passwordHash)

    if (!user || !passwordMatches || user.role !== 'user') {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    }

    setUserCookie(res, user)
    if (isAdminLogin) setAdminCookie(res, email)
    return res.json({ user: publicUser(user) })
  } catch (error) {
    if (error?.code === 'USER_JWT_SECRET_MISSING') {
      console.error('User login failed: USER_JWT_SECRET is not configured')
      return res.status(503).json({ message: 'ระบบ user login ยังไม่ได้ตั้งค่า secret' })
    }
    console.error('User login failed:', error.message)
    return res.status(500).json({ message: 'เข้าสู่ระบบไม่สำเร็จ' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions)
  res.json({ message: 'ออกจากระบบแล้ว' })
})

router.get('/me', requireUser, (req, res) => {
  res.json({ user: publicUser(req.currentUser) })
})

router.patch('/profile', requireUser, async (req, res) => {
  const displayName = typeof req.body.displayName === 'string' ? req.body.displayName.trim() : undefined
  const username = req.body.username === undefined ? undefined : normalizeUsername(req.body.username)
  const avatar = req.body.avatar === undefined ? undefined : (typeof req.body.avatar === 'string' ? req.body.avatar.trim() : '')

  if (displayName !== undefined && (displayName.length < 1 || displayName.length > 50)) {
    return res.status(400).json({ message: 'displayName must be 1-50 characters', field: 'displayName' })
  }
  if (username !== undefined && !usernamePattern.test(username)) {
    return res.status(400).json({ message: 'Invalid username', field: 'username' })
  }
  if (avatar !== undefined && avatar && !(/^(https?:\/\/|data:image\/)/i.test(avatar))) {
    return res.status(400).json({ message: 'Invalid avatar image', field: 'avatar' })
  }
  if (avatar !== undefined && Buffer.byteLength(avatar, 'utf8') > 1_500_000) {
    return res.status(413).json({ message: 'Avatar image must be smaller than 1.5MB', field: 'avatar' })
  }
  if (displayName === undefined && username === undefined && avatar === undefined) {
    return res.status(400).json({ message: 'No profile fields to update' })
  }

  try {
    const update = {}
    if (displayName !== undefined) update.displayName = displayName
    if (username !== undefined) update.username = username
    if (avatar !== undefined) update.avatar = avatar
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true },
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json({ user: publicUser(user) })
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'Username is already in use', field: 'username' })
    console.error('Profile update failed:', error.message)
    return res.status(500).json({ message: 'Profile update failed' })
  }
})

router.patch('/privacy', requireUser, async (req, res) => {
  const stampBookVisible = req.body.stampBookVisible
  if (typeof stampBookVisible !== 'boolean') {
    return res.status(400).json({ message: 'stampBookVisible must be boolean', field: 'stampBookVisible' })
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { 'privacy.stampBookVisible': stampBookVisible } },
    { new: true, runValidators: true },
  )
  if (!user) return res.status(404).json({ message: 'User not found' })
  return res.json({ user: publicUser(user) })
})

router.post('/change-password', requireUser, async (req, res) => {
  const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : ''
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : ''
  if (newPassword.length < 8 || newPassword.length > 72 || Buffer.byteLength(newPassword, 'utf8') > 72) {
    return res.status(400).json({ message: 'New password must be 8-72 characters', field: 'newPassword' })
  }

  try {
    const user = await User.findById(req.user.id).select('+passwordHash')
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (!user.passwordHash) return res.status(400).json({ message: 'This account does not have a password yet' })
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10)
    await user.save()
    return res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Password change failed:', error.message)
    return res.status(500).json({ message: 'Password change failed' })
  }
})

router.get('/checkins', requireUser, async (req, res) => {
  try {
    const checkins = await CheckIn.find({ userId: req.user.id }).sort({ checkedInAt: -1 }).lean()
    const churches = await Church.find({ id: { $in: checkins.map((item) => item.churchId) } })
      .select('id name nameEn district province imageUrl')
      .lean()
    const churchById = new Map(churches.map((church) => [church.id, church]))
    return res.json({
      count: checkins.length,
      checkins: checkins.map((checkin) => ({
        ...checkin,
        church: churchById.get(checkin.churchId) || null,
      })),
    })
  } catch (error) {
    console.error('Check-in list failed:', error.message)
    return res.status(500).json({ message: 'Failed to load check-ins' })
  }
})

router.get('/checkins/:churchId', requireUser, async (req, res) => {
  const churchId = typeof req.params.churchId === 'string' ? req.params.churchId.trim() : ''
  const checkin = await CheckIn.findOne({ userId: req.user.id, churchId }).lean()
  if (!checkin) return res.status(404).json({ checkedIn: false })
  return res.json({ checkedIn: true, checkin })
})

router.post('/checkins/:churchId', requireUser, async (req, res) => {
  const churchId = typeof req.params.churchId === 'string' ? req.params.churchId.trim() : ''
  if (!churchId) return res.status(400).json({ message: 'Church id is required' })

  try {
    const church = await Church.findOne({ id: churchId })
      .select('id name nameEn district province imageUrl')
      .lean()
    if (!church) return res.status(404).json({ message: 'Church not found' })
    const checkin = await CheckIn.create({ userId: req.user.id, churchId })
    return res.status(201).json({ checkin: { ...checkin.toObject(), church } })
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'Already checked in at this church' })
    console.error('Check-in creation failed:', error.message)
    return res.status(500).json({ message: 'Check-in failed' })
  }
})

router.delete('/checkins/:churchId', requireUser, async (req, res) => {
  try {
    const result = await CheckIn.deleteOne({ userId: req.user.id, churchId: req.params.churchId })
    if (!result.deletedCount) return res.status(404).json({ message: 'Check-in not found' })
    return res.json({ message: 'Check-in removed' })
  } catch (error) {
    console.error('Check-in removal failed:', error.message)
    return res.status(500).json({ message: 'Failed to remove check-in' })
  }
})

export default router
