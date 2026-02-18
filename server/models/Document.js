const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  documentType: { type: String, enum: ['PAN', 'AADHAAR', 'HOTO', 'SIGNATURE', 'OTHER'], required: true },
  filePath: { type: String, required: true },
  originalName: String,
  mimeType: String,
  size: Number,
  validationStatus: { type: String, enum: ['PENDING', 'VALID', 'INVALID', 'BLURRY'], default: 'PENDING' },
  extractedData: { type: Map, of: String }, // For storing OCR results
  blurScore: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
