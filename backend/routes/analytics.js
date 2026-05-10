const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @GET /api/analytics/dashboard - User dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const accessibleProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      isArchived: false
    }).select('_id name color status');

    const projectIds = accessibleProjects.map(p => p._id);

    // Task stats by status
    const tasksByStatus = await Task.aggregate([
      { $match: { project: { $in: projectIds }, isArchived: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Task stats by priority
    const tasksByPriority = await Task.aggregate([
      { $match: { project: { $in: projectIds }, isArchived: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // My tasks
    const myTasks = await Task.aggregate([
      { $match: { assignees: req.user._id, isArchived: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $nin: ['done', 'cancelled'] },
      isArchived: false
    });

    // Tasks due this week
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const dueSoon = await Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $gte: new Date(), $lte: weekEnd },
      status: { $nin: ['done', 'cancelled'] },
      isArchived: false
    });

    // Completion trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completionTrend = await Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          completedAt: { $gte: thirtyDaysAgo },
          status: 'done'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Tasks created per day (last 30 days)
    const createdTrend = await Task.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Project progress
    const projectProgress = await Promise.all(
      accessibleProjects.slice(0, 6).map(async (p) => {
        const total = await Task.countDocuments({ project: p._id, isArchived: false });
        const done = await Task.countDocuments({ project: p._id, status: 'done', isArchived: false });
        return {
          _id: p._id,
          name: p.name,
          color: p.color,
          status: p.status,
          total,
          done,
          progress: total > 0 ? Math.round((done / total) * 100) : 0
        };
      })
    );

    // Top contributors (tasks completed)
    const topContributors = await Task.aggregate([
      { $match: { project: { $in: projectIds }, status: 'done', isArchived: false } },
      { $unwind: '$assignees' },
      { $group: { _id: '$assignees', completed: { $sum: 1 } } },
      { $sort: { completed: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.email': 1, 'user.avatar': 1, completed: 1 } }
    ]);

    res.json({
      projects: { total: accessibleProjects.length, list: accessibleProjects },
      tasksByStatus: tasksByStatus.reduce((acc, t) => { acc[t._id] = t.count; return acc; }, {}),
      tasksByPriority: tasksByPriority.reduce((acc, t) => { acc[t._id] = t.count; return acc; }, {}),
      myTasks: myTasks.reduce((acc, t) => { acc[t._id] = t.count; return acc; }, {}),
      overdueTasks,
      dueSoon,
      completionTrend,
      createdTrend,
      projectProgress,
      topContributors
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// @GET /api/analytics/admin - Admin global stats
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalProjects, totalTasks, completedTasks] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments({ isArchived: false }),
      Task.countDocuments({ isArchived: false }),
      Task.countDocuments({ status: 'done', isArchived: false })
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt');

    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      recentUsers,
      userGrowth
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

module.exports = router;
