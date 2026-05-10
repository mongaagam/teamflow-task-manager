import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuthStore from '../context/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'member' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Min 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await register(form.name, form.email, form.password, form.role)
      toast.success('Account created! Welcome to TeamFlow 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Create account</h2>
        <p className="text-slate-400">Join TeamFlow and start managing your team.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label text-slate-400">Full name</label>
          <input type="text" value={form.name} onChange={set('name')}
            className={`input bg-white/5 border-white/10 text-white placeholder-slate-600 ${errors.name ? 'border-red-500/50' : ''}`}
            placeholder="John Doe" />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="label text-slate-400">Email address</label>
          <input type="email" value={form.email} onChange={set('email')}
            className={`input bg-white/5 border-white/10 text-white placeholder-slate-600 ${errors.email ? 'border-red-500/50' : ''}`}
            placeholder="you@company.com" />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="label text-slate-400">Role</label>
          <div className="grid grid-cols-2 gap-3">
            {[{ value: 'member', icon: '👤', label: 'Member' }, { value: 'admin', icon: '👑', label: 'Admin' }].map(r => (
              <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                  form.role === r.value
                    ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/8'
                }`}>
                <span className="mr-2">{r.icon}</span>{r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label text-slate-400">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
              className={`input bg-white/5 border-white/10 text-white placeholder-slate-600 pr-10 ${errors.password ? 'border-red-500/50' : ''}`}
              placeholder="Min. 6 characters" />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="label text-slate-400">Confirm password</label>
          <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
            className={`input bg-white/5 border-white/10 text-white placeholder-slate-600 ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
            placeholder="Repeat password" />
          {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={isLoading}
          className="btn-primary w-full justify-center py-3 text-base mt-2">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Creating account…
            </span>
          ) : 'Create account →'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
