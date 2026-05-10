import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
import { Avatar, Modal, ConfirmDialog, EmptyState, CardSkeleton, Spinner } from '../components/ui/UIComponents'
import { formatDate, formatRelative } from '../utils/helpers'

const ROLES = ['admin', 'member']

function InviteModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [errors, setErrors] = useState({})

  const create = useMutation({
    mutationFn: (data) => api.post('/auth/register', data),
    onSuccess: () => {
      qc.invalidateQueries(['team'])
      toast.success('Team member added!')
      onClose()
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to add member'),
  })

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email) e.email = 'Required'
    if (!form.password || form.password.length < 6) e.password = 'Min 6 chars'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    create.mutate(form)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <input className={`input ${errors.name ? 'border-red-500/50' : ''}`} value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" autoFocus />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" className={`input ${errors.email ? 'border-red-500/50' : ''}`} value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" />
        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="label">Temporary Password</label>
        <input type="password" className={`input ${errors.password ? 'border-red-500/50' : ''}`} value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" />
        {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
      </div>
      <div>
        <label className="label">Role</label>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: 'member', icon: '👤', label: 'Member' }, { value: 'admin', icon: '👑', label: 'Admin' }].map(r => (
            <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
              className={`p-3 rounded-xl border text-sm font-semibold transition-all text-left ${form.role === r.value ? 'bg-brand-500/10 border-brand-500/40 text-brand-600 dark:text-brand-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8'}`}>
              <span className="text-lg mr-2">{r.icon}</span>{r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-white/8">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={create.isPending}>
          {create.isPending ? <><Spinner size="sm" />Adding…</> : 'Add Member'}
        </button>
      </div>
    </form>
  )
}

export default function TeamPage() {
  const { user: me } = useAuthStore()
  const qc = useQueryClient()
  const isAdmin = me?.role === 'admin'
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['team', search, roleFilter],
    queryFn: () => api.get('/users', { params: { search: search || undefined, role: roleFilter || undefined, limit: 50 } }).then(r => r.data),
    enabled: isAdmin,
  })

  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/users/members').then(r => r.data),
  })

  const updateUser = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['team']); toast.success('User updated'); setEditTarget(null) },
    onError: () => toast.error('Failed to update user'),
  })

  const deleteUser = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries(['team']); toast.success('User removed'); setDeleteTarget(null) },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to remove user'),
  })

  const users = isAdmin ? (data?.users || []) : (membersData?.users || [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setInviteOpen(true)} className="btn-primary">+ Add Member</button>
        )}
      </div>

      {isAdmin && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input className="input pl-8 py-2 text-sm" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto py-2 text-sm" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No team members" description="Add your first team member to get started." action={isAdmin && <button onClick={() => setInviteOpen(true)} className="btn-primary">+ Add Member</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u._id} className="glass-card p-5 hover:shadow-card-hover transition-all duration-200 group">
              <div className="flex items-start gap-4">
                <Avatar user={u} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name}</h3>
                    {u._id === me?._id && <span className="text-xs bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded-full font-semibold">You</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`badge text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400'}`}>
                      {u.role === 'admin' ? '👑' : '👤'} {u.role}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-slate-400'}`} title={u.isActive ? 'Active' : 'Inactive'} />
                  </div>
                  {u.lastLogin && <p className="text-xs text-slate-400 mt-1.5">Last seen {formatRelative(u.lastLogin)}</p>}
                  {!u.lastLogin && <p className="text-xs text-slate-400 mt-1.5">Joined {formatDate(u.createdAt)}</p>}
                </div>
              </div>
              {isAdmin && u._id !== me?._id && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-white/8 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setEditTarget(u)} className="btn-secondary text-xs flex-1">Edit</button>
                  <button onClick={() => setDeleteTarget(u)} className="btn-ghost text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite modal */}
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Add Team Member" size="md">
        <InviteModal onClose={() => setInviteOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit ${editTarget?.name}`} size="sm">
        {editTarget && (
          <div className="space-y-4">
            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ value: 'member', icon: '👤', label: 'Member' }, { value: 'admin', icon: '👑', label: 'Admin' }].map(r => (
                  <button key={r.value} type="button" onClick={() => setEditTarget(t => ({ ...t, role: r.value }))}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all text-left ${editTarget.role === r.value ? 'bg-brand-500/10 border-brand-500/40 text-brand-600 dark:text-brand-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}>
                    <span className="text-lg mr-2">{r.icon}</span>{r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">Account status</span>
              <button onClick={() => setEditTarget(t => ({ ...t, isActive: !t.isActive }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${editTarget.isActive ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editTarget.isActive ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-white/8">
              <button onClick={() => setEditTarget(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => updateUser.mutate({ id: editTarget._id, role: editTarget.role, isActive: editTarget.isActive })}
                className="btn-primary" disabled={updateUser.isPending}>
                {updateUser.isPending ? <Spinner size="sm" /> : 'Save'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteUser.mutate(deleteTarget._id)}
        title="Remove Member"
        message={`Remove ${deleteTarget?.name} from the team? They will lose access to all projects.`}
        confirmLabel="Remove Member"
      />
    </div>
  )
}
