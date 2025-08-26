import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const auditLogSchema = new mongoose.Schema({
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
   userName: {                 // <-- add this field for user name
    type: String,
    required: false
  },
  userEmail: {
    type: String,
    required: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UNKNOWN']
  },
  
  // Resource information
  resource: {
    type: String,
    required: true // e.g., 'users', 'projects', 'timesheets'
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Request details
  method: {
    type: String,
    required: true
  },
  
  // Message field for audit description
  message: {
    type: String,
    required: true
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  sessionId: String,
  
  // Status and messaging
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'ERROR'],
    default: 'SUCCESS'
  },
  errorMessage: String
}, {
  timestamps: true
});

// Add the pagination plugin
auditLogSchema.plugin(mongoosePaginate);

// Indexes for better query performance
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userEmail: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Default export
export default AuditLog;
