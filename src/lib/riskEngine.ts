import type { OnboardingFormData } from '@/context/OnboardingContext';

interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

/**
 * Simple word-overlap name similarity (0–100%).
 */
function nameSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 100; // No data to compare = no penalty
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  const words1 = normalize(name1);
  const words2 = normalize(name2);
  if (words1.length === 0 || words2.length === 0) return 100;
  const set2 = new Set(words2);
  let matches = 0;
  for (const w of words1) {
    if (set2.has(w)) matches++;
  }
  return Math.round((matches / Math.max(words1.length, words2.length)) * 100);
}

/**
 * Compare two dates loosely (same calendar day).
 */
function dobMatch(dob1: string, dob2: string): boolean {
  if (!dob1 || !dob2) return true; // No data = no penalty
  const d1 = new Date(dob1);
  const d2 = new Date(dob2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export const calculateRiskScore = (data: OnboardingFormData): {
  score: number;
  category: 'Low' | 'Medium' | 'High';
  factors: RiskFactor[];
} => {
  const factors: RiskFactor[] = [];
  let score = 30; // Base score

  // ── 1. Identity Mismatch — Critical (up to +70) ──
  const hasIdentityMismatch = data.identityMismatch === true;

  // Also do client-side name/DOB comparison as a backup
  let nameMatch = true;
  let dobOk = true;

  if (data.panExtractedName && data.fullName) {
    const sim = nameSimilarity(data.fullName, data.panExtractedName);
    if (sim < 70) {
      nameMatch = false;
      factors.push({
        factor: 'PAN Name Mismatch',
        impact: 35,
        description: `Name on PAN "${data.panExtractedName}" doesn't match entered name "${data.fullName}" (${sim}% similarity)`,
      });
      score += 35;
    }
  }

  if (data.aadhaarExtractedName && data.fullName) {
    const sim = nameSimilarity(data.fullName, data.aadhaarExtractedName);
    if (sim < 70) {
      nameMatch = false;
      factors.push({
        factor: 'Aadhaar Name Mismatch',
        impact: 35,
        description: `Name on Aadhaar "${data.aadhaarExtractedName}" doesn't match entered name "${data.fullName}" (${sim}% similarity)`,
      });
      score += 35;
    }
  }

  if (data.panExtractedDOB && data.dob) {
    if (!dobMatch(data.dob, data.panExtractedDOB)) {
      dobOk = false;
      factors.push({
        factor: 'PAN DOB Mismatch',
        impact: 25,
        description: `DOB on PAN "${data.panExtractedDOB}" doesn't match entered DOB "${data.dob}"`,
      });
      score += 25;
    }
  }

  if (data.aadhaarExtractedDOB && data.dob) {
    if (!dobMatch(data.dob, data.aadhaarExtractedDOB)) {
      dobOk = false;
      factors.push({
        factor: 'Aadhaar DOB Mismatch',
        impact: 25,
        description: `DOB on Aadhaar "${data.aadhaarExtractedDOB}" doesn't match entered DOB "${data.dob}"`,
      });
      score += 25;
    }
  }

  // Backend flagged identity mismatch but client didn't catch it (fallback)
  if (hasIdentityMismatch && nameMatch && dobOk) {
    factors.push({
      factor: 'Identity Verification Failed',
      impact: 40,
      description: 'Backend detected identity mismatch between documents and personal information',
    });
    score += 40;
  }

  // ── 2. Income check ──
  if (['below-1l', '1l-2.5l'].includes(data.annualIncome)) {
    factors.push({ factor: 'Low Income', impact: 15, description: 'Annual income below standard threshold for selected account type' });
    score += 15;
  }

  // ── 3. PEP check ──
  if (data.isPEP) {
    factors.push({ factor: 'Politically Exposed Person', impact: 25, description: 'Applicant declared as PEP — enhanced due diligence required' });
    score += 25;
  }

  // ── 4. NRI check ──
  if (data.residencyStatus === 'nri') {
    factors.push({ factor: 'NRI Applicant', impact: 10, description: 'Non-resident Indian — additional compliance checks needed' });
    score += 10;
  }

  // ── 5. Employment check ──
  if (['unemployed', 'self-employed'].includes(data.employmentType)) {
    factors.push({ factor: 'Employment Status', impact: 10, description: 'Non-salaried employment — income verification required' });
    score += 10;
  }

  // ── 6. Address mismatch ──
  if (!data.sameAsCurrent && data.permanentPincode && data.currentPincode !== data.permanentPincode) {
    factors.push({ factor: 'Address Discrepancy', impact: 5, description: 'Current and permanent address differ — additional verification may apply' });
    score += 5;
  }

  // ── 7. Age check ──
  if (data.dob) {
    const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
    if (age < 21 || age > 65) {
      factors.push({ factor: 'Age Factor', impact: 5, description: `Applicant age ${age} — outside standard range (21-65)` });
      score += 5;
    }
  }

  // ── Positive factors ──
  if (data.panVerified && nameMatch) {
    factors.push({ factor: 'PAN Verified', impact: -5, description: 'PAN card successfully verified via AI OCR' });
    score -= 5;
  }
  if (data.aadhaarVerified && nameMatch) {
    factors.push({ factor: 'Aadhaar Verified', impact: -5, description: 'Aadhaar verified through UIDAI database' });
    score -= 5;
  }

  score = Math.max(10, Math.min(100, score));

  const category = score <= 40 ? 'Low' : score <= 70 ? 'Medium' : 'High';
  return { score, category, factors };
};

export const checkAML = (name: string): { cleared: boolean; flags: string[] } => {
  const watchlist = ['john doe', 'test user', 'suspicious person'];
  const isOnList = watchlist.some(w => name.toLowerCase().includes(w));
  return {
    cleared: !isOnList,
    flags: isOnList ? ['Name matches AML watchlist entry', 'Manual review required'] : [],
  };
};

export const checkFraud = (data: OnboardingFormData): { passed: boolean; anomalies: string[] } => {
  const anomalies: string[] = [];
  if (data.mobileNumber && data.mobileNumber.startsWith('0000')) {
    anomalies.push('Suspicious phone number pattern');
  }
  if (data.annualIncome === 'above-50l' && data.employmentType === 'unemployed') {
    anomalies.push('Income-employment mismatch detected');
  }
  // Identity mismatch = fraud anomaly
  if (data.identityMismatch) {
    anomalies.push('Identity mismatch detected — possible fraudulent application');
  }
  return { passed: anomalies.length === 0, anomalies };
};

export const generateAccountNumber = (): string => {
  const prefix = '2025';
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${random}`;
};
