const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Helper: check project access
const getProjectWithAccess = async (projectId, userId, role = null) => {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');

  if (!project) return null;

  const isOwner = project.owner._id.toString() === userId.toString();
  const memberEntry = project.members.find(m => m.user._id.toString() === userId.toString());

  if (!isOwner && !memberEntry) return null;
  if (role === 'owner' && !isOwner) return null;

  return project;
};

// @GET /api/projects
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ],
      isArchived: false
    };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: p._id, isArchived: false } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const counts = taskCounts.reduce((acc, t) => {
          acc[t._id] = t.count;
          acc.total = (acc.total || 0) + t.count;
          return acc;
        }, {});
        return { ...p.toObject(), taskCounts: counts };
      })
    );

    const total = await Project.countDocuments(query);
    res.json({ projects: projectsWithCounts, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// @POST /api/projects
router.post('/', protect, [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, status, priority, color, icon, dueDate, tags, members } = req.body;

    const project = await Project.create({
      name, description, status, priority,
      color: color || '#6366f1',
      icon: icon || '📁',
      dueDate, tags,
      owner: req.user._id,
      members: members?.map(m => ({ user: m.userId || m, role: m.role || 'editor' })) || []
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// @GET /api/projects/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await getProjectWithAccess(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const taskCounts = await Task.aggregate([
      { $match: { project: project._id, isArchived: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const counts = taskCounts.reduce((acc, t) => {
      acc[t._id] = t.count;
      acc.total = (acc.total || 0) + t.count;
      return acc;
    }, {});

    res.json({ project: { ...project.toObject(), taskCounts: counts } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// @PUT /api/projects/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await getProjectWithAccess(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { name, description, status, priority, color, icon, dueDate, tags } = req.body;
    const updates = { name, description, status, priority, color, icon, dueDate, tags };
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const updated = await Project.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json({ project: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// @POST /api/projects/:id/members
router.post('/:id/members', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only project owner can manage members' });
    }

    const { userId, role = 'editor' } = req.body;
    const exists = project.members.find(m => m.user.toString() === userId);
    if (exists) return res.status(409).json({ error: 'User already a member' });

    project.members.push({ user: userId, role });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// @DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only project owner can manage members' });
    }

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// @DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project || project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only project owner can delete' });
    }

    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
