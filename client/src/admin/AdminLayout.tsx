import { NavLink, Link, Outlet } from 'react-router-dom'
import { useAdminAuth } from './AdminAuth'
import { useLanguage } from '../LanguageContext'

export default function AdminLayout() {
  const { logout } = useAdminAuth()
  const { lang, toggleLang } = useLanguage()
  const menuLabel = lang === 'th' ? 'ภาพรวม' : 'Overview'

  return (
    <div className="flex min-h-screen font-sans">
      <aside className="w-56 bg-[#6B2737] text-white flex flex-col py-6 shrink-0">
        <div className="px-6 pb-6 border-b border-white/20">
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
            {lang === 'th' ? 'วัดคาทอลิก' : 'Catholic Churches'}
          </p>
          <p className="text-xl font-bold mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 py-4">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `block px-6 py-2.5 text-sm text-white no-underline border-l-[3px] transition-colors ` +
              (isActive
                ? 'font-semibold bg-white/15 border-white'
                : 'font-normal bg-transparent border-transparent hover:bg-white/10')
            }
          >
            {menuLabel}
          </NavLink>
        </nav>

        <div className="px-6 pt-4 border-t border-white/20 flex flex-col gap-2">
          <Link to="/map" className="text-sm text-white/80 hover:text-white">
            {lang === 'th' ? '← กลับไปหน้าแผนที่' : '← Back to map'}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-white/80 hover:text-white text-left"
          >
            {lang === 'th' ? 'ออกจากระบบ' : 'Log out'}
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#FAF7F0] p-8 overflow-y-auto">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            className="rounded border border-[#DDD9D0] bg-white px-3 py-1.5 text-sm font-medium text-[#4B4945] hover:bg-[#F8F6F2]"
          >
            {lang === 'th' ? 'EN' : 'ไทย'}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  )
}