import express from 'express'
import Church from '../models/Church.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

// GET /api/churches — public, รายการวัดทั้งหมด
router.get('/', async (req, res) => {
  const churches = await Church.find().sort({ name: 1 })
  res.json(churches)
})

// GET /api/churches/:id — public, วัดเดียว
router.get('/:id', async (req, res) => {
  const church = await Church.findOne({ id: req.params.id })
  if (!church) return res.status(404).json({ message: 'church not found' })
  res.json(church)
})

// POST /api/churches — protected, เพิ่มวัดใหม่
router.post('/', requireAdmin, async (req, res) => {
  const exists = await Church.findOne({ id: req.body.id })
  if (exists) return res.status(409).json({ message: 'church id already exists' })
  const church = await Church.create(req.body)
  res.status(201).json(church)
})

// PUT /api/churches/:id — protected, แก้ไขวัด
router.put('/:id', requireAdmin, async (req, res) => {
  const church = await Church.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })
  if (!church) return res.status(404).json({ message: 'church not found' })
  res.json(church)
})

// DELETE /api/churches/:id — protected, ลบวัด
router.delete('/:id', requireAdmin, async (req, res) => {
  const church = await Church.findOneAndDelete({ id: req.params.id })
  if (!church) return res.status(404).json({ message: 'church not found' })
  res.json({ message: 'deleted' })
})

export default router