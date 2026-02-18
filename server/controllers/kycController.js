const Tesseract = require('tesseract.js');
const fs = require('fs');
const KYC = require('../models/KYC');
const { validationResult } = require('express-validator');

// Regex patterns
const PAN_REGEX = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
const AADHAAR_REGEX = /\d{4}\s?\d{4}\s?\d{4}/;

const normalizeNumber = (num) => {
    return num ? String(num).replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { documentType, enteredNumber } = req.body;
    const filePath = req.file.path;

    // --- 1. Blur Detection Simulation (File Size Check) ---
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const isBlurry = fileSizeInBytes < 50 * 1024; // < 50KB considered low quality/blurry

    // --- 2. OCR Extraction ---
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    const extractedText = text.toUpperCase();

    // --- 3. Validation Logic ---
    let confidenceScore = 100;
    let extractedNumber = null;
    let validationStatus = 'PENDING';
    let riskFactors = [];

    // Reduce score for blurriness
    if (isBlurry) {
      confidenceScore -= 20; // Updated penalty
      riskFactors.push('Image quality is low/blurry');
    }

    // Document Type Logic
    if (documentType === 'PAN') {
      const match = extractedText.match(PAN_REGEX);
      if (match) {
        extractedNumber = match[0];
      } else {
        confidenceScore -= 20; // Text found but pattern missing is bad, but maybe OCR error
        riskFactors.push('PAN number pattern not found');
      }

      if (!extractedText.includes('INCOME TAX DEPARTMENT')) {
        confidenceScore -= 10; 
        riskFactors.push('INCOME TAX DEPARTMENT keyword missing');
      }
    } else if (documentType === 'AADHAAR') {
      const match = extractedText.match(AADHAAR_REGEX);
      if (match) {
        extractedNumber = match[0];
      } else {
        // Try to find any sequence of 12 digits
        const noSpaceMatch = extractedText.replace(/\s/g, '').match(/\d{12}/);
        if (noSpaceMatch) {
            extractedNumber = noSpaceMatch[0];
        } else {
            confidenceScore -= 20;
            riskFactors.push('Aadhaar number pattern not found');
        }
      }
      
      if (!extractedText.includes('GOVERNMENT OF INDIA') && !extractedText.includes('UNIQUE IDENTIFICATION AUTHORITY')) {
        confidenceScore -= 10;
        riskFactors.push('Government/UIDAI keywords missing');
      }
    }

    // Compare with Entered Number (Normalization)
    if (enteredNumber) {
        // Normalize both
        const cleanExtracted = normalizeNumber(extractedNumber);
        const cleanEntered = normalizeNumber(enteredNumber);

        if (cleanExtracted && cleanExtracted === cleanEntered) {
            // Perfect match - No penalty
        } else {
            confidenceScore -= 30; // Updated penalty for mismatch
            riskFactors.push(`Mismatch: OCR found '${extractedNumber}' vs User '${enteredNumber}'`);
        }
    } else if (!extractedNumber) {
        confidenceScore -= 40; // No number found at all
        riskFactors.push('Document number extraction failed');
    }

    // Cap score at 0
    if (confidenceScore < 0) confidenceScore = 0;

    // Determine Status
    if (confidenceScore >= 80) { // Updated threshold to >=
        validationStatus = 'VALID';
    } else if (confidenceScore > 50) {
        validationStatus = 'PENDING'; // Needs review
    } else {
        validationStatus = 'INVALID';
    }
    
    // --- 4. Sync with Application Model ---
    const Application = require('../models/Application');
    let application = await Application.findOne({ userId: req.user.userId });
    
    if (application) {
        if (!application.kyc) application.kyc = {};
        
        if (documentType === 'PAN') {
            application.kyc.panNumber = extractedNumber || enteredNumber; // Fallback to entered if OCR failed but user insists? (Risk logic applies)
            application.kyc.panConfidenceScore = confidenceScore;
            application.kyc.panStatus = validationStatus;
        } else if (documentType === 'AADHAAR') {
             application.kyc.aadhaarNumber = extractedNumber || enteredNumber;
             application.kyc.aadhaarConfidenceScore = confidenceScore;
             application.kyc.aadhaarStatus = validationStatus;
        }
        await application.save();
    }

    // Save Record
    const newKYC = new KYC({
    userId: req.user.userId,
      documentType,
      filePath,
      extractedText: text, // Save raw text for debugging? Or cleaner.
      extractedNumber,
      confidenceScore,
      validationStatus
    });

    await newKYC.save();

    res.json({
      success: true,
      data: {
        documentDetected: documentType,
        extractedNumber,
        confidenceScore,
        validationStatus,
        riskFactors
      }
    });

  } catch (error) {
    console.error("KYC Upload Error:", error);
    res.status(500).json({ success: false, message: 'Server error processing document' });
  }
};
