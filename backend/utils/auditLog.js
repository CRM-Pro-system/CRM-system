import AuditLog from '../models/AuditLog.js';

export const logAction = async (req, action, description, options = {}) => {
  try {
    const { entityType = '', entityId = null, status = 'success', metadata = {} } = options;

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.ip || '';

    // Get browser/device info
    const userAgent = req.headers['user-agent'] || '';
    const getBrowser = (ua) => {
      if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
      if (ua.includes('Edg')) return 'Edge';
      if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
      return 'Unknown Browser';
    };
    const getDevice = (ua) => {
      if (ua.includes('Mobile') || ua.includes('Android')) return 'Mobile';
      if (ua.includes('Tablet') || ua.includes('iPad')) return 'Tablet';
      return 'Desktop';
    };

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
      ipAddress,
      status,
      metadata: {
        ...metadata,
        browser: getBrowser(userAgent),
        device: getDevice(userAgent),
        userAgent
      }
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};
