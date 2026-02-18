export interface MockApplication {
  id: string;
  name: string;
  mobile: string;
  accountType: string;
  status: 'approved' | 'pending' | 'rejected' | 'escalated';
  riskScore: number;
  riskCategory: 'Low' | 'Medium' | 'High';
  submittedAt: string;
  panVerified: boolean;
  aadhaarVerified: boolean;
  isPEP: boolean;
  aiDecision: string;
  humanDecision?: string;
  riskFactors: string[];
}

export const mockApplications: MockApplication[] = [
  {
    id: 'APP-2025-001', name: 'Rajesh Kumar Singh', mobile: '9876543210',
    accountType: 'Savings', status: 'approved', riskScore: 25, riskCategory: 'Low',
    submittedAt: '2025-02-15 10:30', panVerified: true, aadhaarVerified: true,
    isPEP: false, aiDecision: 'Auto-Approved', riskFactors: ['PAN Verified', 'Aadhaar Verified'],
  },
  {
    id: 'APP-2025-002', name: 'Priya Sharma', mobile: '9988776655',
    accountType: 'Salary', status: 'approved', riskScore: 18, riskCategory: 'Low',
    submittedAt: '2025-02-15 11:15', panVerified: true, aadhaarVerified: true,
    isPEP: false, aiDecision: 'Auto-Approved', riskFactors: [],
  },
  {
    id: 'APP-2025-003', name: 'Amit Patel', mobile: '9123456789',
    accountType: 'Current', status: 'pending', riskScore: 55, riskCategory: 'Medium',
    submittedAt: '2025-02-15 12:00', panVerified: true, aadhaarVerified: false,
    isPEP: false, aiDecision: 'Manual Review', riskFactors: ['Aadhaar pending', 'Self-employed'],
  },
  {
    id: 'APP-2025-004', name: 'Sunita Devi', mobile: '9012345678',
    accountType: 'Savings', status: 'escalated', riskScore: 78, riskCategory: 'High',
    submittedAt: '2025-02-14 09:45', panVerified: true, aadhaarVerified: true,
    isPEP: true, aiDecision: 'Escalated to Officer',
    humanDecision: 'Under Review',
    riskFactors: ['Politically Exposed Person', 'High income declaration', 'Address discrepancy'],
  },
  {
    id: 'APP-2025-005', name: 'Mohammed Irfan', mobile: '9345678901',
    accountType: 'Savings', status: 'approved', riskScore: 32, riskCategory: 'Low',
    submittedAt: '2025-02-14 14:20', panVerified: true, aadhaarVerified: true,
    isPEP: false, aiDecision: 'Auto-Approved', riskFactors: [],
  },
  {
    id: 'APP-2025-006', name: 'Vikram Malhotra', mobile: '9567890123',
    accountType: 'Current', status: 'rejected', riskScore: 88, riskCategory: 'High',
    submittedAt: '2025-02-13 16:30', panVerified: false, aadhaarVerified: true,
    isPEP: false, aiDecision: 'Rejected',
    humanDecision: 'Confirmed Rejection',
    riskFactors: ['PAN verification failed', 'AML watchlist match', 'Income-employment mismatch'],
  },
  {
    id: 'APP-2025-007', name: 'Deepa Krishnan', mobile: '9678901234',
    accountType: 'Salary', status: 'pending', riskScore: 45, riskCategory: 'Medium',
    submittedAt: '2025-02-13 11:10', panVerified: true, aadhaarVerified: true,
    isPEP: false, aiDecision: 'Manual Review', riskFactors: ['NRI applicant', 'Tax residency unclear'],
  },
  {
    id: 'APP-2025-008', name: 'Arjun Reddy', mobile: '9789012345',
    accountType: 'Savings', status: 'approved', riskScore: 20, riskCategory: 'Low',
    submittedAt: '2025-02-12 08:50', panVerified: true, aadhaarVerified: true,
    isPEP: false, aiDecision: 'Auto-Approved', riskFactors: [],
  },
];

export const dashboardStats = {
  total: mockApplications.length,
  approved: mockApplications.filter(a => a.status === 'approved').length,
  pending: mockApplications.filter(a => a.status === 'pending').length,
  rejected: mockApplications.filter(a => a.status === 'rejected').length,
  escalated: mockApplications.filter(a => a.status === 'escalated').length,
  lowRisk: mockApplications.filter(a => a.riskCategory === 'Low').length,
  mediumRisk: mockApplications.filter(a => a.riskCategory === 'Medium').length,
  highRisk: mockApplications.filter(a => a.riskCategory === 'High').length,
};
