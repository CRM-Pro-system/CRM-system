import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';

/**
 * Tenant-Aware Authentication Middleware
 * 
 * This middleware:
 * 1. Verifies JWT token
 * 2. Loads user with tenant information
 * 3. Ensures tenant is active
 * 4. Adds tenant context to request
 * 5. Handles super-admin special cases
 */
export const tenantAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. No valid token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (error) {
      return res.status(401).json({ 
        message: 'Invalid or expired token.',
        code: 'INVALID_TOKEN'
      });
    }

    // Load user with tenant information
    const user = await User.findById(decoded.userId)
      .populate('tenant')
      .select('-password -otp');

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is active
    if (user.isActive === false) {
      return res.status(403).json({ 
        message: 'Account has been deactivated. Please contact your administrator.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Handle Super Admin (no tenant restrictions)
    if (user.role === 'superadmin') {
      req.user = user;
      req.tenant = null; // Super admin has access to all tenants
      req.isSuperAdmin = true;
      return next();
    }

    // Regular users must have a tenant
    if (!user.tenant) {
      return res.status(403).json({ 
        message: 'User is not associated with any organization. Please contact support.',
        code: 'NO_TENANT'
      });
    }

    // Check if tenant is active
    if (user.tenant.status !== 'active' && user.tenant.status !== 'trial') {
      return res.status(403).json({ 
        message: 'Organization account is suspended. Please contact your administrator.',
        code: 'TENANT_SUSPENDED'
      });
    }

    // Check if trial has expired
    if (user.tenant.status === 'trial' && user.tenant.isTrialExpired) {
      return res.status(403).json({ 
        message: 'Trial period has expired. Please upgrade your subscription.',
        code: 'TRIAL_EXPIRED'
      });
    }

    // Add user and tenant context to request
    req.user = user;
    req.tenant = user.tenant;
    req.tenantId = user.tenant._id;
    req.isSuperAdmin = false;

    next();
  } catch (error) {
    console.error('Tenant auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication service error.',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * 
 * Ensures user has required role(s) to access endpoint
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Super admin has access to everything
    if (req.isSuperAdmin) {
      return next();
    }

    // Check if user has required role
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

/**
 * Super Admin Only Middleware
 * 
 * Restricts access to super admin only
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.isSuperAdmin) {
    return res.status(403).json({ 
      message: 'Access denied. Super admin privileges required.',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Feature Access Middleware
 * 
 * Checks if tenant's subscription allows access to specific features
 */
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    // Super admin bypasses feature restrictions
    if (req.isSuperAdmin) {
      return next();
    }

    if (!req.tenant) {
      return res.status(403).json({ 
        message: 'Tenant context required.',
        code: 'NO_TENANT_CONTEXT'
      });
    }

    try {
      // Load tenant with subscription details
      const tenant = await Tenant.findById(req.tenantId).populate('subscription');
      
      if (!tenant) {
        return res.status(403).json({ 
          message: 'Tenant not found.',
          code: 'TENANT_NOT_FOUND'
        });
      }

      // Check if feature is enabled
      const hasFeature = tenant.hasFeature(featureName);
      
      if (!hasFeature) {
        return res.status(403).json({ 
          message: `Feature '${featureName}' is not available in your current plan. Please upgrade.`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: featureName
        });
      }

      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({ 
        message: 'Feature access service error.',
        code: 'FEATURE_SERVICE_ERROR'
      });
    }
  };
};

/**
 * Usage Limit Middleware
 * 
 * Checks if tenant has reached usage limits for specific resources
 */
export const checkUsageLimit = (resourceType) => {
  return async (req, res, next) => {
    // Super admin bypasses usage limits
    if (req.isSuperAdmin) {
      return next();
    }

    if (!req.tenant) {
      return res.status(403).json({ 
        message: 'Tenant context required.',
        code: 'NO_TENANT_CONTEXT'
      });
    }

    try {
      const tenant = await Tenant.findById(req.tenantId).populate('subscription');
      
      if (!tenant) {
        return res.status(403).json({ 
          message: 'Tenant not found.',
          code: 'TENANT_NOT_FOUND'
        });
      }

      // Check usage limits based on resource type
      let canAdd = false;
      let currentUsage = 0;
      let limit = 0;

      switch (resourceType) {
        case 'users':
          canAdd = tenant.canAddUser();
          currentUsage = tenant.usage.totalUsers;
          limit = tenant.settings.features.maxUsers;
          break;
        case 'clients':
          canAdd = tenant.canAddClient();
          currentUsage = tenant.usage.totalClients;
          limit = tenant.settings.features.maxClients;
          break;
        case 'deals':
          canAdd = tenant.canAddDeal();
          currentUsage = tenant.usage.totalDeals;
          limit = tenant.settings.features.maxDeals;
          break;
        default:
          return next(); // Unknown resource type, allow through
      }

      if (!canAdd) {
        return res.status(403).json({ 
          message: `Usage limit reached. You have ${currentUsage}/${limit} ${resourceType}. Please upgrade your plan.`,
          code: 'USAGE_LIMIT_REACHED',
          resourceType,
          currentUsage,
          limit
        });
      }

      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ 
        message: 'Usage limit service error.',
        code: 'USAGE_SERVICE_ERROR'
      });
    }
  };
};

/**
 * Tenant Query Filter Helper
 * 
 * Adds tenant filter to MongoDB queries automatically
 */
export const addTenantFilter = (req, baseQuery = {}) => {
  // Super admin can see all data (no tenant filter)
  if (req.isSuperAdmin) {
    return baseQuery;
  }

  // Add tenant filter for regular users
  return {
    ...baseQuery,
    tenant: req.tenantId
  };
};

/**
 * Tenant Data Injection Helper
 * 
 * Automatically adds tenant ID to data being created
 */
export const addTenantData = (req, data = {}) => {
  // Super admin must explicitly specify tenant
  if (req.isSuperAdmin) {
    return data; // Don't auto-add tenant for super admin
  }

  // Add tenant ID for regular users
  return {
    ...data,
    tenant: req.tenantId
  };
};