import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '—'
  try { return format(new Date(date), fmt) } catch { return '—' }
}

export const formatRelative = (date) => {
  if (!date) return '—'
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }) } catch { return '—' }
}

// Keep old aliases
export const formatDateTime = (date) => formatDate(date, 'MMM d, yyyy h:mm a')
export const timeAgo = formatRelative

export const formatDueDate = (date) => {
  if (!date) return null
  const d = new Date(date)
  try {
    if (isToday(d)) return { label: 'Today', urgent: true }
    if (isTomorrow(d)) return { label: 'Tomorrow', urgent: true }
    if (isPast(d)) return { label: `Overdue · ${format(d, 'MMM d')}`, overdue: true }
    return { label: format(d, 'MMM d'), urgent: false }
  } catch { return null }
}

export const isOverdue = (date, status) => {
  if (!date || status === 'done' || status === 'cancelled') return false
  try { return isPast(new Date(date)) } catch { return false }
}

export const isDueSoon = (date, status) => {
  if (!date || status === 'done' || status === 'cancelled') return false
  try {
    const d = new Date(date)
    const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return d <= soon && d >= new Date()
  } catch { return false }
}

export const getPriorityColor = (priority) => {
  const map = {
    critical: { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400', dot: '#ef4444' },
    high:     { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400', dot: '#f97316' },
    medium:   { bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400', dot: '#eab308' },
    low:      { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400', dot: '#22c55e' },
  }
  return map[priority] || map.medium
}

// Legacy alias used by old Components.jsx
export const priorityConfig = {
  critical: { label: 'Critical', ...getPriorityColor('critical') },
  high:     { label: 'High', ...getPriorityColor('high') },
  medium:   { label: 'Medium', ...getPriorityColor('medium') },
  low:      { label: 'Low', ...getPriorityColor('low') },
}

export const getStatusConfig = (status) => {
  const map = {
    'todo':        { label: 'To Do',       color: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400',      icon: '○', dot: '#94a3b8' },
    'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',          icon: '◐', dot: '#3b82f6' },
    'in-review':   { label: 'In Review',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',  icon: '◑', dot: '#a855f7' },
    'done':        { label: 'Done',        color: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',      icon: '●', dot: '#22c55e' },
    'cancelled':   { label: 'Cancelled',   color: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500',             icon: '✕', dot: '#ef4444' },
  }
  return map[status] || map['todo']
}

// Legacy alias
export const statusConfig = {
  'todo':        getStatusConfig('todo'),
  'in-progress': getStatusConfig('in-progress'),
  'in-review':   getStatusConfig('in-review'),
  'done':        getStatusConfig('done'),
  'cancelled':   getStatusConfig('cancelled'),
}

export const getProjectStatusConfig = (status) => {
  const map = {
    planning:  { label: 'Planning',  color: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400' },
    active:    { label: 'Active',    color: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' },
    'on-hold': { label: 'On Hold',   color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400' },
    completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500' },
  }
  return map[status] || map.planning
}

// Legacy alias
export const projectStatusConfig = {
  planning:  getProjectStatusConfig('planning'),
  active:    getProjectStatusConfig('active'),
  'on-hold': getProjectStatusConfig('on-hold'),
  completed: getProjectStatusConfig('completed'),
  cancelled: getProjectStatusConfig('cancelled'),
}

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export const getAvatarColor = (name = '') => {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
  ]
  const idx = (name?.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}

export const truncate = (str, n = 60) => str?.length > n ? `${str.slice(0, n)}…` : str
export const cn = (...classes) => classes.filter(Boolean).join(' ')
export const debounce = (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) } }

export const TASK_STATUSES = ['todo', 'in-progress', 'in-review', 'done', 'cancelled']
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical']
export const PROJECT_STATUSES = ['planning', 'active', 'on-hold', 'completed', 'cancelled']
export const PROJECT_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6','#a855f7','#84cc16']
export const PROJECT_ICONS = ['📁','🚀','🎯','💡','🔥','⚡','🌟','🎨','🛠️','📊','🏆','💎']
