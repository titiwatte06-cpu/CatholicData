import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { ContentPage, HomePage, MapPage } from './App.tsx'
import { AdminAuthProvider } from './admin/AdminAuth.tsx'
import { AdminLogin } from './admin/AdminLogin.tsx'
import { LanguageProvider } from './LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <AdminAuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/map/church/:churchId" element={<MapPage />} />
            <Route path="/sermons" element={<ContentPage title="บทเทศน์" english="Sermons" />} />
            <Route path="/about" element={<ContentPage title="เกี่ยวกับเรา" english="About Us" />} />
            <Route path="/news" element={<ContentPage title="ข่าว & กิจกรรม" english="News & Events" />} />
            <Route path="/contact" element={<ContentPage title="ติดต่อเรา" english="Contact" />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
