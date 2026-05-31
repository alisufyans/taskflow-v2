const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/analytics/overview – summary stats
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [statusBreakdown, priorityBreakdown, overdueCount, totalCount] = await Promise.all([
      // Status breakdown (pie chart data)
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Priority breakdown
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      // Overdue tasks
      Task.countDocuments({
        user: userId,
        status: { $ne: 'Completed' },
        dueDate: { $lt: now },
      }),
      Task.countDocuments({ user: userId }),
    ]);

    const completed = statusBreakdown.find((s) => s._id === 'Completed')?.count || 0;
    const pending = statusBreakdown.find((s) => s._id === 'Pending')?.count || 0;
    const inProgress = statusBreakdown.find((s) => s._id === 'In Progress')?.count || 0;

    res.json({
      success: true,
      data: {
        total: totalCount,
        completed,
        pending,
        inProgress,
        overdue: overdueCount,
        completionRate: totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0,
        statusBreakdown: statusBreakdown.map((s) => ({ name: s._id, value: s.count })),
        priorityBreakdown: priorityBreakdown.map((p) => ({ name: p._id, value: p.count })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/trends – weekly & monthly trends
router.get('/trends', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 'weekly' } = req.query;

    const now = new Date();
    let startDate, groupFormat, labelFn;

    if (period === 'monthly') {
      // Last 6 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      groupFormat = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
      labelFn = (g) => {
        const d = new Date(g.year, g.month - 1);
        return d.toLocaleString('default', { month: 'short', year: '2-digit' });
      };
    } else {
      // Last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupFormat = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
      labelFn = (g) => {
        const d = new Date(g.year, (g.month || 1) - 1, g.day || 1);
        return d.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
      };
    }

    const [created, completed, overdue] = await Promise.all([
      Task.aggregate([
        { $match: { user: userId, createdAt: { $gte: startDate } } },
        { $group: { _id: groupFormat, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      Task.aggregate([
        { $match: { user: userId, status: 'Completed', updatedAt: { $gte: startDate } } },
        { $group: { _id: groupFormat, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      Task.aggregate([
        {
          $match: {
            user: userId,
            status: { $ne: 'Completed' },
            dueDate: { $gte: startDate, $lt: new Date() },
          },
        },
        { $group: { _id: groupFormat, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
    ]);

    // Build label map
    const labelMap = {};
    [...created, ...completed, ...overdue].forEach((item) => {
      const key = JSON.stringify(item._id);
      if (!labelMap[key]) labelMap[key] = labelFn(item._id);
    });

    const labels = [...new Set(Object.values(labelMap))];
    const createdData = labels.map(
      (l) => created.find((c) => labelFn(c._id) === l)?.count || 0
    );
    const completedData = labels.map(
      (l) => completed.find((c) => labelFn(c._id) === l)?.count || 0
    );
    const overdueData = labels.map(
      (l) => overdue.find((c) => labelFn(c._id) === l)?.count || 0
    );

    res.json({
      success: true,
      data: { period, labels, created: createdData, completed: completedData, overdue: overdueData },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
