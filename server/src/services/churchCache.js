import { createHash } from 'node:crypto'
import mongoose from 'mongoose'
import Church from '../models/Church.js'

const CACHE_KEY = 'churches:all:v1'
const FRESH_TTL_SECONDS = 60
const STALE_TTL_SECONDS = 5 * 60
const REDIS_TIMEOUT_MS = 1200
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN

let memoryEntry = null
let redisAvailable = false
let flight = null
let churchChangeStream = null
let invalidationTimer = null
let cacheGeneration = 0

function redisConfigured() {
  return Boolean(redisUrl && redisToken)
}

async function redisCommand(command, ...args) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REDIS_TIMEOUT_MS)
  try {
    const isSet = command.toLowerCase() === 'set'
    const response = await fetch(isSet ? redisUrl : `${redisUrl}/${[command, ...args].map(encodeURIComponent).join('/')}`, {
      method: isSet ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        ...(isSet ? { 'Content-Type': 'application/json' } : {}),
      },
      body: isSet ? JSON.stringify(['SET', ...args]) : undefined,
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Redis REST returned ${response.status}`)
    const payload = await response.json()
    if (payload.error) throw new Error(payload.error)
    redisAvailable = true
    return payload.result
  } finally {
    clearTimeout(timeout)
  }
}

function entryFrom(value) {
  if (!value) return null
  try {
    return typeof value === 'string' ? JSON.parse(value) : value
  } catch {
    return null
  }
}

async function readCache() {
  if (redisConfigured()) {
    try {
      return entryFrom(await redisCommand('get', CACHE_KEY))
    } catch (error) {
      redisAvailable = false
      console.warn('Redis read failed; using process cache:', error.message)
    }
  }
  return memoryEntry
}

async function writeCache(entry) {
  memoryEntry = entry
  if (!redisConfigured()) return
  try {
    const ttl = Math.max(1, Math.ceil((entry.staleUntil - Date.now()) / 1000))
    await redisCommand('set', CACHE_KEY, JSON.stringify(entry), 'EX', String(ttl))
  } catch (error) {
    redisAvailable = false
    console.warn('Redis write failed; retaining process cache:', error.message)
  }
}

async function loadFromDatabase() {
  const generation = cacheGeneration
  if (mongoose.connection.readyState !== 1) throw new Error('Database is not connected')
  const documents = await Church.find().sort({ name: 1 }).lean()
  // ถ้ามี write ระหว่าง query ให้ทิ้งผลเก่าแล้วอ่านรอบใหม่ก่อนเก็บ cache
  if (generation !== cacheGeneration) return loadFromDatabase()
  const data = documents.map((church) => ({ ...church, region: church.region || 'bangkok' }))
  const etag = `W/"${createHash('sha256').update(JSON.stringify(data)).digest('hex')}"`
  const now = Date.now()
  const entry = {
    data,
    etag,
    freshUntil: now + FRESH_TTL_SECONDS * 1000,
    staleUntil: now + (FRESH_TTL_SECONDS + STALE_TTL_SECONDS) * 1000,
  }
  await writeCache(entry)
  if (generation !== cacheGeneration) {
    // ป้องกัน SET ของ query เก่ามาเสร็จทีหลัง DEL จากการแก้ข้อมูล
    memoryEntry = null
    if (redisConfigured()) {
      try {
        await redisCommand('del', CACHE_KEY)
      } catch (error) {
        redisAvailable = false
        console.warn('Redis race cleanup failed:', error.message)
      }
    }
    return loadFromDatabase()
  }
  return entry
}

function refreshOnce() {
  if (!flight) {
    flight = loadFromDatabase().finally(() => { flight = null })
  }
  return flight
}

// คืนข้อมูลสดจาก cache ก่อน และให้ stale-while-revalidate อัปเดตเบื้องหลัง
export async function getChurchList() {
  const entry = await readCache()
  const now = Date.now()
  if (entry && entry.freshUntil > now) return { ...entry, cacheStatus: 'HIT' }
  if (entry && entry.staleUntil > now) {
    void refreshOnce().catch((error) => console.error('Church cache refresh failed:', error.message))
    return { ...entry, cacheStatus: 'STALE' }
  }
  const fresh = await refreshOnce()
  return { ...fresh, cacheStatus: 'MISS' }
}

export function warmChurchCache() {
  return refreshOnce()
}

export async function invalidateChurchCache() {
  cacheGeneration += 1
  memoryEntry = null
  if (!redisConfigured()) return
  try {
    await redisCommand('del', CACHE_KEY)
  } catch (error) {
    redisAvailable = false
    console.warn('Redis invalidation failed:', error.message)
  }
}

export function getCacheHealth() {
  return { configured: redisConfigured(), available: redisAvailable }
}

// Mongo change stream ช่วย invalidate เมื่อมีการแก้ข้อมูลตรงในฐานข้อมูลด้วย
export function watchChurchChanges() {
  if (churchChangeStream) return
  try {
    churchChangeStream = Church.watch()
    churchChangeStream.on('change', () => {
      clearTimeout(invalidationTimer)
      invalidationTimer = setTimeout(() => {
        void invalidateChurchCache()
      }, 150)
    })
    churchChangeStream.on('error', (error) => {
      churchChangeStream = null
      console.warn('Church change stream stopped; TTL remains the fallback:', error.message)
    })
  } catch (error) {
    console.warn('Church change stream unavailable; TTL remains the fallback:', error.message)
  }
}
