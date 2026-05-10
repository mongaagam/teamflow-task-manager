import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
import { Modal, EmptyState, ProgressBar, AvatarGroup, Spinner, CardSkeleton, ProjectStatusBadge } from '../components/ui/UIComponents'
import { formatDate, getProjectStatusConfig } from '../utils/helpers'

const ICONS = ['📁','🚀','🎯','💡','🔥','⚡','🌟','🛠️','📊','🎨','🧩','🔮']
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#10b981','#06b6d4','#3b82f6','#84cc16','#f97316']

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, statusFilter],
    queryFn: () => api.get('/projects', { params: { search, status: statusFilter } }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/projects', body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['projects']); setShowCreate(false); toast.success('Project created! 🎉') },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create project'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries(['projects']); toast.success('Project deleted') },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete'),
  })

  const projects = data?.projects || []

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <span className="text-lg leading-none">+</span> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects…" className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          <option value="planning">Planning</option><option value="active">Active</option><option value="on-hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon="◫" title="No projects found"
          description="Create your first project to get started."
          action={<button onClick={() => setShowCreate(true)} className="btn-primary">Create Project</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(p => <ProjectCard key={p._id} project={p} currentUserId={user._id} onDelete={() => {
            if (confirm(`Delete "${p.name}"? This will also delete all tasks.`)) deleteMutation.mutate(p._id)
          }} />)}
        </div>
      )}

      {/* Create modal */}
      <CreateProjectModal isOpen={showCreate} onClose={() => setShowCreate(false)}
        onSubmit={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />
    </div>
  )
}

function ProjectCard({ project: p, currentUserId, onDelete }) {
  const progress = p.taskCounts?.total > 0 ? Math.round(((p.taskCounts?.done || 0) / p.taskCounts.total) * 100) : 0
  const statusCfg = getProjectStatusConfig(p.status)
  const isOwner = p.owner?._id === currentUserId || p.owner === currentUserId

  return (
    <div className="glass-card p-5 group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Top */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${p.color}22`, border: `1px solid ${p.color}44` }}>
            {p.icon || '📁'}
          </div>
          <div>
            <Link to={`/projects/${p._id}`}
              className="text-sm font-bold text-slate-800 dark:text-white hover:text-brand-500 dark:hover:text-brand-400 transition-colors line-clamp-1">
              {p.name}
            </Link>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`badge text-xs ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <button onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-xs p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
            🗑
          </button>
        )}
      </div>

      {/* Description */}
      {p.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{p.description}</p>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500">Progress</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{progress}%</span>
        </div>
        <ProgressBar value={progress} color={p.color || '#6366f1'} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/8">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span title="Tasks">✓ {p.taskCounts?.total || 0}</span>
          <span title="Members">⊕ {(p.members?.length || 0) + 1}</span>
          {p.dueDate && <span title="Due date">📅 {formatDate(p.dueDate)}</span>}
        </div>
        <AvatarGroup users={[p.owner, ...(p.members?.map(m => m.user) || [])].filter(Boolean)} max={3} />
      </div>
    </div>
  )
}

function CreateProjectModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    name: '', description: '', status: 'planning', priority: 'medium',
    color: COLORS[0], icon: ICONS[0], dueDate: ''
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target?.value ?? e }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Project name is required')
    onSubmit({ ...form, dueDate: form.dueDate || undefined })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Icon + color */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${form.color}22`, border: `2px solid ${form.color}44` }}>
            {form.icon}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => set('icon')(ic)}
                    className={`text-lg p-1 rounded-lg transition-all ${form.icon === ic ? 'bg-brand-100 dark:bg-brand-500/20 scale-110' : 'hover:bg-slate-100 dark:hover:bg-white/8'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set('color')(c)}
                    className={`w-6 h-6 rounded-full transition-all ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-900' : ''}`}
                    style={{ background: c, ringColor: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Project Name *</label>
          <input value={form.name} onChange={set('name')} className="input" placeholder="e.g. Website Redesign" required />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={set('description')} className="input resize-none" rows={2} placeholder="Brief project description…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select value={form.status} onChange={set('status')} className="input">
              <option value="planning">Planning</option><option value="active">Active</option><option value="on-hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select value={form.priority} onChange={set('priority')} className="input">
              {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Due Date</label>
          <input type="date" value={form.dueDate} onChange={set('dueDate')} className="input" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-primary flex-1 justify-center">
            {isLoading ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
