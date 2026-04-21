import express from 'express';
import Client from '../models/Client.js';
import { body, validationResult } from 'express-validator';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant-aware middleware to all routes
router.use(tenantAuth);

// Get all clients with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, agent } = req.query;

    // Start with tenant-filtered query
    let query = req.tenantQuery;

    // Apply search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply status filter
    if (status) {
      query.status = status;
    }

    // Apply agent filter (admin can filter by agent, agents see only their clients)
    if (req.user.role === 'agent') {
      query.agent = req.user.userId;
    } else if (agent) {
      query.agent = agent;
    }

    const skip = (page - 1) * limit;

    const clients = await Client.find(query)
      .populate('agent', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Client.countDocuments(query);

    res.json({
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, ...req.tenantQuery })
      .populate('agent', 'name email')
      .populate('assignedAgents', 'name email')
      .populate('deals', 'title value stage')
      .populate('interactions.createdBy', 'name')
      .populate('tasks.assignedTo', 'name');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if user has permission to view this client
    if (req.user.role === 'agent' && client.agent.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new client
router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().isLength({ min: 1 }).withMessage('Phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check usage limits
    if (!req.canAddClients()) {
      return res.status(403).json({ 
        message: 'Client limit reached for your subscription plan',
        limit: req.tenant.subscription?.features?.maxClients || 0
      });
    }

    const clientData = {
      ...req.body,
      tenant: req.user.tenantId,
      agent: req.user.role === 'agent' ? req.user.userId : req.body.agent
    };

    const client = new Client(clientData);
    await client.save();

    // Update tenant usage
    await req.updateTenantUsage('clients', 1);

    const populatedClient = await Client.findById(client._id)
      .populate('agent', 'name email');

    res.status(201).json(populatedClient);
  } catch (error) {
    console.error('Error creating client:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update client
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim().isLength({ min: 1 }).withMessage('Phone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await Client.findOne({ _id: req.params.id, ...req.tenantQuery });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if user has permission to update this client
    if (req.user.role === 'agent' && client.agent.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedClient = await Client.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      req.body,
      { new: true }
    ).populate('agent', 'name email');

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, ...req.tenantQuery });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if user has permission to delete this client
    if (req.user.role === 'agent' && client.agent.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Client.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });

    // Update tenant usage
    await req.updateTenantUsage('clients', -1);

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add interaction to client
router.post('/:id/interactions', [
  body('type').isIn(['call', 'email', 'meeting', 'ticket', 'other']).withMessage('Invalid interaction type'),
  body('notes').trim().isLength({ min: 1 }).withMessage('Notes are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await Client.findOne({ _id: req.params.id, ...req.tenantQuery });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if user has permission to add interactions
    if (req.user.role === 'agent' && client.agent.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const interaction = {
      type: req.body.type,
      notes: req.body.notes,
      date: new Date(),
      createdBy: req.user.userId
    };

    client.interactions.push(interaction);
    await client.save();

    const updatedClient = await Client.findById(client._id)
      .populate('interactions.createdBy', 'name');

    res.json(updatedClient);
  } catch (error) {
    console.error('Error adding interaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add task to client
router.post('/:id/tasks', [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await Client.findOne({ _id: req.params.id, ...req.tenantQuery });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if user has permission to add tasks
    if (req.user.role === 'agent' && client.agent.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = {
      title: req.body.title,
      description: req.body.description || '',
      dueDate: new Date(req.body.dueDate),
      dueTime: req.body.dueTime || '',
      assignedTo: req.body.assignedTo || req.user.userId,
      completed: false
    };

    client.tasks.push(task);
    await client.save();

    const updatedClient = await Client.findById(client._id)
      .populate('tasks.assignedTo', 'name');

    res.json(updatedClient);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as clientRoutes };