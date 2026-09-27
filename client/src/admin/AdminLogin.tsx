import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from './AdminAuth.tsx'
import { useLanguage } from '../LanguageContext'

export function AdminLogin() {
  const { login } = useAdminAuth()
  const { lang, toggleLang } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const text = lang === 'th' ? {
    title: 'เข้าสู่ระบบผู้ดูแลระบบ',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    invalid: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    submit: 'เข้าสู่ระบบ',
    submitting: 'กำลังเข้าสู่ระบบ...',
  } : {
    title: 'Admin sign in',
    email: 'Email',
    password: 'Password',
    invalid: 'Incorrect email or password.',
    submit: 'Sign in',
    submitting: 'Signing in...',
  }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const success = await login(email, password)
    setSubmitting(false)
    if (success) {
      const from = (location.state as { from?: string } | null)?.from ?? '/admin'
      navigate(from, { replace: true })
    } else {
      setError(text.invalid)
    }
  }

  return (
    <main className="admin-login-page relative">
      <button
        type="button"
        onClick={toggleLang}
        aria-label={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        className="absolute right-4 top-4 rounded border border-[#DDD9D0] bg-white px-3 py-1.5 text-sm font-medium text-[#4B4945] hover:bg-[#F8F6F2]"
      >
        {lang === 'th' ? 'EN' : 'ไทย'}
      </button>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h1>{text.title}</h1>
        <label htmlFor="email">{text.email}</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password">{text.password}</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="admin-login-error">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? text.submitting : text.submit}</button>
      </form>
    </main>
  )
}