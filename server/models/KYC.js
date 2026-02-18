const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentType: { type: String, enum: ['PAN', 'AADHAAR'], required: true },
  filePath: { type: String, required: true },
  extractedText: { type: String },
  extractedNumber: { type: String },
  confidenceScore: { type: Number, default: 0 },
  validationStatus: { type: String, enum: ['VALID', 'INVALID', 'PENDING'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('KYC', kycSchema);
