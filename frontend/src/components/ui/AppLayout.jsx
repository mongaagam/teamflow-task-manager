import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuthStore from '../../context/authStore'
import { getInitials, getAvatarColor } from '../../utils/helpers'

const navItems = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/projects', icon: '◫', label: 'Projects' },
  { to: '/tasks', icon: '✓', label: 'Tasks' },
  { to: '/team', icon: '⊕', label: 'Team' },
]

function Avatar({ user, size = 'md' }) {
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }[size]
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : getInitials(user?.name)}
    </div>
  )
}

export { Avatar }

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, setTheme } = useAuthStore()
  const navigate = useNavigate()
  const isDark = user?.preferences?.theme !== 'light'

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-white dark:bg-surface-900 border-r border-slate-200 dark:border-white/8
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200 dark:border-white/8 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display text-lg font-bold text-slate-900 dark:text-white">TeamFlow</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="mb-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Menu</p>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          {user?.role === 'admin' && (
            <div className="pt-3 border-t border-slate-200 dark:border-white/8">
              <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Admin</p>
              <NavLink to="/team" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="text-lg leading-none">⚙</span>
                Team Management
              </NavLink>
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-slate-200 dark:border-white/8 space-y-1">
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="nav-item w-full">
            <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>

          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="text-lg">⚙</span>
            Settings
          </NavLink>

          {/* User profile */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/8 transition-all cursor-pointer group mt-1">
            <Avatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-sm">
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-white dark:bg-surface-900 border-b border-slate-200 dark:border-white/8 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="font-display font-bold text-slate-900 dark:text-white">TeamFlow</span>
          <Avatar user={user} size="sm" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
