const Application = require('../models/Application');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// ───────────────────────────────────────────────────────────
//  RISK SCORING ENGINE  (Higher score = Higher risk, 0–100)
// ───────────────────────────────────────────────────────────

const calculateRiskScore = (application) => {
  let score = 0;
  const factors = [];

  // ── 1. Identity Verification Risk (up to 80 pts) ──
  const panStatus  = (application.kyc?.panStatus || '').toUpperCase();
  const aadhaarSts = (application.kyc?.aadhaarStatus || '').toUpperCase();

  if (panStatus !== 'VALID' && panStatus !== 'VERIFIED') {
    score += 40;
    factors.push('PAN not verified');
  }
  if (aadhaarSts !== 'VALID' && aadhaarSts !== 'VERIFIED') {
    score += 40;
    factors.push('Aadhaar not verified');
  }

  // ── 2. Contact Verification Risk (up to 35 pts) ──
  if (!application.verification?.mobileVerified) {
    score += 20;
    factors.push('Mobile not verified');
  }
  if (!application.verification?.emailVerified) {
    score += 15;
    factors.push('Email not verified');
  }

  // ── 3. Address Completeness Risk (up to 25 pts) ──
  const addr = application.address?.currentAddress;
  if (!addr?.line1 || !addr?.city || !addr?.pinCode) {
    score += 25;
    factors.push('Address incomplete');
  }

  // ── 4. Income Risk (up to 30 pts) ──
  const income = (application.personalInfo?.annualIncome || '').toLowerCase();
  if (income.includes('0-3') || income.includes('below') || income === '') {
    score += 30;
    factors.push('Low income range (0\u20133 L)');
  } else if (income.includes('3-10') || income.includes('3l') || income.includes('5l')) {
    score += 15;
    factors.push('Moderate income range (3\u201310 L)');
  } else {
    // >10 L
    score += 5;
  }

  // ── 5. PEP Risk – Critical (up to 60 pts) ──
  if (application.employment?.pepDeclaration === true) {
    score += 60;
    factors.push('Politically Exposed Person (PEP)');
  }

  // ── Normalize ──
  score = Math.max(0, Math.min(score, 100));

  // ── Risk Level ──
  let riskLevel = 'LOW';
  if (score >= 71) riskLevel = 'HIGH';
  else if (score >= 31) riskLevel = 'MEDIUM';

  return { riskScore: score, riskLevel, riskFactors: factors };
};

// ───────────────────────────────────────────────────────────
//  COMPLIANCE SCORING ENGINE  (Higher = More compliant, 0–100)
// ───────────────────────────────────────────────────────────

const calculateComplianceScore = (user, application) => {
  let score = 0;

  // Contact verification (40 pts)
  if (application.verification?.mobileVerified || user?.mobileVerified)  score += 20;
  if (application.verification?.emailVerified  || user?.emailVerified)   score += 20;

  // Identity documents (40 pts)
  const pan  = (application.kyc?.panStatus || '').toUpperCase();
  const aadh = (application.kyc?.aadhaarStatus || '').toUpperCase();
  if (pan === 'VALID' || pan === 'VERIFIED')   score += 20;
  if (aadh === 'VALID' || aadh === 'VERIFIED') score += 20;

  // Personal info completeness (10 pts)
  const pi = application.personalInfo;
  if (pi?.fullName && pi?.dob && pi?.gender) score += 10;

  // Address completeness (10 pts)
  const addr = application.address?.currentAddress;
  if (addr?.line1 && addr?.city && addr?.pinCode) score += 10;

  return Math.min(score, 100);
};

// ───────────────────────────────────────────────────────────
//  CONTROLLERS
// ───────────────────────────────────────────────────────────

exports.createOrUpdateApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    let application = await Application.findOne({ userId });

    if (!application) {
      application = new Application({ userId, ...updateData });
    } else {
        Object.keys(updateData).forEach(key => {
            application[key] = updateData[key];
        });
    }

    // Recalculate Risk on every update (Dynamic Risk Engine)
    const riskAnalysis = calculateRiskScore(application);
    application.riskProfile = {
      ...(application.riskProfile || {}),
      riskScore: riskAnalysis.riskScore,
      riskLevel: riskAnalysis.riskLevel,
      riskFactors: riskAnalysis.riskFactors,
    };
    application.markModified('riskProfile');

    // Recalculate Compliance
    const user = await User.findById(userId);
    application.riskProfile.complianceScore = calculateComplianceScore(user, application);
    application.markModified('riskProfile');

    await application.save();

    await AuditLog.create({
        userId,
        applicationId: application._id,
        action: 'UPDATE_APPLICATION',
        details: { riskScore: String(riskAnalysis.riskScore), status: application.status }
    });

    res.json({ application, riskAnalysis });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getApplication = async (req, res) => {
    try {
        const application = await Application.findOne({ userId: req.user.userId });
        if (!application) return res.status(404).json({ message: 'Application not found' });
        res.json(application);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { documentType } = req.body;
    const userId = req.user.userId;

    let application = await Application.findOne({ userId });
    if (!application) {
        application = new Application({ userId });
        await application.save();
    }

    // Mock OCR & Validation
    const isBlurry = req.file.size < 50 * 1024;

    let validationStatus = 'PENDING';
    let extractedData = {};

    if (isBlurry) {
        validationStatus = 'BLURRY';
    } else {
        validationStatus = 'VALID';
        if (documentType === 'PAN') {
            extractedData = { panNumber: 'ABCDE1234F', name: 'MOCK USER' };
            if (!application.kyc) application.kyc = {};
            application.kyc.panNumber = 'ABCDE1234F';
            application.kyc.panStatus = 'verified';
            application.markModified('kyc');
        } else if (documentType === 'AADHAAR') {
            extractedData = { aadhaarNumber: '123456789012' };
            if (!application.kyc) application.kyc = {};
            application.kyc.aadhaarNumber = '123456789012';
            application.kyc.aadhaarStatus = 'verified';
            application.markModified('kyc');
        }
    }

    const doc = new Document({
      applicationId: application._id,
      documentType,
      filePath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      validationStatus,
      blurScore: isBlurry ? 0.9 : 0.1,
      extractedData
    });

    await doc.save();
    await application.save();

    res.json({ document: doc, validationStatus, extractedData, message: isBlurry ? 'Document is blurry, please re-upload' : 'Document verified successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ───────────────────────────────────────────────────────────
//  SUBMIT APPLICATION – Final AI Decision
// ───────────────────────────────────────────────────────────

exports.submitApplication = async (req, res) => {
    try {
        const userId = req.user.userId;
        const application = await Application.findOne({ userId });

        if (!application) return res.status(404).json({ message: 'No application found' });

        // ── Calculate Risk & Compliance ──
        const user = await User.findById(userId);
        const { riskScore, riskLevel, riskFactors } = calculateRiskScore(application);
        const complianceScore = calculateComplianceScore(user, application);

        // ── AI Decision Logic (recommendation only – admin approves) ──
        const finalStatus = 'SUBMITTED';
        let aiDecision = '';

        if (complianceScore >= 80 && riskLevel === 'LOW') {
            aiDecision = 'AI Recommends Approval \u2013 Low Risk, High Compliance';
        } else if (riskLevel === 'HIGH') {
            aiDecision = 'AI Escalated \u2013 High Risk Detected';
        } else {
            aiDecision = 'AI Recommends Standard Review';
        }

        // ── Persist riskProfile ──
        application.riskProfile = {
            riskScore,
            riskLevel,
            complianceScore,
            riskFactors,
            amlStatus:   riskLevel === 'HIGH' ? 'FLAGGED' : 'CLEAR',
            fraudStatus: 'CLEAR',
        };
        application.markModified('riskProfile');

        application.status     = finalStatus;
        application.aiDecision = aiDecision;

        await application.save();

        await AuditLog.create({
            applicationId: application._id,
            action: 'SUBMIT_APPLICATION',
            details: {
              finalStatus,
              aiDecision,
              riskScore: String(riskScore),
              riskLevel,
              complianceScore: String(complianceScore),
            }
        });

        res.json({
            riskScore,
            riskLevel,
            complianceScore,
            status: finalStatus,
            aiDecision,
            application,
        });

    } catch (error) {
        console.error('submitApplication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
