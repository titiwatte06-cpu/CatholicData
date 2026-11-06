import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './auth-page.css'

export function AuthPage() {
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/account/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, username, displayName, consent }),
      })
      const payload = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(payload.message || 'Authentication failed')
      const returnTo = new URLSearchParams(location.search).get('returnTo') || '/profile'
      // Reload so AdminAuthProvider reads the admin cookie when admin credentials were used.
      window.location.assign(returnTo)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">วัดคาทอลิก</Link>
        <h1>{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</h1>
        <p className="auth-subtitle">{mode === 'login' ? 'เข้าสู่ระบบเพื่อดูสมุดตราประทับของคุณ' : 'สร้างบัญชีเพื่อเริ่มสะสมตราประทับ'}</p>
        <form onSubmit={submit}>
          {mode === 'register' && <>
            <label>ชื่อผู้ใช้<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label>
            <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="เช่น catholic_user" /></label>
          </>}
          <label>อีเมล<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>รหัสผ่าน<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
          {mode === 'register' && <label className="auth-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /> ยอมรับนโยบายความเป็นส่วนตัว</label>}
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={submitting}>{submitting ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
        </form>
        <button type="button" className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
          {mode === 'login' ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
        </button>
      </section>
    </main>
  )
}
