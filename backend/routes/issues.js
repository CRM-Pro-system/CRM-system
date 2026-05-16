import express from 'express';
import mongoose from 'mongoose';
import body from 'express-async-handler';
import Issue from '../models/Issue.js';
import Client from '../models/Client.js';
import { authenticate, requireSuperAdmin, tenantAuth } from '../middleware/tenantAuth.js';
import { validateObjectId, validatePagination } from '../middleware/validation.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// All issue routes require tenant isolation and login
router.use(authenticate);
router.use(tenantAuth);

// ── GET /api/issues — list with optional filters ──────────────────────────────
// Accepts: status, type, priority, client, search, fromDate, toDate, page, limit
router.get('/', validatePagination, async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    if (!tenantId) return res.status(400).json({ message: 'Tenant not identified' });

    const { status, type, priority, client, search, fromDate, toDate, page = 1, limit = 50 } = req.query;

    const match = { tenant: new mongoose.Types.ObjectId(tenantId) }; // eslint-disable-line no-undef
    if (status)   match.status      = status;
    if (type)     match.type        = type;
    if (priority) match.priority    = priority;
    if (client)   match.client      = new mongoose.Types.ObjectId(client); // eslint-disable-line no-undef
    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate)   match.createdAt.$lte = new Date(toDate);
    }

    const filter = { ...match };

    // Full-text search on description
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rows, total] = await Promise.all([
      Issue.find(filter)
        .populate('client', 'name email')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Issue.countDocuments(filter),
    ]);

    res.json({
      issues: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── GET /api/issues/:id ───────────────────────────────────────────────────────
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    const issue = await Issue.findOne({
      _id: req.params.id,
      tenant: new mongoose.Types.ObjectId(tenantId) // eslint-disable-line no-undef
    })
      .populate('client', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── POST /api/issues — create ─────────────────────────────────────────────────
router.post('/', body(
  'client').isMongoId().withMessage('Valid client ID is required'),
  body('type').isIn(['Bug', 'Complaint', 'Feature Request', 'Billing', 'Technical', 'General']),
  body('description').trim().isLength({ min: 5 }).withMessage('Description must be at least 5 characters'),
  body('priority').isIn(['Low', 'Medium', 'Critical']),
  async (req, res) => {
    try {
      const tenantId = req.tenant?._id || req.tenantId;
      const userId = req.user?.userId || req.user?._id;

      const { client, contactPerson, type, description, priority, assignedTo } = req.body;

      // Verify client belongs to this tenant
      const clientDoc = await Client.findOne({
        _id: client,
        ...(req.tenantQuery || { tenant: new mongoose.Types.ObjectId(tenantId) }) // eslint-disable-line no-undef
      });
      if (!clientDoc) return res.status(404).json({ message: 'Client not found' });

      const issue = new Issue({
        client,
        contactPerson: contactPerson || clientDoc.contactName || '',
        type,
        description,
        priority: priority || 'Medium',
        status: 'New',
        tenant: new mongoose.Types.ObjectId(tenantId), // eslint-disable-line no-undef
        createdBy: userId,
        assignedTo: assignedTo || null,
      });
      await issue.save();
      await issue.populate('client', 'name email');
      await issue.populate('createdBy', 'name email');
      await issue.populate('assignedTo', 'name email');

      // Audit log
      try {
        await new AuditLog({
          action: 'issue_created',
          user: userId,
          tenant: new mongoose.Types.ObjectId(tenantId), // eslint-disable-line no-undef
          description: `Issue "${type}" created for ${clientDoc.name}`,
        }).save();
      } catch { /* audit log failure is non-fatal */ }

      res.status(201).json(issue);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// ── PATCH /api/issues/:id — update ───────────────────────────────────────────
router.patch('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, tenant: new mongoose.Types.ObjectId(tenantId) }, // eslint-disable-line no-undef
      req.body,
      { new: true }
    ).populate('client', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── PATCH /api/issues/:id/status — quick status change ─────────────────────────
router.patch('/:id/status', validateObjectId('id'), async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    const { status, resolution } = req.body;
    if (!['New', 'In Progress', 'Done'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use New, In Progress, or Done.' });
    }
    const update = { status };
    if (status === 'Done' && resolution) update.resolution = resolution;
    const issue = await Issue.findOneAndUpdate(
      { _id: req.params.id, tenant: new mongoose.Types.ObjectId(tenantId) }, // eslint-disable-line no-undef
      update,
      { new: true }
    ).populate('client', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── DELETE /api/issues/:id ────────────────────────────────────────────────────
router.delete('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const tenantId = req.tenant?._id || req.tenantId;
    const issue = await Issue.findOneAndDelete({
      _id: req.params.id,
      tenant: new mongoose.Types.ObjectId(tenantId) // eslint-disable-line no-undef
    });
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
