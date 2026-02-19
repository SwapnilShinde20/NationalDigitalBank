const Application = require('../models/Application');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// ───────────────────────────────────────────────────────────
//  IDENTITY MATCHING UTILITIES
// ───────────────────────────────────────────────────────────

/**
 * Compare two names using word-overlap similarity.
 * Returns a percentage (0–100).
 */
function nameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  const normalize = (s) =>
    s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);

  const words1 = normalize(name1);
  const words2 = normalize(name2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const set2 = new Set(words2);
  let matches = 0;
  for (const w of words1) {
    if (set2.has(w)) matches++;
  }

  // Percentage based on the longer list to avoid gaming with short names
  const maxLen = Math.max(words1.length, words2.length);
  return Math.round((matches / maxLen) * 100);
}

/**
 * Compare two dates ignoring format differences.
 * Returns true if they represent the same calendar date.
 */
function dobMatch(dob1, dob2) {
  if (!dob1 || !dob2) return false;

  const d1 = new Date(dob1);
  const d2 = new Date(dob2);

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Run identity verification against personal info.
 * Returns { identityVerified, identityMismatch, mismatches[] }
 */
function verifyIdentity(application) {
  const fullName = application.personalInfo?.fullName || '';
  const userDOB  = application.personalInfo?.dob || '';
  const mismatches = [];

  // --- PAN identity check ---
  const panName = application.kyc?.panExtractedName;
  const panDOB  = application.kyc?.panExtractedDOB;

  if (panName) {
    const sim = nameSimilarity(fullName, panName);
    if (sim < 70) {
      mismatches.push(`PAN name mismatch (similarity ${sim}%): "${panName}" vs "${fullName}"`);
    }
  }
  if (panDOB) {
    if (!dobMatch(userDOB, panDOB)) {
      mismatches.push(`PAN DOB mismatch: "${panDOB}" vs "${userDOB}"`);
    }
  }

  // --- Aadhaar identity check ---
  const aadhaarName = application.kyc?.aadhaarExtractedName;
  const aadhaarDOB  = application.kyc?.aadhaarExtractedDOB;

  if (aadhaarName) {
    const sim = nameSimilarity(fullName, aadhaarName);
    if (sim < 70) {
      mismatches.push(`Aadhaar name mismatch (similarity ${sim}%): "${aadhaarName}" vs "${fullName}"`);
    }
  }
  if (aadhaarDOB) {
    if (!dobMatch(userDOB, aadhaarDOB)) {
      mismatches.push(`Aadhaar DOB mismatch: "${aadhaarDOB}" vs "${userDOB}"`);
    }
  }

  const identityMismatch = mismatches.length > 0;
  return {
    identityVerified: !identityMismatch,
    identityMismatch,
    mismatches,
  };
}

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

  // ── 2. Identity Mismatch Risk – Critical (up to 70 pts) ──
  if (application.kyc?.identityMismatch) {
    score += 70;
    factors.push('Identity mismatch between provided information and KYC documents');
  }

  // ── 3. Contact Verification Risk (up to 35 pts) ──
  if (!application.verification?.mobileVerified) {
    score += 20;
    factors.push('Mobile not verified');
  }
  if (!application.verification?.emailVerified) {
    score += 15;
    factors.push('Email not verified');
  }

  // ── 4. Address Completeness Risk (up to 25 pts) ──
  const addr = application.address?.currentAddress;
  if (!addr?.line1 || !addr?.city || !addr?.pinCode) {
    score += 25;
    factors.push('Address incomplete');
  }

  // ── 5. Income Risk (up to 30 pts) ──
  const income = (application.personalInfo?.annualIncome || '').toLowerCase();
  if (income.includes('0-3') || income.includes('below') || income === '') {
    score += 30;
    factors.push('Low income range (0\u20133 L)');
  } else if (income.includes('3-10') || income.includes('3l') || income.includes('5l')) {
    score += 15;
    factors.push('Moderate income range (3\u201310 L)');
  } else {
    score += 5;
  }

  // ── 6. PEP Risk – Critical (up to 60 pts) ──
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

  // ── Identity mismatch penalty (−40 pts) ──
  if (application.kyc?.identityMismatch) {
    score -= 40;
  }

  return Math.max(0, Math.min(score, 100));
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
        if (!application.kyc) application.kyc = {};

        if (documentType === 'PAN') {
            // Simulate OCR: extract name & DOB from PAN card
            const userFullName = application.personalInfo?.fullName || 'MOCK USER';
            const userDOB      = application.personalInfo?.dob
              ? new Date(application.personalInfo.dob).toISOString().split('T')[0]
              : '1990-01-01';

            extractedData = {
              panNumber: 'ABCDE1234F',
              name: userFullName.toUpperCase(),
              dob: userDOB,
            };

            application.kyc.panNumber        = 'ABCDE1234F';
            application.kyc.panStatus        = 'verified';
            application.kyc.panExtractedName = extractedData.name;
            application.kyc.panExtractedDOB  = extractedData.dob;
            application.markModified('kyc');

        } else if (documentType === 'AADHAAR') {
            // Simulate OCR: extract name & DOB from Aadhaar card
            const userFullName = application.personalInfo?.fullName || 'MOCK USER';
            const userDOB      = application.personalInfo?.dob
              ? new Date(application.personalInfo.dob).toISOString().split('T')[0]
              : '1990-01-01';

            extractedData = {
              aadhaarNumber: '123456789012',
              name: userFullName.toUpperCase(),
              dob: userDOB,
            };

            application.kyc.aadhaarNumber        = '123456789012';
            application.kyc.aadhaarStatus        = 'verified';
            application.kyc.aadhaarExtractedName = extractedData.name;
            application.kyc.aadhaarExtractedDOB  = extractedData.dob;
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

        // ── Identity Verification ──
        const identity = verifyIdentity(application);

        application.kyc = {
          ...(application.kyc || {}),
          identityVerified: identity.identityVerified,
          identityMismatch: identity.identityMismatch,
        };
        application.markModified('kyc');

        // ── Calculate Risk & Compliance ──
        const user = await User.findById(userId);
        const { riskScore, riskLevel, riskFactors } = calculateRiskScore(application);
        let complianceScore = calculateComplianceScore(user, application);

        // Append identity mismatch details to risk factors
        if (identity.identityMismatch) {
            for (const m of identity.mismatches) {
                if (!riskFactors.includes(m)) riskFactors.push(m);
            }
        }

        // ── AI Decision Logic (recommendation only – admin approves) ──
        const finalStatus = 'SUBMITTED';
        let aiDecision = '';

        if (identity.identityMismatch) {
            aiDecision = 'High Risk \u2013 Identity mismatch detected between personal info and KYC documents';
        } else if (complianceScore >= 80 && riskLevel === 'LOW') {
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
            fraudStatus: identity.identityMismatch ? 'SUSPECTED' : 'CLEAR',
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
              identityVerified: String(identity.identityVerified),
              identityMismatch: String(identity.identityMismatch),
            }
        });

        res.json({
            riskScore,
            riskLevel,
            complianceScore,
            status: finalStatus,
            aiDecision,
            identityVerified: identity.identityVerified,
            identityMismatch: identity.identityMismatch,
            identityMismatches: identity.mismatches,
            application,
        });

    } catch (error) {
        console.error('submitApplication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
