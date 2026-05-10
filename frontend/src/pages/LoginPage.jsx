import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuthStore from '../context/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await login(form.email, form.password)
      toast.success('Welcome back! 👋')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    }
  }

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@teamflow.io', password: 'admin123' })
    else setForm({ email: 'member@teamflow.io', password: 'member123' })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 lg:hidden mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display text-lg font-bold text-white">TeamFlow</span>
        </div>
        <h2 className="text-3xl font-bold text-white">Sign in</h2>
        <p className="text-slate-400">Welcome back! Enter your credentials to continue.</p>
      </div>

      {/* Demo credentials */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => fillDemo('admin')} className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-400 font-medium hover:bg-brand-500/15 transition-all text-left">
          <div className="font-semibold text-brand-300 mb-0.5">👑 Admin Demo</div>
          admin@teamflow.io
        </button>
        <button onClick={() => fillDemo('member')} className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium hover:bg-purple-500/15 transition-all text-left">
          <div className="font-semibold text-purple-300 mb-0.5">👤 Member Demo</div>
          member@teamflow.io
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label text-slate-400">Email address</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className={`input bg-white/5 border-white/10 text-white placeholder-slate-600 focus:border-brand-500/60 ${errors.email ? 'border-red-500/50' : ''}`}
            placeholder="you@company.com"
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="label text-slate-400">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={`input bg-white/5 border-white/10 text-white placeholder-slate-600 focus:border-brand-500/60 pr-10 ${errors.password ? 'border-red-500/50' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
        </div>

        <button type="submit" disabled={isLoading}
          className="btn-primary w-full justify-center py-3 text-base">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Signing in…
            </span>
          ) : 'Sign in →'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          Create one
        </Link>
      </p>
    </div>
  )
}
