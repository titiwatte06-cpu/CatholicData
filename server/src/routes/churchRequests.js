import express from 'express'
import ChurchRequest from '../models/ChurchRequest.js'
import Church from '../models/Church.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

// PUBLIC — สัตบุรุษส่งคำขอ ไม่ต้อง login
router.post('/', async (req, res) => {
  try {
    const { type, targetChurchId, proposedData, reason, submitterContact } = req.body
    if (!['add', 'edit', 'delete'].includes(type)) {
      return res.status(400).json({ message: 'invalid request type' })
    }
    const request = await ChurchRequest.create({ type, targetChurchId, proposedData, reason, submitterContact })
    res.status(201).json(request)
  } catch (err) {
    res.status(400).json({ message: 'ส่งคำขอไม่สำเร็จ', error: err.message })
  }
})

// ADMIN ONLY — ดูคิวคำขอ
router.get('/', requireAdmin, async (req, res) => {
  try {
    const requests = await ChurchRequest.find({ status: req.query.status ?? 'pending' }).sort({ createdAt: -1 })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ message: 'โหลดคำขอไม่สำเร็จ', error: err.message })
  }
})

// ADMIN ONLY — อนุมัติ → เขียนข้อมูลจริง
router.post('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const request = await ChurchRequest.findById(req.params.id)
    if (!request || request.status !== 'pending') return res.status(404).json({ message: 'not found' })

    if (request.type === 'add') {
      const exists = await Church.findOne({ id: request.proposedData?.id })
      if (exists) return res.status(409).json({ message: 'church id already exists' })
      await Church.create(request.proposedData)
    }

    if (request.type === 'edit') {
      const updated = await Church.findOneAndUpdate(
        { id: request.targetChurchId },
        { $set: request.proposedData },
        { new: true, runValidators: true }
      )
      if (!updated) return res.status(404).json({ message: 'ไม่พบวัดที่จะแก้ไข อาจถูกลบไปแล้ว' })
    }

    if (request.type === 'delete') {
      const deleted = await Church.findOneAndDelete({ id: request.targetChurchId })
      if (!deleted) return res.status(404).json({ message: 'ไม่พบวัดที่จะลบ อาจถูกลบไปแล้ว' })
    }

    request.status = 'approved'
    request.reviewedAt = new Date()
    await request.save()
    res.json(request)
  } catch (err) {
    res.status(400).json({ message: 'อนุมัติคำขอไม่สำเร็จ', error: err.message })
  }
})

// ADMIN ONLY — ปฏิเสธ
router.post('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const request = await ChurchRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', adminNote: req.body.adminNote, reviewedAt: new Date() },
      { new: true }
    )
    if (!request) return res.status(404).json({ message: 'not found' })
    res.json(request)
  } catch (err) {
    res.status(400).json({ message: 'ปฏิเสธคำขอไม่สำเร็จ', error: err.message })
  }
})

export default router