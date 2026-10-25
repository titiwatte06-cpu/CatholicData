import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import './index.css'
import { ContentPage, HomePage, MapPage } from './App.tsx'
import { NewsPage } from './pages/news'
import { AdminAuthProvider } from './admin/AdminAuth.tsx'
import { AdminLogin } from './admin/AdminLogin.tsx'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import { RequireAdminAuth } from './admin/RequireAdminAuth'
import { LanguageProvider } from './LanguageContext'
import { ProfilePage } from './pages/ProfilePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <AdminAuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/map/church/:churchId" element={<MapPage />} />
            <Route path="/profile" element={<RequireAdminAuth><ProfilePage /></RequireAdminAuth>} />

            {/* หน้าอื่นยังใช้ ContentPage เดิม */}
            <Route path="/about" element={<ContentPage title="เกี่ยวกับเรา" english="About Us" />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/contact" element={<ContentPage title="ติดต่อเรา" english="Contact" />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<RequireAdminAuth><AdminLayout /></RequireAdminAuth>}>
              <Route index element={<AdminDashboard />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
