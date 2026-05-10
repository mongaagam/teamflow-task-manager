/**
 * Seed script – creates demo users + a sample project + tasks
 * Run: node seed.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const Project = require('./models/Project')
const Task = require('./models/Task')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager'

const USERS = [
  { name: 'Alex Admin', email: 'admin@teamflow.io', password: 'admin123', role: 'admin' },
  { name: 'Morgan Member', email: 'member@teamflow.io', password: 'member123', role: 'member' },
  { name: 'Jordan Dev', email: 'jordan@teamflow.io', password: 'member123', role: 'member' },
  { name: 'Sam Designer', email: 'sam@teamflow.io', password: 'member123', role: 'member' },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  // Clear existing
  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})])
  console.log('Cleared existing data')

  // Create users
  const users = await Promise.all(USERS.map(u => User.create(u)))
  console.log(`Created ${users.length} users`)

  const [admin, member1, member2, member3] = users

  // Create projects
  const proj1 = await Project.create({
    name: 'Website Redesign', description: 'Full redesign of the company website', status: 'active',
    priority: 'high', color: '#6366f1', icon: '🎨', owner: admin._id,
    members: [
      { user: member1._id, role: 'editor' },
      { user: member2._id, role: 'editor' },
      { user: member3._id, role: 'viewer' },
    ],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  const proj2 = await Project.create({
    name: 'Mobile App v2', description: 'New version of the mobile application', status: 'planning',
    priority: 'critical', color: '#8b5cf6', icon: '🚀', owner: member1._id,
    members: [{ user: admin._id, role: 'editor' }, { user: member2._id, role: 'editor' }],
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  })

  const proj3 = await Project.create({
    name: 'API Integration', description: 'Third-party API integrations', status: 'active',
    priority: 'medium', color: '#22c55e', icon: '⚡', owner: member2._id,
    members: [{ user: admin._id, role: 'editor' }],
  })

  console.log('Created 3 projects')

  // Create tasks
  const now = new Date()
  const past = (d) => new Date(now - d * 24 * 60 * 60 * 1000)
  const future = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000)

  const tasks = [
    { title: 'Design new homepage layout', project: proj1._id, status: 'done', priority: 'high', assignees: [member3._id], createdBy: admin._id, dueDate: past(2), completedAt: past(1), tags: ['design', 'homepage'] },
    { title: 'Implement responsive navigation', project: proj1._id, status: 'in-progress', priority: 'high', assignees: [member2._id], createdBy: admin._id, dueDate: future(3), estimatedHours: 8, tags: ['frontend'] },
    { title: 'Write copy for About page', project: proj1._id, status: 'todo', priority: 'medium', assignees: [member1._id], createdBy: admin._id, dueDate: future(7) },
    { title: 'SEO audit and optimization', project: proj1._id, status: 'todo', priority: 'low', assignees: [], createdBy: admin._id, dueDate: future(14) },
    { title: 'Setup CI/CD pipeline', project: proj1._id, status: 'in-review', priority: 'critical', assignees: [member2._id, admin._id], createdBy: admin._id, dueDate: past(1), tags: ['devops'] },
    { title: 'Design system components', project: proj2._id, status: 'in-progress', priority: 'high', assignees: [member3._id], createdBy: member1._id, dueDate: future(10), estimatedHours: 20, subtasks: [{ title: 'Color palette', completed: true }, { title: 'Typography', completed: true }, { title: 'Button variants', completed: false }, { title: 'Form elements', completed: false }] },
    { title: 'User authentication flow', project: proj2._id, status: 'todo', priority: 'critical', assignees: [member2._id], createdBy: member1._id, dueDate: future(5) },
    { title: 'Push notification setup', project: proj2._id, status: 'todo', priority: 'medium', assignees: [], createdBy: member1._id, dueDate: future(20) },
    { title: 'Integrate Stripe payments', project: proj3._id, status: 'done', priority: 'critical', assignees: [member2._id], createdBy: member2._id, completedAt: past(3), tags: ['payments'] },
    { title: 'Write API documentation', project: proj3._id, status: 'in-progress', priority: 'medium', assignees: [admin._id], createdBy: member2._id, dueDate: future(5), estimatedHours: 6 },
    { title: 'Rate limiting middleware', project: proj3._id, status: 'done', priority: 'high', assignees: [member2._id], createdBy: member2._id, completedAt: past(5) },
    { title: 'Error monitoring setup', project: proj3._id, status: 'todo', priority: 'low', assignees: [], createdBy: member2._id, dueDate: future(30) },
    // Overdue tasks
    { title: 'Fix login page bug', project: proj1._id, status: 'in-progress', priority: 'critical', assignees: [member1._id], createdBy: admin._id, dueDate: past(3) },
    { title: 'Update dependencies', project: proj2._id, status: 'todo', priority: 'high', assignees: [member2._id], createdBy: member1._id, dueDate: past(7) },
  ]

  await Task.insertMany(tasks)
  console.log(`Created ${tasks.length} tasks`)

  console.log('\n✅ Seed complete!')
  console.log('Demo credentials:')
  USERS.forEach(u => console.log(`  ${u.role === 'admin' ? '👑' : '👤'} ${u.email} / ${u.password}`))
  mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
