import express from 'express';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { sendEmail, generateOTP } from '../services/emailService.js';
import { tenantAuth, requireRole, requireSuperAdmin, addTenantFilter, addTenantData, checkUsageLimit } from '../middleware/tenantAuth.js';

const router = express.Router();

// Get all users (admin only, tenant-scoped)
router.get('/', tenantAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    // Build query with tenant filtering
    const query = addTenantFilter(req, {});
    
    // Get users with tenant filtering
    const users = await User.find(query)
      .select('-password -otp')
      .populate('tenant', 'name slug')
      .lean()
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new agent with OTP (admin only, with usage limits)
router.post('/', tenantAuth, requireRole(['admin', 'superadmin']), checkUsageLimit('users'), async (req, res) => {
  try {
    const { name, email, phone, role = 'agent', nin = null } = req.body;
    
    // Check if user already exists (tenant-scoped for regular admins)
    const existingUserQuery = req.isSuperAdmin 
      ? { email } 
      : { email, $or: [{ tenant: req.tenantId }, { tenant: null }] };
    
    const existingUser = await User.findOne(existingUserQuery);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate OTP (6-digit code)
    const otp = generateOTP();
    
    // Prepare user data with tenant context
    const userData = {
      name,
      email,
      phone,
      nin,
      password: otp, // OTP is the initial password
      role,
      isFirstLogin: true,
      otp: otp,
      otpExpires: new Date(Date.now() + 12 * 60 * 60 * 1000) // OTP expires in 12 hours
    };

    // Add tenant data (super admin must specify tenant manually if needed)
    const userDataWithTenant = addTenantData(req, userData);
    
    // Create user
    const user = new User(userDataWithTenant);
    await user.save();

    // Update tenant usage statistics
    if (req.tenantId) {
      await Tenant.findByIdAndUpdate(req.tenantId, {
        $inc: { 'usage.totalUsers': 1 },
        'usage.lastActivity': new Date()
      });
    }

    // Send welcome email with OTP
    const emailResult = await sendEmail(
      email,
      'agentWelcome',
      { name, email, otp }
    );

    // Return user data without sensitive information
    const userResponse = await User.findById(user._id)
      .select('-password -otp')
      .populate('tenant', 'name slug');

    if (emailResult.success) {
      res.status(201).json({ 
        message: 'User created successfully and welcome email sent',
        user: userResponse,
        emailSent: true
      });
    } else {
      res.status(201).json({ 
        message: 'User created but failed to send welcome email',
        user: userResponse,
        emailSent: false,
        otp: otp, // Include OTP so admin can share manually
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('❌ Error creating user:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP (admin only, tenant-scoped)
router.post('/:id/resend-otp', tenantAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    // Find user with tenant filtering
    const query = addTenantFilter(req, { _id: req.params.id });
    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const newOTP = generateOTP();
    
    // Update user with new OTP
    user.password = newOTP;
    user.otp = newOTP;
    user.otpExpires = new Date(Date.now() + 12 * 60 * 60 * 1000);
    user.isFirstLogin = true;
    
    await user.save();

    // Send email with new OTP
    const emailResult = await sendEmail(
      user.email,
      'agentWelcome',
      { name: user.name, email: user.email, otp: newOTP }
    );

    res.json({ 
      message: 'OTP resent successfully',
      emailSent: emailResult.success,
      otp: newOTP // For admin reference
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile (admin only, tenant-scoped)
router.put('/:id', tenantAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { name, phone, profileImage, nin, isActive, status } = req.body;

    const update = {};
    if (typeof name !== 'undefined') update.name = name;
    if (typeof phone !== 'undefined') update.phone = phone;
    if (typeof profileImage !== 'undefined') update.profileImage = profileImage;
    if (typeof nin !== 'undefined') update.nin = nin;
    if (typeof isActive !== 'undefined') {
      update.isActive = isActive;
      // if admin deactivates the account, ensure status becomes offline immediately
      if (isActive === false) update.status = 'offline';
    }
    if (typeof status !== 'undefined') update.status = status;

    // Find and update user with tenant filtering
    const query = addTenantFilter(req, { _id: req.params.id });
    const user = await User.findOneAndUpdate(
      query,
      update,
      { new: true, runValidators: true }
    ).select('-password -otp').populate('tenant', 'name slug');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (admin only, tenant-scoped)
router.delete('/:id', tenantAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    // Find and delete user with tenant filtering
    const query = addTenantFilter(req, { _id: req.params.id });
    const user = await User.findOneAndDelete(query);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update tenant usage statistics
    if (req.tenantId) {
      await Tenant.findByIdAndUpdate(req.tenantId, {
        $inc: { 'usage.totalUsers': -1 },
        'usage.lastActivity': new Date()
      });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as userRoutes };
