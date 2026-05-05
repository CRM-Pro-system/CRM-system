import express from 'express';
import bcrypt from 'bcryptjs';
import Tenant from '../models/Tenant.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Deal from '../models/Deal.js';
import { tenantAuth, requireSuperAdmin } from '../middleware/tenantAuth.js';
import { sendEmail, generateOTP } from '../services/emailService.js';

const router = express.Router();

router.use(tenantAuth);

// GET all tenants (super admin only)
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const tenants = await Tenant.find({}).sort({ createdAt: -1 });
    res.json({ tenants, total: tenants.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH branding/logo - MUST be before /:id routes
router.patch('/branding/logo', async (req, res) => {
  try {
    if (req.isSuperAdmin) {
      return res.status(400).json({ message: 'Super admin does not have a tenant to update' });
    }
    const { logo, primaryColor, secondaryColor } = req.body;
    const update = {};
    if (logo) update['settings.logo'] = logo;
    if (primaryColor) update['settings.primaryColor'] = primaryColor;
    if (secondaryColor) update['settings.secondaryColor'] = secondaryColor;

    const tenant = await Tenant.findByIdAndUpdate(req.tenantId, update, { new: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: 'Branding updated successfully', tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create new tenant (super admin only)
router.post('/', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, address, adminName, subscriptionPlan = 'starter', settings, metadata } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const existing = await Tenant.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Organization with this email already exists' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'A user with this email already exists' });

    const subscription = await Subscription.findOne({ planName: subscriptionPlan }) ||
      await Subscription.findOne({ planName: 'starter' });

    const tenant = new Tenant({
      name,
      email,
      phone: phone || '',
      address: address || {},
      subscription: subscription?._id || null,
      settings: {
        primaryColor: settings?.primaryColor || '#f97316',
        secondaryColor: settings?.secondaryColor || '#1f2937',
        timezone: settings?.timezone || 'UTC',
        currency: settings?.currency || 'USD',
        language: settings?.language || 'en',
        features: {
          maxUsers: 100,
          maxClients: 1000,
          maxDeals: 500,
          advancedReports: true,
          apiAccess: true,
          customBranding: true,
          bulkOperations: true
        }
      },
      usage: { totalUsers: 0, totalClients: 0, totalDeals: 0, storageUsed: 0 },
      status: 'active',
      metadata: metadata || {}
    });
    await tenant.save();

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(otp, 10);
    const companyAdminName = adminName || `${name} Admin`;

    const adminUser = new User({
      name: companyAdminName,
      email,
      password: hashedPassword,
      role: 'admin',
      tenant: tenant._id,
      otp,
      otpExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isFirstLogin: true,
      isActive: true,
      phone: phone || '',
      status: 'offline'
    });
    await adminUser.save();

    await Tenant.findByIdAndUpdate(tenant._id, { 'usage.totalUsers': 1 });

    const emailResult = await sendEmail(email, 'agentWelcome', {
      name: companyAdminName,
      email,
      otp
    });

    res.status(201).json({
      message: 'Organization created successfully',
      tenant,
      admin: { name: companyAdminName, email, role: 'admin' },
      emailSent: emailResult.success,
      otp: emailResult.success ? undefined : otp
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (error.code === 11000) return res.status(400).json({ message: 'Organization with this name or email already exists' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single tenant (super admin only)
router.get('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    const userCount = await User.countDocuments({ tenant: tenant._id });
    res.json({ ...tenant.toObject(), userCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update tenant (super admin only)
router.put('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, address, status, settings, metadata } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (phone) update.phone = phone;
    if (address) update.address = address;
    if (status) update.status = status;
    if (metadata) update.metadata = metadata;
    if (settings) {
      if (settings.primaryColor) update['settings.primaryColor'] = settings.primaryColor;
      if (settings.secondaryColor) update['settings.secondaryColor'] = settings.secondaryColor;
      if (settings.timezone) update['settings.timezone'] = settings.timezone;
      if (settings.currency) update['settings.currency'] = settings.currency;
      if (settings.language) update['settings.language'] = settings.language;
      if (settings.features) {
        Object.keys(settings.features).forEach(key => {
          update[`settings.features.${key}`] = settings.features[key];
        });
      }
    }
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: 'Organization updated successfully', tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH update tenant status (super admin only)
router.patch('/:id/status', requireSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'inactive', 'trial'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.json({ message: `Organization ${status} successfully`, tenant });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE tenant (super admin only)
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    await Tenant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET tenant stats (super admin only)
router.get('/:id/stats', requireSuperAdmin, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    const [userCount, clientCount, dealCount] = await Promise.all([
      User.countDocuments({ tenant: tenant._id }),
      Client.countDocuments({ tenant: tenant._id }),
      Deal.countDocuments({ tenant: tenant._id })
    ]);
    res.json({
      tenantId: tenant._id,
      name: tenant.name,
      status: tenant.status,
      usage: { users: userCount, clients: clientCount, deals: dealCount },
      limits: tenant.settings.features,
      createdAt: tenant.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as tenantRoutes };
