const Tesseract = require('tesseract.js');
const fs = require('fs');
const KYC = require('../models/KYC');
const { validationResult } = require('express-validator');

// Regex patterns
const PAN_REGEX = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
const AADHAAR_REGEX = /\d{4}\s?\d{4}\s?\d{4}/;
// Common date patterns found on Indian ID cards
const DATE_REGEX = /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/;

const normalizeNumber = (num) => {
    return num ? String(num).replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
};

/**
 * Compare two names using word-overlap similarity (0–100%).
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
  return Math.round((matches / Math.max(words1.length, words2.length)) * 100);
}

/**
 * Compare two dates loosely (same day).
 */
function dobMatch(dob1, dob2) {
  if (!dob1 || !dob2) return false;
  const d1 = new Date(dob1);
  const d2 = new Date(dob2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Extract the cardholder name from OCR text of an Indian ID card.
 * 
 * Strategy: Label-based positional extraction.
 * Indian ID cards follow a predictable layout:
 *   PAN:     "नाम / Name" → CARDHOLDER NAME → "Father's Name" → FATHER NAME
 *   Aadhaar: "Name" → CARDHOLDER NAME → "DOB" → ...  → "Address" → ...
 * 
 * 1. Find the "NAME" label line (contains "NAME" but NOT "FATHER")
 * 2. Take the NEXT line that looks like a name (all-caps, 2-5 words, each ≥3 chars)
 * 3. Stop before FATHER / DOB / ADDRESS labels
 * 4. Fallback: heuristic scoring if no label found
 */
function extractNameFromText(text, docType) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Keywords that indicate we've gone past the name section
  const stopKeywords = ['FATHER', 'DOB', 'DATE OF BIRTH', 'ADDRESS', 'SIGNATURE'];
  
  // Keywords that should never be part of a name
  const rejectKeywords = [
    'INCOME', 'GOVERNMENT', 'INDIA', 'DEPARTMENT', 'PERMANENT',
    'ACCOUNT', 'NUMBER', 'CARD', 'UNIQUE', 'IDENTIFICATION',
    'AUTHORITY', 'UIDAI', 'DOWNLOAD', 'PRINT', 'REPUBLIC',
    'TAX', 'APPLICATION', 'VALID', 'SIGNED', 'HELP',
    'STATE', 'DISTRICT', 'VILLAGE', 'TOWN', 'CITY', 'PINCODE', 'POST',
    // Indian state names (common OCR matches from address section)
    'MAHARASHTRA', 'KARNATAKA', 'GUJARAT', 'RAJASTHAN', 'KERALA',
    'TAMIL', 'NADU', 'PRADESH', 'BENGAL', 'PUNJAB', 'HARYANA',
    'BIHAR', 'ODISHA', 'ASSAM', 'JHARKHAND', 'CHHATTISGARH',
    'UTTARAKHAND', 'TELANGANA', 'ANDHRA', 'MANIPUR', 'TRIPURA',
    'MEGHALAYA', 'NAGALAND', 'MIZORAM', 'SIKKIM', 'DELHI', 'MUMBAI',
  ];

  /**
   * Check if a line looks like a person's name
   */
  function isNameLike(line) {
    const clean = line.replace(/[^A-Z\s]/g, '').trim();
    if (!clean || clean.length < 6) return null;
    
    const words = clean.split(/\s+/).filter(w => w.length >= 3);
    if (words.length < 2) return null;
    if (!words.every(w => /^[A-Z]+$/.test(w))) return null;
    
    // Indian names are 2-3 words (First [Middle] Last); trim extra OCR noise
    const nameWords = words.slice(0, 3);
    
    // Reject if any word is a known non-name keyword
    for (const word of nameWords) {
      if (rejectKeywords.includes(word)) return null;
    }
    
    // Average word length should be >= 4 (real names, not noise)
    const avgLen = nameWords.reduce((s, w) => s + w.length, 0) / nameWords.length;
    if (avgLen < 4) return null;
    
    return nameWords.join(' ');
  }

  // ── Strategy 1: Label-based extraction ──
  // Find a line containing "NAME" (but not "FATHER") and take the next name-like line
  let foundNameLabel = false;
  
  for (let i = 0; i < lines.length; i++) {
    const upper = lines[i].toUpperCase();
    
    // Check if this line is a "Name" label (contains NAME but not FATHER)
    if (!foundNameLabel) {
      if ((upper.includes('NAME') || upper.includes('NAM')) && !upper.includes('FATHER')) {
        foundNameLabel = true;
        console.log(`[OCR] Found NAME label at line ${i}: "${lines[i]}"`);
        
        // The name might be on this SAME line (e.g., "Name SWAPNIL SANTOSH SHINDE")
        // Try extracting after removing "Name" / "नाम" parts
        const afterLabel = upper.replace(/.*NAME\s*/i, '').trim();
        if (afterLabel) {
          const candidate = isNameLike(afterLabel);
          if (candidate) {
            console.log(`[OCR] Extracted name from label line: "${candidate}"`);
            return candidate;
          }
        }
        continue;
      }
    }
    
    // After finding the NAME label, look for the actual name on subsequent lines
    if (foundNameLabel) {
      // Stop if we hit a section separator
      if (stopKeywords.some(kw => upper.includes(kw))) {
        console.log(`[OCR] Hit stop keyword at line ${i}: "${lines[i]}" — stopping`);
        break;
      }
      
      const candidate = isNameLike(upper);
      if (candidate) {
        console.log(`[OCR] Extracted name after label: "${candidate}" (line ${i})`);
        return candidate;
      }
    }
  }

  // ── Strategy 2: Fallback — first name-like line before FATHER/DOB/ADDRESS ──
  if (!foundNameLabel) {
    console.log(`[OCR] No NAME label found, using fallback heuristic`);
    for (const line of lines) {
      const upper = line.toUpperCase();
      if (stopKeywords.some(kw => upper.includes(kw))) break;
      
      const candidate = isNameLike(upper);
      if (candidate) {
        console.log(`[OCR] Fallback extracted name: "${candidate}"`);
        return candidate;
      }
    }
  }

  console.log(`[OCR] Could not extract name from OCR text`);
  return null;
}

/**
 * Extract a date from OCR text (DD/MM/YYYY or DD-MM-YYYY).
 */
function extractDOBFromText(text) {
  const match = text.match(DATE_REGEX);
  if (match) {
    const day = match[1];
    const month = match[2];
    const year = match[3];
    // Basic sanity: year should be between 1920 and 2025
    const yearNum = parseInt(year, 10);
    if (yearNum < 1920 || yearNum > 2025) return null;
    return `${year}-${month}-${day}`;
  }
  return null;
}

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

    // Debug: log raw OCR text so we can see what Tesseract extracts
    console.log(`[OCR DEBUG] ${documentType} raw text (first 500 chars):\n`, text.substring(0, 500));
    console.log(`[OCR DEBUG] ${documentType} uppercase text (first 500 chars):\n`, extractedText.substring(0, 500));

    // --- 3. Validation Logic ---
    let confidenceScore = 100;
    let extractedNumber = null;
    let validationStatus = 'PENDING';
    let riskFactors = [];

    // Extracted identity data
    let extractedName = null;
    let extractedDOB = null;

    // Reduce score for blurriness
    if (isBlurry) {
      confidenceScore -= 20;
      riskFactors.push('Image quality is low/blurry');
    }

    // Document Type Logic
    if (documentType === 'PAN') {
      const match = extractedText.match(PAN_REGEX);
      if (match) {
        extractedNumber = match[0];
      } else {
        confidenceScore -= 20;
        riskFactors.push('PAN number pattern not found');
      }

      if (!extractedText.includes('INCOME TAX DEPARTMENT')) {
        confidenceScore -= 10; 
        riskFactors.push('INCOME TAX DEPARTMENT keyword missing');
      }

      // Extract name & DOB from PAN card OCR text
      extractedName = extractNameFromText(extractedText, 'PAN');
      extractedDOB = extractDOBFromText(text);
      console.log(`[OCR Result] PAN — Extracted Name: "${extractedName}", Extracted DOB: "${extractedDOB}"`);

    } else if (documentType === 'AADHAAR') {
      const match = extractedText.match(AADHAAR_REGEX);
      if (match) {
        extractedNumber = match[0];
      } else {
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

      // Extract name & DOB from Aadhaar card OCR text
      extractedName = extractNameFromText(extractedText, 'AADHAAR');
      extractedDOB = extractDOBFromText(text);
      console.log(`[OCR Result] AADHAAR — Extracted Name: "${extractedName}", Extracted DOB: "${extractedDOB}"`);
    }

    // Compare with Entered Number (Normalization)
    if (enteredNumber) {
        const cleanExtracted = normalizeNumber(extractedNumber);
        const cleanEntered = normalizeNumber(enteredNumber);

        if (cleanExtracted && cleanExtracted === cleanEntered) {
            // Perfect match - No penalty
        } else {
            confidenceScore -= 30;
            riskFactors.push(`Mismatch: OCR found '${extractedNumber}' vs User '${enteredNumber}'`);
        }
    } else if (!extractedNumber) {
        confidenceScore -= 40;
        riskFactors.push('Document number extraction failed');
    }

    // --- 3b. Identity Matching (Name & DOB) ---
    const Application = require('../models/Application');
    let application = await Application.findOne({ userId: req.user.userId });

    let identityMismatchDetected = false;

    if (application && application.personalInfo) {
      const userFullName = application.personalInfo.fullName || '';
      const userDOB = application.personalInfo.dob || '';

      // Name matching
      if (extractedName && userFullName) {
        const similarity = nameSimilarity(userFullName, extractedName);
        console.log(`[Identity Check] Name similarity: ${similarity}% — OCR: "${extractedName}" vs User: "${userFullName}"`);
        if (similarity < 70) {
          confidenceScore -= 50;
          riskFactors.push(`Name mismatch (${similarity}% match): Document shows "${extractedName}" but user entered "${userFullName}"`);
          identityMismatchDetected = true;
        }
      }

      // DOB matching
      if (extractedDOB && userDOB) {
        const matches = dobMatch(userDOB, extractedDOB);
        console.log(`[Identity Check] DOB match: ${matches} — OCR: "${extractedDOB}" vs User: "${userDOB}"`);
        if (!matches) {
          confidenceScore -= 30;
          riskFactors.push(`DOB mismatch: Document shows "${extractedDOB}" but user entered "${new Date(userDOB).toISOString().split('T')[0]}"`);
          identityMismatchDetected = true;
        }
      }
    }

    // Cap score at 0
    if (confidenceScore < 0) confidenceScore = 0;

    // Determine Status
    if (confidenceScore >= 80) {
        validationStatus = 'VALID';
    } else if (confidenceScore > 50) {
        validationStatus = 'PENDING';
    } else {
        validationStatus = 'INVALID';
    }
    
    // --- 4. Sync with Application Model ---
    if (application) {
        if (!application.kyc) application.kyc = {};
        
        if (documentType === 'PAN') {
            application.kyc.panNumber = extractedNumber || enteredNumber;
            application.kyc.panConfidenceScore = confidenceScore;
            application.kyc.panStatus = validationStatus;
            application.kyc.panExtractedName = extractedName || '';
            application.kyc.panExtractedDOB = extractedDOB || '';
        } else if (documentType === 'AADHAAR') {
             application.kyc.aadhaarNumber = extractedNumber || enteredNumber;
             application.kyc.aadhaarConfidenceScore = confidenceScore;
             application.kyc.aadhaarStatus = validationStatus;
             application.kyc.aadhaarExtractedName = extractedName || '';
             application.kyc.aadhaarExtractedDOB = extractedDOB || '';
        }

        // Set identity mismatch flag
        if (identityMismatchDetected) {
          application.kyc.identityMismatch = true;
          application.kyc.identityVerified = false;
        } else if (!application.kyc.identityMismatch) {
          // Only set to verified if no previous mismatch was detected
          application.kyc.identityVerified = true;
        }

        application.markModified('kyc');
        await application.save();
    }

    // Save Record
    const newKYC = new KYC({
    userId: req.user.userId,
      documentType,
      filePath,
      extractedText: text,
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
        extractedName,
        extractedDOB,
        confidenceScore,
        validationStatus,
        riskFactors,
        identityMismatch: identityMismatchDetected,
      }
    });

  } catch (error) {
    console.error("KYC Upload Error:", error);
    res.status(500).json({ success: false, message: 'Server error processing document' });
  }
};

