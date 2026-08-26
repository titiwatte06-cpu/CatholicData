import express from 'express'
import Church from '../models/Church.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

// GET /api/churches — public, รายการวัดทั้งหมด
router.get('/', async (req, res) => {
  try {
    const churches = await Church.find().sort({ name: 1 })
    res.json(churches)
  } catch (err) {
    res.status(500).json({ message: 'โหลดข้อมูลวัดไม่สำเร็จ', error: err.message })
  }
})

// GET /api/churches/:id — public, วัดเดียว
router.get('/:id', async (req, res) => {
  try {
    const church = await Church.findOne({ id: req.params.id })
    if (!church) return res.status(404).json({ message: 'church not found' })
    res.json(church)
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
    res.json({ message: 'deleted' })
  } catch (err) {
    res.status(500).json({ message: 'ลบข้อมูลไม่สำเร็จ', error: err.message })
  }
})

export default router