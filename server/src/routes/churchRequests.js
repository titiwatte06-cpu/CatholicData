import express from 'express'
import ChurchRequest from '../models/ChurchRequest.js'
import Church from '../models/Church.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

// PUBLIC — สัตบุรุษส่งคำขอ ไม่ต้อง login
router.post('/', async (req, res) => {
  const { type, targetChurchId, proposedData, reason, submitterContact } = req.body
  if (!['add', 'edit', 'delete'].includes(type)) {
    return res.status(400).json({ message: 'invalid request type' })
  }
  const request = await ChurchRequest.create({ type, targetChurchId, proposedData, reason, submitterContact })
  res.status(201).json(request)
})

// ADMIN ONLY — ดูคิวคำขอ
router.get('/', requireAdmin, async (req, res) => {
  const requests = await ChurchRequest.find({ status: req.query.status ?? 'pending' }).sort({ createdAt: -1 })
  res.json(requests)
})

// ADMIN ONLY — อนุมัติ → เขียนข้อมูลจริง
router.post('/:id/approve', requireAdmin, async (req, res) => {
  const request = await ChurchRequest.findById(req.params.id)
  if (!request || request.status !== 'pending') return res.status(404).json({ message: 'not found' })

  if (request.type === 'add') await Church.create(request.proposedData)
  if (request.type === 'edit') await Church.findOneAndUpdate({ id: request.targetChurchId }, request.proposedData)
  if (request.type === 'delete') await Church.findOneAndDelete({ id: request.targetChurchId })

  request.status = 'approved'
  request.reviewedAt = new Date()
  await request.save()
  res.json(request)
})

// ADMIN ONLY — ปฏิเสธ
router.post('/:id/reject', requireAdmin, async (req, res) => {
  const request = await ChurchRequest.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', adminNote: req.body.adminNote, reviewedAt: new Date() },
    { new: true },
  )
  if (!request) return res.status(404).json({ message: 'not found' })
  res.json(request)
})

export default router