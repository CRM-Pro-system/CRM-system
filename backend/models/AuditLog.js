import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN', 'LOGOUT',
      'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
      'CREATE_CLIENT', 'UPDATE_CLIENT', 'DELETE_CLIENT',
      'CREATE_DEAL', 'UPDATE_DEAL', 'DELETE_DEAL',
      'CREATE_SALE', 'UPDATE_SALE',
      'CREATE_SCHEDULE', 'UPDATE_SCHEDULE', 'DELETE_SCHEDULE',
      'CREATE_MEETING', 'UPDATE_MEETING', 'DELETE_MEETING',
      'UPDATE_SETTINGS', 'CHANGE_PASSWORD',
      'CREATE_TENANT', 'UPDATE_TENANT', 'SUSPEND_TENANT',
      'EXPORT_DATA', 'OTHER'
    ]
  },
  description: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  userRole: {
    type: String,
    default: ''
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  entityType: {
    type: String,
    default: ''  // e.g. 'User', 'Client', 'Deal'
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  ipAddress: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

auditLogSchema.index({ tenant: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
