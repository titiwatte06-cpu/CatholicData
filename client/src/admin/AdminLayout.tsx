import { NavLink, Link, Outlet } from 'react-router-dom'
import { useAdminAuth } from './AdminAuth'

const menuItems = [
  { to: '/admin', label: 'ภาพรวม' },
]

export default function AdminLayout() {
  const { logout } = useAdminAuth()

  return (
    <div className="flex min-h-screen font-sans">
      <aside className="w-56 bg-[#6B2737] text-white flex flex-col py-6 shrink-0">
        <div className="px-6 pb-6 border-b border-white/20">
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
            วัดคาทอลิก
          </p>
          <p className="text-xl font-bold mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `block px-6 py-2.5 text-sm text-white no-underline border-l-[3px] transition-colors ` +
                (isActive
                  ? 'font-semibold bg-white/15 border-white'
                  : 'font-normal bg-transparent border-transparent hover:bg-white/10')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 pt-4 border-t border-white/20 flex flex-col gap-2">
          <Link to="/map" className="text-sm text-white/80 hover:text-white">
            ← กลับไปหน้าแผนที่
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-white/80 hover:text-white text-left"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#FAF7F0] p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}