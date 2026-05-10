const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: check project membership
const canAccessProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some(m => m.user.toString() === userId.toString());
  return isOwner || isMember;
};

// @GET /api/tasks - Get tasks (with filters)
router.get('/', protect, async (req, res) => {
  try {
    const {
      projectId, status, priority, assignee,
      search, overdue, page = 1, limit = 50,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    // Get accessible projects
    const accessibleProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).select('_id');
    const projectIds = accessibleProjects.map(p => p._id);

    const query = {
      project: { $in: projectIds },
      isArchived: false
    };

    if (projectId) query.project = projectId;
    if (status) query.status = { $in: status.split(',') };
    if (priority) query.priority = { $in: priority.split(',') };
    if (assignee) query.assignees = assignee;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['done', 'cancelled'] };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color icon')
      .populate('comments.author', 'name email avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({ tasks, total, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// @POST /api/tasks
router.post('/', protect, [
  body('title').trim().notEmpty().isLength({ max: 200 }),
  body('projectId').notEmpty(),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'done', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, projectId, status, priority, assignees, dueDate, startDate, estimatedHours, tags, subtasks } = req.body;

    if (!(await canAccessProject(projectId, req.user._id))) {
      return res.status(403).json({ error: 'No access to this project' });
    }

    const task = await Task.create({
      title, description,
      project: projectId,
      status: status || 'todo',
      priority: priority || 'medium',
      assignees: assignees || [],
      createdBy: req.user._id,
      dueDate, startDate, estimatedHours, tags,
      subtasks: subtasks?.map(s => ({ title: s.title || s, completed: false })) || []
    });

    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name color icon');

    res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// @GET /api/tasks/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color icon')
      .populate('comments.author', 'name email avatar');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!(await canAccessProject(task.project._id, req.user._id))) {
      return res.status(403).json({ error: 'No access' });
    }

    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// @PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!(await canAccessProject(task.project, req.user._id))) {
      return res.status(403).json({ error: 'No access' });
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'assignees', 'dueDate', 'startDate', 'estimatedHours', 'actualHours', 'tags', 'subtasks'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updated = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color icon')
      .populate('comments.author', 'name email avatar');

    res.json({ task: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// @POST /api/tasks/:id/comments
router.post('/:id/comments', protect, [
  body('content').trim().notEmpty().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.comments.push({ author: req.user._id, content: req.body.content });
    await task.save();
    await task.populate('comments.author', 'name email avatar');

    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// @PUT /api/tasks/:id/subtasks/:subtaskId
router.put('/:id/subtasks/:subtaskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    subtask.completed = req.body.completed;
    if (req.body.completed) subtask.completedAt = new Date();
    else subtask.completedAt = undefined;

    await task.save();
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

// @DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!(await canAccessProject(task.project, req.user._id))) {
      return res.status(403).json({ error: 'No access' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
