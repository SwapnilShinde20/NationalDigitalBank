import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import api from '@/api/axios';

export const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Eligibility', desc: 'Account type & consent' },
  { id: 'verification', title: 'Verification', desc: 'Mobile & email OTP' },
  { id: 'personal', title: 'Personal Info', desc: 'Identity details' },
  { id: 'address', title: 'Address', desc: 'Residential details' },
  { id: 'kyc', title: 'KYC', desc: 'Document verification' },
  { id: 'employment', title: 'Employment', desc: 'Financial details' },
  { id: 'risk', title: 'Risk Profile', desc: 'AML screening' },
  { id: 'nominee', title: 'Nominee', desc: 'Nominee details' },
  { id: 'services', title: 'Services', desc: 'Banking services' },
  { id: 'review', title: 'Review', desc: 'Application summary' },
  { id: 'validation', title: 'AI Validation', desc: 'Final checks' },
  { id: 'activation', title: 'Activation', desc: 'Account ready' },
];

export interface OnboardingFormData {
  accountType: string;
  residencyStatus: string;
  termsAccepted: boolean;
  dataConsent: boolean;
  mobileNumber: string;
  otpVerified: boolean;
  email: string;
  emailVerified: boolean;
  fullName: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  fatherName: string;
  motherName: string;
  occupation: string;
  annualIncome: string;
  currentAddressLine1: string;
  currentAddressLine2: string;
  currentCity: string;
  currentState: string;
  currentPincode: string;
  sameAsCurrent: boolean;
  permanentAddressLine1: string;
  permanentAddressLine2: string;
  permanentCity: string;
  permanentState: string;
  permanentPincode: string;
  panNumber: string;
  aadhaarNumber: string;
  panVerified: boolean;
  aadhaarVerified: boolean;
  faceVerified: boolean;
  employmentType: string;
  employerName: string;
  sourceOfIncome: string;
  isPEP: boolean;
  taxResidency: string;
  riskScore: number;
  riskCategory: string;
  amlCleared: boolean;
  fraudCheckPassed: boolean;
  riskFactors: string[];
  nomineeName: string;
  nomineeRelationship: string;
  nomineeDOB: string;
  nomineeAddress: string;
  debitCardType: string;
  internetBanking: boolean;
  smsAlerts: boolean;
  chequeBook: boolean;
  upiActivation: boolean;
  digitalSignatureConsent: boolean;
  accountNumber: string;
  panStatus?: string;
  aadhaarStatus?: string;
}

const defaultFormData: OnboardingFormData = {
  accountType: '', residencyStatus: 'resident', termsAccepted: false, dataConsent: false,
  mobileNumber: '', otpVerified: false, email: '', emailVerified: false,
  fullName: '', dob: '', gender: '', maritalStatus: '', fatherName: '', motherName: '',
  occupation: '', annualIncome: '',
  currentAddressLine1: '', currentAddressLine2: '', currentCity: '', currentState: '',
  currentPincode: '', sameAsCurrent: false,
  permanentAddressLine1: '', permanentAddressLine2: '', permanentCity: '', permanentState: '',
  permanentPincode: '',
  panNumber: '', aadhaarNumber: '', panVerified: false, aadhaarVerified: false, faceVerified: false,
  employmentType: '', employerName: '', sourceOfIncome: '', isPEP: false, taxResidency: 'India',
  riskScore: 0, riskCategory: '', amlCleared: false, fraudCheckPassed: false, riskFactors: [],
  nomineeName: '', nomineeRelationship: '', nomineeDOB: '', nomineeAddress: '',
  debitCardType: 'classic', internetBanking: true, smsAlerts: true, chequeBook: false, upiActivation: true,
  digitalSignatureConsent: false, accountNumber: '',
};

interface OnboardingContextType {
  currentStep: number;
  formData: OnboardingFormData;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  completedSteps: Set<number>;
  markComplete: (step: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(defaultFormData);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Load initial data from Application API
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await api.get('/application/me');
        if (res.data?.success && res.data.application) {
           const app = res.data.application;
           const clean = (obj: any) => {
               if (!obj || typeof obj !== 'object') return {};
               return Object.fromEntries(
                   Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
               );
           };
           
           // Map Application schema → flat formData
           const mapped: Partial<OnboardingFormData> = {
               // Eligibility
               ...(app.eligibility?.accountType ? { accountType: app.eligibility.accountType } : {}),
               ...(app.eligibility?.residencyStatus ? { residencyStatus: app.eligibility.residencyStatus } : {}),
               ...(app.eligibility?.consentGiven ? { termsAccepted: true, dataConsent: true } : {}),
               // Verification
               ...(app.verification?.mobile ? { mobileNumber: app.verification.mobile } : {}),
               ...(app.verification?.mobileVerified ? { otpVerified: true } : {}),
               ...(app.verification?.email ? { email: app.verification.email } : {}),
               ...(app.verification?.emailVerified ? { emailVerified: true } : {}),
               // Personal Info
               ...clean(app.personalInfo),
               // Address
               ...(app.address?.currentAddress ? {
                   currentAddressLine1: app.address.currentAddress.line1 || '',
                   currentAddressLine2: app.address.currentAddress.line2 || '',
                   currentCity: app.address.currentAddress.city || '',
                   currentState: app.address.currentAddress.state || '',
                   currentPincode: app.address.currentAddress.pinCode || '',
               } : {}),
               ...(app.address?.permanentAddress ? {
                   permanentAddressLine1: app.address.permanentAddress.line1 || '',
                   permanentAddressLine2: app.address.permanentAddress.line2 || '',
                   permanentCity: app.address.permanentAddress.city || '',
                   permanentState: app.address.permanentAddress.state || '',
                   permanentPincode: app.address.permanentAddress.pinCode || '',
               } : {}),
               // KYC
               ...(app.kyc?.panNumber ? { panNumber: app.kyc.panNumber } : {}),
               ...(app.kyc?.aadhaarNumber ? { aadhaarNumber: app.kyc.aadhaarNumber } : {}),
               ...(app.kyc?.panStatus === 'VALID' ? { panVerified: true } : {}),
               ...(app.kyc?.aadhaarStatus === 'VALID' ? { aadhaarVerified: true } : {}),
               // Employment
               ...(app.employment ? {
                   employmentType: app.employment.employmentType || '',
                   employerName: app.employment.employerName || '',
                   sourceOfIncome: app.employment.sourceOfIncome || '',
                   taxResidency: app.employment.taxResidency || 'India',
                   isPEP: app.employment.pepDeclaration || false,
               } : {}),
               // Risk
               ...(app.riskProfile ? {
                   riskScore: app.riskProfile.riskScore || 0,
                   riskCategory: app.riskProfile.riskLevel || '',
                   amlCleared: app.riskProfile.amlStatus === 'CLEAR',
                   fraudCheckPassed: app.riskProfile.fraudStatus === 'CLEAR',
                   riskFactors: app.riskProfile.riskFactors || [],
               } : {}),
               // Nominee
               ...(app.nominee ? {
                   nomineeName: app.nominee.fullName || '',
                   nomineeRelationship: app.nominee.relationship || '',
                   nomineeDOB: app.nominee.dob || '',
                   nomineeAddress: app.nominee.address || '',
               } : {}),
               // Services
               ...(app.services ? {
                   debitCardType: app.services.debitCardType || 'classic',
                   internetBanking: app.services.internetBanking ?? true,
                   smsAlerts: app.services.smsAlerts ?? true,
                   chequeBook: app.services.chequeBook ?? false,
                   upiActivation: app.services.upiActivation ?? true,
               } : {}),
               // Account
               ...(app.accountDetails?.accountNumber ? { accountNumber: app.accountDetails.accountNumber } : {}),
           };

           setFormData(prev => ({ ...prev, ...mapped }));
           
           // Restore step progress
           if (app.currentStep && app.currentStep > 0) {
               setCurrentStep(app.currentStep - 1); // Backend is 1-indexed, frontend is 0-indexed
           }
        }
      } catch (err: any) {
        console.log("Session init: No active application found or new user.");
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
        }
      }
    };
    loadData();
  }, []);

  // Determine which Application step a set of formData keys maps to
  const getStepMapping = (keys: string[]): { stepName: string; data: any } | null => {
      const merged = { ...formData }; // Use latest formData for complete picture
      
      const eligibilityKeys = ['accountType', 'residencyStatus', 'termsAccepted', 'dataConsent'];
      const personalKeys = ['fullName', 'dob', 'gender', 'maritalStatus', 'fatherName', 'motherName', 'occupation', 'annualIncome'];
      const addressKeys = ['currentAddressLine1', 'currentAddressLine2', 'currentCity', 'currentState', 'currentPincode',
                           'permanentAddressLine1', 'permanentAddressLine2', 'permanentCity', 'permanentState', 'permanentPincode'];
      const kycKeys = ['panNumber', 'aadhaarNumber', 'panStatus', 'aadhaarStatus'];
      const verificationKeys = ['mobileNumber', 'email', 'otpVerified', 'emailVerified'];
      const employmentKeys = ['employmentType', 'employerName', 'sourceOfIncome', 'isPEP', 'taxResidency'];
      const riskKeys = ['riskScore', 'riskCategory', 'riskFactors', 'amlCleared', 'fraudCheckPassed'];
      const nomineeKeys = ['nomineeName', 'nomineeRelationship', 'nomineeDOB', 'nomineeAddress'];
      const serviceKeys = ['debitCardType', 'internetBanking', 'smsAlerts', 'chequeBook', 'upiActivation'];

      if (keys.some(k => eligibilityKeys.includes(k))) {
          return { stepName: 'eligibility', data: {
              accountType: merged.accountType,
              residencyStatus: merged.residencyStatus,
              consentGiven: merged.termsAccepted && merged.dataConsent,
          }};
      }
      if (keys.some(k => verificationKeys.includes(k))) {
          return { stepName: 'verification', data: {
              mobile: merged.mobileNumber,
              email: merged.email,
              mobileVerified: merged.otpVerified,
              emailVerified: merged.emailVerified
          }};
      }
      if (keys.some(k => personalKeys.includes(k))) {
          return { stepName: 'personalInfo', data: {
              fullName: merged.fullName, dob: merged.dob, gender: merged.gender,
              maritalStatus: merged.maritalStatus, fatherName: merged.fatherName,
              motherName: merged.motherName, occupation: merged.occupation, annualIncome: merged.annualIncome,
          }};
      }
      if (keys.some(k => addressKeys.includes(k))) {
          return { stepName: 'address', data: {
              currentAddress: { line1: merged.currentAddressLine1, line2: merged.currentAddressLine2, city: merged.currentCity, state: merged.currentState, pinCode: merged.currentPincode },
              permanentAddress: { line1: merged.permanentAddressLine1, line2: merged.permanentAddressLine2, city: merged.permanentCity, state: merged.permanentState, pinCode: merged.permanentPincode },
          }};
      }
      if (keys.some(k => kycKeys.includes(k))) {
          return { stepName: 'kyc', data: {
              panNumber: merged.panNumber,
              aadhaarNumber: merged.aadhaarNumber,
              panStatus: merged.panStatus,
              aadhaarStatus: merged.aadhaarStatus,
          }};
      }
      if (keys.some(k => employmentKeys.includes(k))) {
          return { stepName: 'employment', data: {
              employmentType: merged.employmentType, employerName: merged.employerName,
              sourceOfIncome: merged.sourceOfIncome, taxResidency: merged.taxResidency,
              pepDeclaration: merged.isPEP,
          }};
      }
      if (keys.some(k => riskKeys.includes(k))) {
          return { stepName: 'riskProfile', data: {
              riskScore: merged.riskScore,
              riskLevel: merged.riskCategory,
              riskFactors: merged.riskFactors,
              amlStatus: merged.amlCleared ? 'Cleared' : 'Flagged',
              fraudStatus: merged.fraudCheckPassed ? 'Passed' : 'Marked'
          }};
      }
      if (keys.some(k => nomineeKeys.includes(k))) {
          return { stepName: 'nominee', data: {
              fullName: merged.nomineeName, relationship: merged.nomineeRelationship,
              dob: merged.nomineeDOB, address: merged.nomineeAddress,
          }};
      }
      if (keys.some(k => serviceKeys.includes(k))) {
          return { stepName: 'services', data: {
              debitCardType: merged.debitCardType, internetBanking: merged.internetBanking,
              smsAlerts: merged.smsAlerts, chequeBook: merged.chequeBook, upiActivation: merged.upiActivation,
          }};
      }
      return null;
  };

  // Check if an object has any non-empty real values (deep check)
  const hasRealData = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;
      return Object.values(obj).some(v => {
          if (v === undefined || v === null || v === '' || v === false) return false;
          if (typeof v === 'object' && !Array.isArray(v)) return hasRealData(v);
          return true;
      });
  };

  const syncCurrentStep = async (stepIndex: number) => {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Map step index to stepName
      const stepMap: Record<number, string[]> = {
          0: ['accountType', 'residencyStatus', 'termsAccepted'],
          1: ['mobileNumber', 'email', 'otpVerified'],
          2: ['fullName', 'dob', 'gender'],
          3: ['currentAddressLine1', 'currentCity'],
          4: ['panNumber', 'aadhaarNumber'],
          5: ['employmentType', 'employerName'],
          6: ['riskScore', 'riskCategory'],
          7: ['nomineeName', 'nomineeRelationship'],
          8: ['debitCardType', 'internetBanking'],
      };

      const keys = stepMap[stepIndex];
      if (!keys) return; // Steps like verification/KYC sync via their own endpoints

      try {
          const mapping = getStepMapping(keys);
          if (!mapping) return;

          // Skip if all data values are empty
          if (!hasRealData(mapping.data)) {
              console.log(`Skipping sync for step ${mapping.stepName}: no real data`);
              return;
          }

          await api.put('/application/update-step', {
              stepName: mapping.stepName,
              data: mapping.data,
              currentStep: stepIndex + 1,
          });
          console.log(`Synced step: ${mapping.stepName}`);
      } catch (err) {
          console.error('Failed to sync to Application API', err);
      }
  };

  const updateFormData = useCallback((data: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const markComplete = useCallback((step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  const nextStep = useCallback(() => {
    // Sync current step data to backend BEFORE advancing
    syncCurrentStep(currentStep);
    markComplete(currentStep);
    setCurrentStep(prev => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
  }, [currentStep, markComplete, formData]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < ONBOARDING_STEPS.length) setCurrentStep(step);
  }, []);

  return (
    <OnboardingContext.Provider value={{ currentStep, formData, updateFormData, nextStep, prevStep, goToStep, completedSteps, markComplete }}>
      {children}
    </OnboardingContext.Provider>
  );
};
