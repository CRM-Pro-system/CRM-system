import AuditLog from '../models/AuditLog.js';

export const logAction = async (req, action, description, options = {}) => {
  try {
    const { entityType = '', entityId = null, status = 'success', metadata = {} } = options;

    await AuditLog.create({
      action,
      description,
      user: req.user?.userId,
      userName: req.user?.name || '',
      userEmail: req.user?.email || '',
      userRole: req.user?.role || '',
      tenant: req.user?.tenantId || null,
      entityType,
      entityId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      status,
      metadata
    });
  } catch (error) {
    // Never let audit logging break the main request
    console.error('Audit log error:', error.message);
  }
};
