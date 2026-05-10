import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
import { Avatar, Spinner } from '../components/ui/UIComponents'
import { getAvatarColor } from '../utils/helpers'

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600','from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600','from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600','from-indigo-500 to-blue-600',
]

export default function SettingsPage() {
  const { user, updateUser, setTheme } = useAuthStore()
  const isDark = user?.preferences?.theme !== 'light'

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [activeTab, setActiveTab] = useState('profile')

  const updateProfile = useMutation({
    mutationFn: (data) => api.put('/auth/update-profile', data).then(r => r.data),
    onSuccess: (data) => { updateUser(data.user); toast.success('Profile updated!') },
    onError: () => toast.error('Failed to update profile'),
  })

  const changePassword = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => { toast.success('Password changed!'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to change password'),
  })

  const validatePassword = () => {
    const e = {}
    if (!passwordForm.currentPassword) e.currentPassword = 'Required'
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) e.newPassword = 'Min 6 characters'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setPasswordErrors(e)
    return !Object.keys(e).length
  }

  const TABS = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'security', label: '🔒 Security', icon: '🔒' },
    { id: 'appearance', label: '🎨 Appearance', icon: '🎨' },
  ]

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl mb-6">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-surface-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="glass-card p-6 space-y-6 animate-fade-in">
          {/* Avatar section */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Profile Picture</h3>
            <div className="flex items-center gap-6">
              <Avatar user={{ ...user, name: profileForm.name || user?.name }} size="xl" />
              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-3">Choose an avatar color:</p>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((color, i) => (
                    <button key={i} onClick={() => setProfileForm(f => ({ ...f, avatar: '' }))}
                      className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} transition-all hover:scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-900 ${getAvatarColor(profileForm.name || user?.name) === color ? 'ring-brand-500' : 'ring-transparent'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Avatar color is based on your name initial</p>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Name & email */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Personal Information</h3>
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input opacity-60 cursor-not-allowed" value={user?.email} disabled />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="label">Role</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <span>{user?.role === 'admin' ? '👑' : '👤'}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => updateProfile.mutate({ name: profileForm.name })}
              className="btn-primary" disabled={updateProfile.isPending || !profileForm.name.trim()}>
              {updateProfile.isPending ? <><Spinner size="sm" />Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="glass-card p-6 space-y-5 animate-fade-in">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Password</h3>
          <div>
            <label className="label">Current Password</label>
            <input type="password" className={`input ${passwordErrors.currentPassword ? 'border-red-500/50' : ''}`}
              value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••••" />
            {passwordErrors.currentPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.currentPassword}</p>}
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className={`input ${passwordErrors.newPassword ? 'border-red-500/50' : ''}`}
              value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min. 6 characters" />
            {passwordErrors.newPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.newPassword}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className={`input ${passwordErrors.confirmPassword ? 'border-red-500/50' : ''}`}
              value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
            {passwordErrors.confirmPassword && <p className="text-xs text-red-400 mt-1">{passwordErrors.confirmPassword}</p>}
          </div>

          {/* Password strength */}
          {passwordForm.newPassword && (
            <div>
              <div className="flex gap-1 mb-1">
                {[1,2,3,4].map(i => {
                  const strength = Math.min(4, Math.floor(passwordForm.newPassword.length / 3))
                  return <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? ['bg-red-500','bg-orange-500','bg-yellow-500','bg-green-500'][strength-1] : 'bg-slate-200 dark:bg-white/10'}`} />
                })}
              </div>
              <p className="text-xs text-slate-400">{['','Weak','Fair','Good','Strong'][Math.min(4,Math.floor(passwordForm.newPassword.length/3))]} password</p>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-white/8">
            <button onClick={() => { if (validatePassword()) changePassword.mutate(passwordForm) }}
              className="btn-primary" disabled={changePassword.isPending}>
              {changePassword.isPending ? <><Spinner size="sm" />Changing…</> : 'Change Password'}
            </button>
          </div>

          <div className="divider" />

          {/* Session info */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Session Information</h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Last login</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Account created</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearance tab */}
      {activeTab === 'appearance' && (
        <div className="glass-card p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Theme</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'light', label: 'Light Mode', icon: '☀️', desc: 'Clean and bright interface' },
                { value: 'dark', label: 'Dark Mode', icon: '🌙', desc: 'Easy on the eyes at night' },
              ].map(t => (
                <button key={t.value} onClick={() => setTheme(t.value)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${(!isDark && t.value === 'light') || (isDark && t.value === 'dark') ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 dark:border-white/10 hover:border-brand-300'}`}>
                  <div className="text-3xl mb-2">{t.icon}</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{t.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                  {((!isDark && t.value === 'light') || (isDark && t.value === 'dark')) && (
                    <div className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400">✓ Active</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Notifications</h3>
            {[
              { label: 'Task assignments', desc: 'When you are assigned to a task', key: 'taskAssigned' },
              { label: 'Due date reminders', desc: 'Reminders before tasks are due', key: 'dueDateReminder' },
              { label: 'Project updates', desc: 'When project status changes', key: 'projectUpdates' },
              { label: 'Team mentions', desc: 'When someone mentions you in comments', key: 'mentions' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-white/8 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.label}</div>
                  <div className="text-xs text-slate-400">{n.desc}</div>
                </div>
                <button className="relative w-10 h-5 rounded-full bg-brand-500 transition-colors">
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
