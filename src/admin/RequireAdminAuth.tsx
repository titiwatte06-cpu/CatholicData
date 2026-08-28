import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from './AdminAuth'

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth()
  const location = useLocation()
  if (loading) return <p className="admin-loading">กำลังตรวจสอบสิทธิ์...</p>
  if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}