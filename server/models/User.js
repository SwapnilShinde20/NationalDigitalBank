const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  mobileVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  deviceId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
