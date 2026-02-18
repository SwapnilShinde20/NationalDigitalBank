import type { OnboardingFormData } from '@/context/OnboardingContext';

interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

export const calculateRiskScore = (data: OnboardingFormData): {
  score: number;
  category: 'Low' | 'Medium' | 'High';
  factors: RiskFactor[];
} => {
  const factors: RiskFactor[] = [];
  let score = 30; // Base score

  // Income check
  if (['below-1l', '1l-2.5l'].includes(data.annualIncome)) {
    factors.push({ factor: 'Low Income', impact: 15, description: 'Annual income below standard threshold for selected account type' });
    score += 15;
  }

  // PEP check
  if (data.isPEP) {
    factors.push({ factor: 'Politically Exposed Person', impact: 25, description: 'Applicant declared as PEP — enhanced due diligence required' });
    score += 25;
  }

  // NRI check
  if (data.residencyStatus === 'nri') {
    factors.push({ factor: 'NRI Applicant', impact: 10, description: 'Non-resident Indian — additional compliance checks needed' });
    score += 10;
  }

  // Employment check
  if (['unemployed', 'self-employed'].includes(data.employmentType)) {
    factors.push({ factor: 'Employment Status', impact: 10, description: 'Non-salaried employment — income verification required' });
    score += 10;
  }

  // Address mismatch
  if (!data.sameAsCurrent && data.permanentPincode && data.currentPincode !== data.permanentPincode) {
    factors.push({ factor: 'Address Discrepancy', impact: 5, description: 'Current and permanent address differ — additional verification may apply' });
    score += 5;
  }

  // Age check
  if (data.dob) {
    const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
    if (age < 21 || age > 65) {
      factors.push({ factor: 'Age Factor', impact: 5, description: `Applicant age ${age} — outside standard range (21-65)` });
      score += 5;
    }
  }

  // Add some positive factors
  if (data.panVerified) {
    factors.push({ factor: 'PAN Verified', impact: -5, description: 'PAN card successfully verified via AI OCR' });
    score -= 5;
  }
  if (data.aadhaarVerified) {
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
  return { passed: anomalies.length === 0, anomalies };
};

export const generateAccountNumber = (): string => {
  const prefix = '2025';
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${random}`;
};
