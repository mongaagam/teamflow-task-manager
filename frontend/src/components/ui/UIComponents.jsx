import { useState, useEffect, useRef } from 'react'
import { getInitials, getAvatarColor, getStatusConfig, getPriorityColor, getProjectStatusConfig } from '../../utils/helpers'

export function Spinner({ size = 'md', className = '' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]
  return (
    <svg className={`animate-spin text-brand-500 ${sz} ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) { document.addEventListener('keydown', handler); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [isOpen, onClose])
  if (!isOpen) return null
  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className={`relative w-full ${sizeClass} glass-card p-6 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">✕</button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', isDanger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => { onConfirm(); onClose() }} className={isDanger ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}

export function StatusBadge({ status }) {
  const cfg = getStatusConfig(status)
  return <span className={`badge ${cfg.color}`}><span>{cfg.icon}</span>{cfg.label}</span>
}

export function PriorityBadge({ priority }) {
  const cfg = getPriorityColor(priority)
  const labels = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }
  return <span className={`badge ${cfg.light}`}><span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />{labels[priority] || priority}</span>
}

export function ProjectStatusBadge({ status }) {
  const cfg = getProjectStatusConfig(status)
  return <span className={`badge ${cfg.color}`}>{cfg.label}</span>
}

export function Avatar({ user, size = 'md', className = '' }) {
  const sz = { xs: 'w-6 h-6 text-[10px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-xl' }[size]
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : getInitials(user?.name)}
    </div>
  )
}

export function AvatarGroup({ users = [], max = 3, size = 'sm' }) {
  const visible = users.slice(0, max)
  const extra = users.length - max
  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <div key={u._id || i} className="ring-2 ring-white dark:ring-surface-900 rounded-xl" title={u.name}><Avatar user={u} size={size} /></div>
      ))}
      {extra > 0 && (
        <div className={`${size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'} rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold ring-2 ring-white dark:ring-surface-900`}>+{extra}</div>
      )}
    </div>
  )
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}

export function ProgressBar({ value = 0, color = 'bg-brand-500', size = 'md', showLabel = false }) {
  const h = { sm: 'h-1', md: 'h-2', lg: 'h-3' }[size]
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden`}>
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      {showLabel && <span className="text-xs font-semibold text-slate-500 w-9 text-right">{value}%</span>}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-1"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
    </div>
  )
}

export function StatCard({ icon, label, value, sub, bgClass = 'bg-brand-500/10', trend }) {
  return (
    <div className="glass-card p-5 hover:shadow-card-hover transition-all duration-300 cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${bgClass}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

export function Dropdown({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(s => !s)}>{trigger}</div>
      {open && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-48 glass-card py-1 shadow-2xl z-50 animate-slide-down`}>
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} className="my-1 border-t border-slate-200 dark:border-white/8" />
            ) : (
              <button key={i} onClick={() => { item.onClick?.(); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8'}`}>
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
