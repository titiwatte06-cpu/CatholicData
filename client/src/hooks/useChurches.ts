import { useCallback, useEffect, useState } from 'react'
import type { Church } from '../data/churches'

export function useChurches() {
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/churches')
      if (!res.ok) throw new Error('โหลดข้อมูลวัดไม่สำเร็จ')
      const data: Church[] = await res.json()
      setChurches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return { churches, loading, error, refetch }
}