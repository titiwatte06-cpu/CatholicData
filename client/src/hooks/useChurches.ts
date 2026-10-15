import { useCallback, useEffect, useRef, useState } from 'react'
import type { Church } from '../data/churches'
import { API_BASE_URL } from '../config'

const STORAGE_KEY = 'churches:all:v1'
const CLIENT_FRESH_MS = 30_000

type StoredChurches = { data: Church[]; etag: string | null; cachedAt: number }

function readStoredChurches(): StoredChurches | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return null
    const parsed = JSON.parse(value) as StoredChurches
    return Array.isArray(parsed.data) ? parsed : null
  } catch {
    return null
  }
}

function storeChurches(value: StoredChurches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // หาก storage เต็ม/ถูกปิด ให้หน้าแผนที่ยังทำงานด้วย state ในหน่วยความจำ
  }
}

export function useChurches() {
  const initial = useRef<StoredChurches | null>(null)
  if (initial.current === null) initial.current = readStoredChurches()
  const etagRef = useRef(initial.current?.etag ?? null)
  const hasDataRef = useRef(Boolean(initial.current?.data.length))
  const [churches, setChurches] = useState<Church[]>(initial.current?.data ?? [])
  const [loading, setLoading] = useState(!initial.current)
  const [error, setError] = useState<string | null>(null)
  const cachedAtRef = useRef(initial.current?.cachedAt ?? 0)

  const refetch = useCallback(async () => {
    if (!hasDataRef.current) setLoading(true)
    setError(null)
    try {
      const headers = new Headers()
      if (etagRef.current) headers.set('If-None-Match', etagRef.current)
      const response = await fetch(`${API_BASE_URL}/api/churches`, {
        headers,
        cache: 'no-cache',
      })

      if (response.status === 304) {
        cachedAtRef.current = Date.now()
        const current = readStoredChurches()
        if (current) storeChurches({ ...current, cachedAt: cachedAtRef.current })
        return
      }
      if (!response.ok) throw new Error('Could not load church data')

      const data: Church[] = await response.json()
      etagRef.current = response.headers.get('ETag')
      cachedAtRef.current = Date.now()
      setChurches(data)
      hasDataRef.current = true
      storeChurches({ data, etag: etagRef.current, cachedAt: cachedAtRef.current })
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Could not load church data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refetch() }, [refetch])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - cachedAtRef.current > CLIENT_FRESH_MS) {
        void refetch()
      }
    }
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [refetch])

  return { churches, loading, error, refetch }
}
