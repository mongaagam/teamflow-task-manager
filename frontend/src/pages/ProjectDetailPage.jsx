import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
import {
  Modal, ConfirmDialog, StatusBadge, PriorityBadge,
  Avatar, AvatarGroup, EmptyState, ProgressBar, Spinner, ProjectStatusBadge
} from '../components/ui/UIComponents'
import {
  formatDate, isOverdue, getStatusConfig,
  TASK_STATUSES, TASK_PRIORITIES
} from '../utils/helpers'

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: 'bg-slate-400' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-500'  },
  { id: 'in-review',   label: 'In Review',   color: 'bg-purple-500'},
  { id: 'done',        label: 'Done',        color: 'bg-green-500' },
]

/* ─── Task form (create / edit) ─── */
function TaskForm({ task, projectId, members, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!task
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignees: task?.assignees?.map(a => a._id || a) || [],
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    estimatedHours: task?.estimatedHours || '',
    tags: task?.tags?.join(', ') || '',
    subtasks: task?.subtasks?.map(s => s.title) || [],
    newSubtask: '',
  })

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? api.put(`/tasks/${task._id}`, data).then(r => r.data)
        : api.post('/tasks', { ...data, projectId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['project-tasks', projectId])
      toast.success(isEdit ? 'Task updated!' : 'Task created!')
      onClose()
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to save task'),
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggleAssignee = id => setForm(f => ({
    ...f,
    assignees: f.assignees.includes(id) ? f.assignees.filter(a => a !== id) : [...f.assignees, id],
  }))
  const addSubtask = () => {
    if (!form.newSubtask.trim()) return
    setForm(f => ({ ...f, subtasks: [...f.subtasks, f.newSubtask.trim()], newSubtask: '' }))
  }

  const submit = e => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    mutation.mutate({
      title: form.title, description: form.description,
      status: form.status, priority: form.priority,
      assignees: form.assignees,
      dueDate: form.dueDate || undefined,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      subtasks: form.subtasks.map(t => ({ title: t })),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input className="input" value={form.title} onChange={set('title')} placeholder="Task title…" autoFocus />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} value={form.description} onChange={set('description')} placeholder="What needs to be done?" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {TASK_STATUSES.map(s => <option key={s} value={s}>{getStatusConfig(s).label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={set('priority')}>
            {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
        </div>
        <div>
          <label className="label">Est. Hours</label>
          <input type="number" className="input" value={form.estimatedHours} onChange={set('estimatedHours')} placeholder="e.g. 4" min="0" />
        </div>
      </div>
      {members?.length > 0 && (
        <div>
          <label className="label">Assignees</label>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <button type="button" key={m._id}
                onClick={() => toggleAssignee(m._id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.assignees.includes(m._id) ? 'bg-brand-500/15 border-brand-500/40 text-brand-600 dark:text-brand-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}>
                <Avatar user={m} size="xs" />{m.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="label">Tags (comma separated)</label>
        <input className="input" value={form.tags} onChange={set('tags')} placeholder="frontend, bug, v2…" />
      </div>
      <div>
        <label className="label">Subtasks</label>
        <div className="space-y-1.5 mb-2">
          {form.subtasks.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">{s}</span>
              <button type="button" onClick={() => setForm(f => ({ ...f, subtasks: f.subtasks.filter((_, j) => j !== i) }))} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input flex-1" value={form.newSubtask} onChange={set('newSubtask')} placeholder="Add subtask…"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }} />
          <button type="button" onClick={addSubtask} className="btn-secondary px-3">+</button>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? <><Spinner size="sm" />{isEdit ? 'Saving…' : 'Creating…'}</> : isEdit ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  )
}

/* ─── Task card ─── */
function TaskCard({ task, onClick }) {
  const overdue = isOverdue(task.dueDate, task.status)
  return (
    <div onClick={() => onClick(task)}
      className={`glass-card p-4 cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group ${overdue ? 'border-red-200 dark:border-red-500/20' : ''}`}>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {task.title}
      </p>
      {task.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>}
      {task.subtasks?.length > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Subtasks</span>
            <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
          </div>
          <ProgressBar value={Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)} size="sm" />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`badge text-xs ${task.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' : task.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'}`}>
            {task.priority}
          </span>
          {task.dueDate && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${overdue ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-slate-500'}`}>
              📅 {formatDate(task.dueDate, 'MMM d')}
            </span>
          )}
        </div>
        {task.assignees?.length > 0 && <AvatarGroup users={task.assignees} max={3} size="xs" />}
      </div>
    </div>
  )
}

/* ─── Main component ─── */
export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [view, setView] = useState('board')
  const [taskModal, setTaskModal] = useState(null)   // null | 'create' | task object
  const [detailTask, setDetailTask] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [comment, setComment] = useState('')

  const { data: projectData, isLoading: projLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data),
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', id, filterStatus, filterPriority, search],
    queryFn: () => api.get('/tasks', { params: { projectId: id, status: filterStatus || undefined, priority: filterPriority || undefined, search: search || undefined } }).then(r => r.data),
  })

  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/users/members').then(r => r.data),
  })

  const deleteProject = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => { toast.success('Project deleted'); navigate('/projects') },
    onError: () => toast.error('Failed to delete project'),
  })

  const deleteTask = useMutation({
    mutationFn: (tid) => api.delete(`/tasks/${tid}`),
    onSuccess: () => { qc.invalidateQueries(['project-tasks', id]); toast.success('Task deleted'); setDetailTask(null) },
    onError: () => toast.error('Failed to delete task'),
  })

  const updateStatus = useMutation({
    mutationFn: ({ tid, status }) => api.put(`/tasks/${tid}`, { status }),
    onSuccess: () => qc.invalidateQueries(['project-tasks', id]),
  })

  const addComment = useMutation({
    mutationFn: () => api.post(`/tasks/${detailTask._id}/comments`, { content: comment }),
    onSuccess: () => { qc.invalidateQueries(['project-tasks', id]); setComment(''); toast.success('Comment added') },
    onError: () => toast.error('Failed to add comment'),
  })

  const toggleSubtask = useMutation({
    mutationFn: ({ sid, completed }) => api.put(`/tasks/${detailTask?._id}/subtasks/${sid}`, { completed }),
    onSuccess: () => qc.invalidateQueries(['project-tasks', id]),
  })

  const project = projectData?.project
  const tasks = tasksData?.tasks || []
  const members = membersData?.users || []
  const isOwner = project?.owner?._id === user?._id || project?.owner === user?._id

  const tasksByStatus = TASK_STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s) }), {})
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  if (projLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!project) return (
    <div className="p-6">
      <EmptyState icon="🔍" title="Project not found" description="This project doesn't exist or you don't have access."
        action={<Link to="/projects" className="btn-primary">← Back to Projects</Link>} />
    </div>
  )

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Project header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-surface-900 flex-shrink-0">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${project.color}22` }}>
            {project.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            {project.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <AvatarGroup users={project.members?.map(m => m.user).filter(Boolean)} max={4} size="xs" />
                <span className="text-xs text-slate-500">{project.members?.length || 0} members</span>
              </div>
              {project.dueDate && <span className="text-xs text-slate-500">Due {formatDate(project.dueDate)}</span>}
              <div className="flex items-center gap-2">
                <ProgressBar value={progress} size="sm" />
                <span className="text-xs text-slate-500 whitespace-nowrap">{progress}% ({doneTasks}/{totalTasks})</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwner && (
              <button onClick={() => setDeleteConfirm(true)} className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs">🗑️</button>
            )}
            <button onClick={() => setTaskModal('create')} className="btn-primary text-sm">+ Add Task</button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input className="input pl-8 py-2 text-sm" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {TASK_STATUSES.map(s => <option key={s} value={s}>{getStatusConfig(s).label}</option>)}
          </select>
          <select className="input w-auto py-2 text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All priorities</option>
            {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <div className="flex rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {[{ id: 'board', icon: '⊞' }, { id: 'list', icon: '☰' }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`px-3 py-2 text-sm transition-colors ${view === v.id ? 'bg-brand-500 text-white' : 'bg-white dark:bg-surface-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Board / List */}
      <div className="flex-1 overflow-auto p-6">
        {tasksLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : view === 'board' ? (
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map(col => (
              <div key={col.id} className="w-72 flex-shrink-0 flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{tasksByStatus[col.id]?.length || 0}</span>
                </div>
                <div className="flex-1 space-y-3 min-h-40 p-2 rounded-2xl bg-slate-50/80 dark:bg-white/2">
                  {tasksByStatus[col.id]?.map(t => <TaskCard key={t._id} task={t} onClick={setDetailTask} />)}
                  {!tasksByStatus[col.id]?.length && <div className="flex items-center justify-center h-20 text-xs text-slate-400">No tasks</div>}
                  <button onClick={() => setTaskModal('create')}
                    className="w-full py-2 text-xs text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/5 rounded-xl transition-all border border-dashed border-slate-200 dark:border-white/10">
                    + Add task
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl space-y-2">
            {tasks.length === 0 ? (
              <EmptyState icon="✅" title="No tasks" description="Create your first task." action={<button onClick={() => setTaskModal('create')} className="btn-primary">+ Create Task</button>} />
            ) : tasks.map(t => (
              <div key={t._id} onClick={() => setDetailTask(t)}
                className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-all duration-200 group">
                <StatusBadge status={t.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{t.title}</p>
                  {t.description && <p className="text-xs text-slate-500 truncate">{t.description}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <PriorityBadge priority={t.priority} />
                  {t.dueDate && <span className={`text-xs hidden sm:block ${isOverdue(t.dueDate, t.status) ? 'text-red-500' : 'text-slate-500'}`}>{formatDate(t.dueDate, 'MMM d')}</span>}
                  {t.assignees?.length > 0 && <AvatarGroup users={t.assignees} max={3} size="xs" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit task modal */}
      <Modal isOpen={!!taskModal} onClose={() => setTaskModal(null)} title={taskModal === 'create' ? 'Create Task' : 'Edit Task'} size="lg">
        <TaskForm task={taskModal !== 'create' ? taskModal : null} projectId={id} members={members} onClose={() => setTaskModal(null)} />
      </Modal>

      {/* Task detail modal */}
      <Modal isOpen={!!detailTask} onClose={() => setDetailTask(null)} title="Task Details" size="lg">
        {detailTask && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{detailTask.title}</h3>
                {detailTask.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{detailTask.description}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => { setTaskModal(detailTask); setDetailTask(null) }} className="btn-secondary text-xs">✏️ Edit</button>
                <button onClick={() => deleteTask.mutate(detailTask._id)} className="btn-ghost text-xs text-red-500">🗑️</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><div className="label">Status</div>
                <select className="input py-1.5 text-xs" defaultValue={detailTask.status} onChange={e => updateStatus.mutate({ tid: detailTask._id, status: e.target.value })}>
                  {TASK_STATUSES.map(s => <option key={s} value={s}>{getStatusConfig(s).label}</option>)}
                </select>
              </div>
              <div><div className="label">Priority</div><PriorityBadge priority={detailTask.priority} /></div>
              <div><div className="label">Due Date</div><span className="text-sm text-slate-700 dark:text-slate-300">{formatDate(detailTask.dueDate) || '—'}</span></div>
              <div><div className="label">Est. Hours</div><span className="text-sm text-slate-700 dark:text-slate-300">{detailTask.estimatedHours ? `${detailTask.estimatedHours}h` : '—'}</span></div>
              <div><div className="label">Created by</div>
                <div className="flex items-center gap-2"><Avatar user={detailTask.createdBy} size="xs" /><span className="text-xs text-slate-500">{detailTask.createdBy?.name}</span></div>
              </div>
              <div><div className="label">Assignees</div>
                {detailTask.assignees?.length > 0 ? <AvatarGroup users={detailTask.assignees} max={5} size="sm" /> : <span className="text-xs text-slate-400">Unassigned</span>}
              </div>
            </div>

            {detailTask.tags?.length > 0 && (
              <div><div className="label">Tags</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {detailTask.tags.map(t => <span key={t} className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">{t}</span>)}
                </div>
              </div>
            )}

            {detailTask.subtasks?.length > 0 && (
              <div>
                <div className="label mb-2">Subtasks ({detailTask.subtasks.filter(s => s.completed).length}/{detailTask.subtasks.length})</div>
                <ProgressBar value={Math.round((detailTask.subtasks.filter(s => s.completed).length / detailTask.subtasks.length) * 100)} size="sm" />
                <div className="mt-3 space-y-2">
                  {detailTask.subtasks.map(sub => (
                    <label key={sub._id} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={sub.completed}
                        onChange={e => toggleSubtask.mutate({ sid: sub._id, completed: e.target.checked })}
                        className="w-4 h-4 rounded accent-brand-500" />
                      <span className={`text-sm ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{sub.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <div className="label mb-3">Comments ({detailTask.comments?.length || 0})</div>
              <div className="space-y-3 mb-3 max-h-36 overflow-y-auto">
                {detailTask.comments?.map(c => (
                  <div key={c._id} className="flex gap-3">
                    <Avatar user={c.author} size="xs" className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1 bg-slate-50 dark:bg-white/5 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.author?.name}</span>
                        <span className="text-xs text-slate-400">{formatDate(c.createdAt, 'MMM d')}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input flex-1 py-2 text-sm" placeholder="Add a comment…" value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && comment.trim()) addComment.mutate() }} />
                <button onClick={() => addComment.mutate()} disabled={!comment.trim() || addComment.isPending} className="btn-primary py-2 px-3">
                  {addComment.isPending ? <Spinner size="sm" /> : '↑'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => deleteProject.mutate()}
        title="Delete Project"
        message={`Delete "${project?.name}"? This will also delete all ${totalTasks} tasks.`}
        confirmLabel="Delete Project"
      />
    </div>
  )
}
