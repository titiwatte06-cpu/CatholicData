import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireUser(req, res, next) {
  const authorization = req.get('authorization') || ''
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : ''
  const token = bearerToken || req.cookies.user_token
  if (!process.env.USER_JWT_SECRET?.trim()) {
    return res.status(503).json({ message: 'ระบบ user login ยังไม่ได้ตั้งค่า secret' })
  }
  if (!token) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' })

  try {
    const payload = jwt.verify(token, process.env.USER_JWT_SECRET)
    if (payload.role !== 'user' || typeof payload.sub !== 'string') {
      return res.status(401).json({ message: 'เซสชันไม่ถูกต้อง' })
    }

    const user = await User.findById(payload.sub).select('_id email username displayName avatar role privacy consentAt consentVersion createdAt')
    if (!user) return res.status(401).json({ message: 'ไม่พบสมาชิกนี้แล้ว' })

    req.user = { id: user._id.toString(), role: user.role }
    req.currentUser = user
    next()
  } catch {
    return res.status(401).json({ message: 'เซสชันหมดอายุหรือไม่ถูกต้อง' })
  }
}
