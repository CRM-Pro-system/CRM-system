import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';

const router = express.Router();

router.use(tenantAuth);

// GET audit logs (admin and superadmin only)
router.get('/', requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, action, userId, startDate, endDate } = req.query;

    // Build query - superadmin sees all, admin sees their tenant only
    const query = req.isSuperAdmin ? {} : { tenant: req.tenantId };

    if (action) query.action = action;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET audit log stats summary
router.get('/stats', requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const query = req.isSuperAdmin ? {} : { tenant: req.tenantId };

    // Last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentQuery = { ...query, createdAt: { $gte: thirtyDaysAgo } };

    const [total, recent, byAction] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.countDocuments(recentQuery),
      AuditLog.aggregate([
        { $match: recentQuery },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({ total, recent, byAction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as auditLogRoutes };
