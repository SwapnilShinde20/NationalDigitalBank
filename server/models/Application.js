const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  applicationReference: {
    type: String,
    unique: true
  },

  currentStep: {
    type: Number,
    default: 1
  },

  status: {
    type: String,
    enum: ['IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'],
    default: 'IN_PROGRESS'
  },

  // STEP 1: Eligibility
  eligibility: {
    accountType: String,
    residencyStatus: String,
    dob: Date,
    consentGiven: Boolean
  },

  // STEP 2: Verification
  verification: {
    mobile: String,
    email: String,
    mobileVerified: Boolean,
    emailVerified: Boolean,
    deviceId: String
  },

  // STEP 3: Personal Info
  personalInfo: {
    fullName: String,
    dob: Date,
    gender: String,
    maritalStatus: String,
    fatherName: String,
    motherName: String,
    occupation: String,
    annualIncome: String
  },

  // STEP 4: Address
  address: {
    currentAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pinCode: String
    },
    permanentAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pinCode: String
    }
  },

  // STEP 5: KYC
  kyc: {
    panNumber: String,
    aadhaarNumber: String,
    panConfidenceScore: Number,
    aadhaarConfidenceScore: Number,
    panStatus: String,
    aadhaarStatus: String
  },

  // STEP 6: Employment
  employment: {
    employmentType: String,
    employerName: String,
    sourceOfIncome: String,
    taxResidency: String,
    pepDeclaration: Boolean
  },

  // STEP 7: Risk
  riskProfile: {
    riskScore: Number,
    riskLevel: String,
    complianceScore: Number,
    amlStatus: String,
    fraudStatus: String,
    riskFactors: [String]
  },

  // STEP 8: Nominee
  nominee: {
    fullName: String,
    relationship: String,
    dob: Date,
    address: String
  },

  // STEP 9: Services
  services: {
    debitCardType: String,
    internetBanking: Boolean,
    smsAlerts: Boolean,
    chequeBook: Boolean,
    upiActivation: Boolean
  },

  // STEP 12: Account Created
  accountDetails: {
    accountNumber: String,
    ifscCode: String,
    activatedAt: Date
  },

  // Update requests from user
  updateRequests: [{
    field: String,
    reason: String,
    newValue: String,
    requestedAt: Date,
    status: { type: String, default: 'pending' }
  }]

}, { timestamps: true });

// Pre-save hook to generate application reference if not exists
applicationSchema.pre('save', async function(next) {
  if (!this.applicationReference) {
    this.applicationReference = 'APP-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
