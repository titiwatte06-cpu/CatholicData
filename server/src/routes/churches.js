import express from 'express'
import Church from '../models/Church.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { getChurchList, invalidateChurchCache } from '../services/churchCache.js'

const router = express.Router()
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

// GET /api/churches — public, รายการวัดทั้งหมด
router.get('/', async (req, res) => {
  try {
    const { data, etag, cacheStatus } = await getChurchList()
    res.set({
      ETag: etag,
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'X-Cache': cacheStatus,
    })
    res.vary('Origin')
    const requestEtags = (req.get('If-None-Match') || '').split(',').map((value) => value.trim())
    const normalizedEtag = etag.replace(/^W\//, '')
    const isNotModified = requestEtags.includes('*') || requestEtags.some(
      (candidate) => candidate.replace(/^W\//, '') === normalizedEtag
    )
    if (isNotModified) return res.status(304).end()
    res.json(data)
  } catch (err) {
    const status = err.message === 'Database is not connected' ? 503 : 500
    res.status(status).json({ message: 'โหลดข้อมูลวัดไม่สำเร็จ', error: err.message })
  }
})

// GET /api/churches/:id — public, วัดเดียว
router.get('/:id', async (req, res) => {
  try {
    const church = await Church.findOne({ id: req.params.id })
    if (!church) return res.status(404).json({ message: 'church not found' })
    const data = church.toObject()
    res.json({ ...data, region: data.region || 'bangkok' })
  } catch (err) {
    res.status(500).json({ message: 'โหลดข้อมูลวัดไม่สำเร็จ', error: err.message })
  }
})

// POST /api/churches — protected, เพิ่มวัดใหม่
router.post('/', requireAdmin, async (req, res) => {
  try {
    const exists = await Church.findOne({ id: req.body.id })
    if (exists) return res.status(409).json({ message: 'church id already exists' })
    const church = await Church.create(req.body)
    await invalidateChurchCache()
    res.status(201).json(church)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'church id already exists' })
    }
    res.status(400).json({ message: 'บันทึกข้อมูลไม่สำเร็จ', error: err.message })
  }
})

// PUT /api/churches/:id — protected, แก้ไขวัด
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const church = await Church.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    )
    if (!church) return res.status(404).json({ message: 'church not found' })
    await invalidateChurchCache()
    res.json(church)
  } catch (err) {
    res.status(400).json({ message: 'แก้ไขข้อมูลไม่สำเร็จ', error: err.message })
  }
})

// DELETE /api/churches/:id — protected, ลบวัด
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const church = await Church.findOneAndDelete({ id: req.params.id })
    if (!church) return res.status(404).json({ message: 'church not found' })
    await invalidateChurchCache()
    res.json({ message: 'deleted' })
  } catch (err) {
    res.status(500).json({ message: 'ลบข้อมูลไม่สำเร็จ', error: err.message })
  }
})

export default router
