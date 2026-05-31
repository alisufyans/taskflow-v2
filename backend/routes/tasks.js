const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { taskValidation } = require('../middleware/validation');
const upload = require('../middleware/upload');

router.use(protect);

// Helper: emit notification via Socket.IO
const emitNotification = (io, recipientId, notification) => {
  if (io) {
    io.to(`user_${recipientId}`).emit('notification', notification);
  }
};

// GET /api/tasks – all owned + shared tasks with search/filter
router.get('/', async (req, res) => {
  try {
    const { search, status, priority, sortBy = 'createdAt', order = 'desc' } = req.query;
    const query = { $or: [{ user: req.user._id }, { sharedWith: req.user._id }] };

    if (search) {
      query.$and = [{
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      }];
    }
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    const tasks = await Task.find(query)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .populate('user', 'name email')
      .populate('sharedWith', 'name email');

    const allOwned = await Task.find({ user: req.user._id });
    const total = allOwned.length;
    const completed = allOwned.filter((t) => t.status === 'Completed').length;

    res.json({
      success: true,
      count: tasks.length,
      progress: { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 },
      tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tasks/shared – tasks shared WITH current user (Week 4)
router.get('/shared', async (req, res) => {
  try {
    const tasks = await Task.find({ sharedWith: req.user._id })
      .populate('user', 'name email')
      .populate('sharedWith', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { sharedWith: req.user._id }],
    })
      .populate('user', 'name email')
      .populate('sharedWith', 'name email');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tasks – create
router.post('/', taskValidation, async (req, res) => {
  try {
    const { title, description, status, dueDate, priority } = req.body;
    const task = await Task.create({ title, description, status, dueDate, priority, user: req.user._id });
    res.status(201).json({ success: true, message: 'Task created', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/tasks/:id – update (notifies shared users if status changes)
router.put('/:id', taskValidation, async (req, res) => {
  try {
    const { title, description, status, dueDate, priority } = req.body;
    const existing = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!existing) return res.status(404).json({ success: false, message: 'Task not found or not authorized' });

    const statusChanged = existing.status !== status;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status, dueDate, priority },
      { new: true, runValidators: true }
    ).populate('sharedWith', 'name email');

    // Notify shared users when status changes (Week 4)
    if (statusChanged && task.sharedWith.length > 0) {
      const io = req.app.get('io');
      for (const sharedUser of task.sharedWith) {
        const notif = await Notification.create({
          recipient: sharedUser._id,
          sender: req.user._id,
          type: 'status_updated',
          message: `"${task.title}" status changed to ${status} by ${req.user.name}`,
          taskId: task._id,
        });
        emitNotification(io, sharedUser._id.toString(), notif);
      }
    }

    res.json({ success: true, message: 'Task updated', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/tasks/:id/share – share task with users (Week 4)
router.put('/:id/share', async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ success: false, message: 'userIds array is required' });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found or not authorized' });

    // Validate all users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(400).json({ success: false, message: 'One or more users not found' });
    }

    // Prevent sharing with self
    const filtered = userIds.filter((id) => id.toString() !== req.user._id.toString());
    task.sharedWith = [...new Set([...task.sharedWith.map(String), ...filtered])];
    await task.save();

    // Send real-time notifications (Week 4)
    const io = req.app.get('io');
    for (const userId of filtered) {
      const notif = await Notification.create({
        recipient: userId,
        sender: req.user._id,
        type: 'task_shared',
        message: `${req.user.name} shared task "${task.title}" with you`,
        taskId: task._id,
      });
      emitNotification(io, userId, notif);
    }

    const updated = await Task.findById(task._id).populate('sharedWith', 'name email');
    res.json({ success: true, message: 'Task shared successfully', task: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Delete attached files
    for (const att of task.attachments || []) {
      if (att.path && fs.existsSync(att.path)) fs.unlinkSync(att.path);
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tasks/:id/attachments – upload file (Week 6)
router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user._id }, { sharedWith: req.user._id }],
    });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    };
    task.attachments.push(attachment);
    await task.save();

    res.status(201).json({ success: true, message: 'File uploaded', attachment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/tasks/:id/attachments/:attachmentId
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const att = task.attachments.id(req.params.attachmentId);
    if (!att) return res.status(404).json({ success: false, message: 'Attachment not found' });

    if (att.path && fs.existsSync(att.path)) fs.unlinkSync(att.path);
    att.deleteOne();
    await task.save();

    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
