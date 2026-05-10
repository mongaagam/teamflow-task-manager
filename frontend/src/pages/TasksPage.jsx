import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api from '../utils/api'
import {
  Modal, StatusBadge, PriorityBadge, Avatar, AvatarGroup,
  EmptyState, CardSkeleton, ConfirmDialog, Spinner
} from '../components/ui/UIComponents'
import { formatDate, isOverdue, getStatusConfig, TASK_STATUSES, TASK_PRIORITIES } from '../utils/helpers'

export default function TasksPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterOverdue, setFilterOverdue] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [selectedTask, setSelectedTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', search, filterStatus, filterPriority, filterOverdue, sortBy],
    queryFn: () => api.get('/tasks', {
      params: {
        search: search || undefined,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        overdue: filterOverdue ? 'true' : undefined,
        sortBy,
        sortOrder: 'desc',
        limit: 100,
      }
    }).then(r => r.data),
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/tasks/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Status updated') },
  })

  const deleteTask = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Task deleted'); setDeleteTarget(null) },
    onError: () => toast.error('Failed to delete task'),
  })

  const tasks = data?.tasks || []

  const statusCounts = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length
    return acc
  }, {})

  const clearFilters = () => {
    setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterOverdue(false)
  }
  const hasFilters = search || filterStatus || filterPriority || filterOverdue

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Tasks</h1>
          <p className="text-slate-500 text-sm mt-0.5">{data?.total || 0} tasks across all projects</p>
        </div>
      </div>

      {/* Status quick filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${!filterStatus ? 'bg-brand-500 text-white border-brand-500' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-brand-300'}`}>
          All ({tasks.length})
        </button>
        {TASK_STATUSES.map(s => {
          const cfg = getStatusConfig(s)
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterStatus === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-brand-300'}`}>
              {cfg.label} ({statusCounts[s]})
            </button>
          )
        })}
        <button onClick={() => setFilterOverdue(!filterOverdue)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterOverdue ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-white/5 text-red-500 border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10'}`}>
          🔥 Overdue
        </button>
      </div>

      {/* Search + sort bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input className="input pl-8 py-2 text-sm" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto py-2 text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All priorities</option>
          {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select className="input w-auto py-2 text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="createdAt">Newest first</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
          <option value="updatedAt">Recently updated</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost text-xs text-slate-500">✕ Clear</button>
        )}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">{Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : tasks.length === 0 ? (
        <EmptyState icon="✅" title="No tasks found" description="Try adjusting your filters or create a new task from a project." action={<Link to="/projects" className="btn-primary">Go to Projects</Link>} />
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const overdue = isOverdue(task.dueDate, task.status)
            return (
              <div key={task._id}
                className={`glass-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-all duration-200 group ${overdue ? 'border-red-200 dark:border-red-500/20' : ''}`}
                onClick={() => setSelectedTask(task)}>
                {/* Status icon */}
                <div className="flex-shrink-0">
                  <StatusBadge status={task.status} />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {task.title}
                    </p>
                    {overdue && <span className="text-xs bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0">Overdue</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {task.project && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <span>{task.project.icon}</span>
                        <span className="truncate max-w-24">{task.project.name}</span>
                      </span>
                    )}
                    {task.description && <span className="text-xs text-slate-400 truncate max-w-xs hidden sm:block">{task.description}</span>}
                  </div>
                </div>

                {/* Right side metadata */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && (
                    <span className={`text-xs font-medium hidden sm:block ${overdue ? 'text-red-500' : 'text-slate-500'}`}>
                      📅 {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.assignees?.length > 0 && <AvatarGroup users={task.assignees} max={3} size="xs" />}

                  {/* Quick status change */}
                  <select
                    value={task.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateStatus.mutate({ id: task._id, status: e.target.value })}
                    className="text-xs border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500/40 hidden md:block">
                    {TASK_STATUSES.map(s => <option key={s} value={s}>{getStatusConfig(s).label}</option>)}
                  </select>

                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(task) }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-sm p-1 rounded">🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Task detail modal */}
      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title={selectedTask?.title} size="lg">
        {selectedTask && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="label">Status</span><StatusBadge status={selectedTask.status} /></div>
              <div><span className="label">Priority</span><PriorityBadge priority={selectedTask.priority} /></div>
              <div><span className="label">Project</span>
                {selectedTask.project ? (
                  <Link to={`/projects/${selectedTask.project._id}`} className="text-brand-500 hover:underline flex items-center gap-1">
                    <span>{selectedTask.project.icon}</span>{selectedTask.project.name}
                  </Link>
                ) : '—'}
              </div>
              <div><span className="label">Due Date</span><span className="text-slate-700 dark:text-slate-300">{formatDate(selectedTask.dueDate) || '—'}</span></div>
              <div><span className="label">Created By</span>
                <div className="flex items-center gap-2">
                  <Avatar user={selectedTask.createdBy} size="xs" />
                  <span className="text-slate-600 dark:text-slate-400">{selectedTask.createdBy?.name}</span>
                </div>
              </div>
              <div><span className="label">Assignees</span>
                {selectedTask.assignees?.length > 0
                  ? <AvatarGroup users={selectedTask.assignees} max={5} size="sm" />
                  : <span className="text-slate-400 text-xs">Unassigned</span>}
              </div>
            </div>
            {selectedTask.description && (
              <div>
                <span className="label">Description</span>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{selectedTask.description}</p>
              </div>
            )}
            {selectedTask.tags?.length > 0 && (
              <div>
                <span className="label">Tags</span>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {selectedTask.tags.map(t => <span key={t} className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">{t}</span>)}
                </div>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-white/8">
              <Link to={`/projects/${selectedTask.project?._id}`} className="btn-secondary text-xs" onClick={() => setSelectedTask(null)}>
                Open Project →
              </Link>
              <button onClick={() => { setDeleteTarget(selectedTask); setSelectedTask(null) }} className="btn-ghost text-red-500 text-xs">Delete task</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTask.mutate(deleteTarget._id)}
        title="Delete Task"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
      />
    </div>
  )
}
