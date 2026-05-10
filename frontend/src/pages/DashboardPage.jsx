import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import api from '../utils/api'
import useAuthStore from '../context/authStore'
import { StatCard, Avatar, PriorityBadge, StatusBadge, ProgressBar, EmptyState, Spinner } from '../components/ui/UIComponents'
import { formatDate, isOverdue, timeAgo } from '../utils/helpers'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

const chartDefaults = {
  plugins: { legend: { display: false }, tooltip: { bodyFont: { family: 'Outfit' }, titleFont: { family: 'Outfit' } } },
  responsive: true,
  maintainAspectRatio: false,
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: overdueData } = useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: () => api.get('/tasks?overdue=true&limit=5').then(r => r.data),
  })

  const { data: myTasksData } = useQuery({
    queryKey: ['tasks', 'mine'],
    queryFn: () => api.get(`/tasks?assignee=${user?._id}&status=todo,in-progress&limit=6`).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  const analytics = data || {}
  const statusMap = analytics.tasksByStatus || {}
  const total = Object.values(statusMap).reduce((a, b) => a + b, 0)

  // Chart data
  const completionData = {
    labels: (analytics.completionTrend || []).map(d => d._id?.slice(5)),
    datasets: [{
      label: 'Completed',
      data: (analytics.completionTrend || []).map(d => d.count),
      borderColor: '#5555ff',
      backgroundColor: 'rgba(85,85,255,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#5555ff',
      pointRadius: 3,
    }]
  }

  const doughnutData = {
    labels: ['To Do', 'In Progress', 'In Review', 'Done', 'Cancelled'],
    datasets: [{
      data: [statusMap.todo || 0, statusMap['in-progress'] || 0, statusMap['in-review'] || 0, statusMap.done || 0, statusMap.cancelled || 0],
      backgroundColor: ['#64748b', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 6,
    }]
  }

  const priorityMap = analytics.tasksByPriority || {}
  const barData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      label: 'Tasks',
      data: [priorityMap.critical || 0, priorityMap.high || 0, priorityMap.medium || 0, priorityMap.low || 0],
      backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(249,115,22,0.8)', 'rgba(234,179,8,0.8)', 'rgba(34,197,94,0.8)'],
      borderRadius: 8,
      borderSkipped: false,
    }]
  }

  const overdueTasks = overdueData?.tasks || []
  const myTasks = myTasksData?.tasks || []
  const projectProgress = analytics.projectProgress || []

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here's what's happening across your workspace.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="◫" label="Total Projects" value={analytics.projects?.total || 0} color="brand" />
        <StatCard icon="✓" label="Total Tasks" value={total} color="purple" />
        <StatCard icon="⚠" label="Overdue" value={analytics.overdueTasks || 0} color="red" />
        <StatCard icon="⏳" label="Due This Week" value={analytics.dueSoon || 0} color="orange" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Completion trend */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Completion Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tasks completed last 30 days</p>
            </div>
          </div>
          <div className="h-48">
            {completionData.labels.length > 0 ? (
              <Line data={completionData} options={{
                ...chartDefaults,
                scales: {
                  x: { grid: { display: false }, ticks: { font: { family: 'Outfit', size: 11 }, color: '#94a3b8' } },
                  y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { family: 'Outfit', size: 11 }, color: '#94a3b8', precision: 0 } }
                }
              }} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Task status donut */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Task Status</h3>
          <p className="text-xs text-slate-500 mb-6">Distribution by status</p>
          <div className="h-40 mb-4">
            <Doughnut data={doughnutData} options={{ ...chartDefaults, cutout: '72%' }} />
          </div>
          <div className="space-y-2">
            {[
              { label: 'Done', value: statusMap.done || 0, color: '#22c55e' },
              { label: 'In Progress', value: statusMap['in-progress'] || 0, color: '#3b82f6' },
              { label: 'To Do', value: statusMap.todo || 0, color: '#64748b' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-600 dark:text-slate-400">{s.label}</span>
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project progress + Priority chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Project progress */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 dark:text-white">Project Progress</h3>
            <Link to="/projects" className="text-xs text-brand-500 hover:text-brand-400 font-semibold">View all →</Link>
          </div>
          {projectProgress.length > 0 ? (
            <div className="space-y-4">
              {projectProgress.map(p => (
                <Link key={p._id} to={`/projects/${p._id}`} className="block group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors truncate max-w-[60%]">{p.name}</span>
                    <span className="text-xs font-semibold text-slate-500">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} color={p.color || '#6366f1'} />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{p.done}/{p.total} tasks</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : <EmptyState icon="◫" title="No projects yet" description="Create your first project to see progress here." />}
        </div>

        {/* Priority distribution */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Priority Distribution</h3>
          <p className="text-xs text-slate-500 mb-6">Tasks by priority level</p>
          <div className="h-48">
            <Bar data={barData} options={{
              ...chartDefaults,
              scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'Outfit', size: 12 }, color: '#94a3b8' } },
                y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { family: 'Outfit', size: 11 }, color: '#94a3b8', precision: 0 } }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Overdue tasks */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Overdue Tasks
            </h3>
            <Link to="/tasks?overdue=true" className="text-xs text-brand-500 hover:text-brand-400 font-semibold">View all →</Link>
          </div>
          {overdueTasks.length > 0 ? (
            <div className="space-y-3">
              {overdueTasks.map(task => (
                <div key={task._id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/15 group hover:bg-red-100 dark:hover:bg-red-500/12 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Due {formatDate(task.dueDate)}</span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-xs text-slate-500">{task.project?.name}</span>
                    </div>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="✅" title="No overdue tasks" description="Great job! Everything is on track." />
          )}
        </div>

        {/* My tasks */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 dark:text-white">My Tasks</h3>
            <Link to="/tasks" className="text-xs text-brand-500 hover:text-brand-400 font-semibold">View all →</Link>
          </div>
          {myTasks.length > 0 ? (
            <div className="space-y-2">
              {myTasks.map(task => (
                <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/8 group">
                  <StatusBadge status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                    <p className="text-xs text-slate-400 truncate">{task.project?.name}</p>
                  </div>
                  {task.dueDate && (
                    <span className={`text-xs font-medium flex-shrink-0 ${isOverdue(task.dueDate, task.status) ? 'text-red-500' : 'text-slate-400'}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🎉" title="All caught up!" description="No tasks assigned to you right now." />
          )}
        </div>
      </div>

      {/* Top contributors */}
      {analytics.topContributors?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-5">Top Contributors</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {analytics.topContributors.map((c, i) => (
              <div key={c._id} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                <div className="relative">
                  <Avatar user={c.user} size="lg" />
                  {i === 0 && <span className="absolute -top-1 -right-1 text-sm">🏆</span>}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{c.user.name.split(' ')[0]}</p>
                  <p className="text-xs text-slate-400">{c.completed} done</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
