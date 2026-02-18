const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., 'LOGIN', 'SUBMIT_STEP', 'UPLOAD', 'ADMIN_OVERRIDE'
  actor: { type: String, enum: ['AI', 'HUMAN', 'USER', 'SYSTEM'], default: 'USER' },
  details: { type: Map, of: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
