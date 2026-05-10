import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-surface-950 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-mesh-gradient" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative p-14">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display text-xl font-bold text-white">TeamFlow</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="font-display text-5xl font-bold leading-tight text-white">
              Manage teams,<br />
              <span className="text-gradient">ship faster.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-sm leading-relaxed">
              The modern workspace for high-performing teams to plan, track, and deliver outstanding work.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '⚡', label: 'Real-time sync', desc: 'Always up to date' },
              { icon: '🎯', label: 'Smart tracking', desc: 'Never miss a deadline' },
              { icon: '📊', label: 'Analytics', desc: 'Data-driven insights' },
              { icon: '🔒', label: 'Secure', desc: 'Enterprise-grade' },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm hover:bg-white/8 transition-all duration-200">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-600">© 2024 TeamFlow. All rights reserved.</p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md animate-fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
