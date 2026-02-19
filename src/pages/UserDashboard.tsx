import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/api/axios';
import {
  User, FileText, CreditCard, Shield, Clock, CheckCircle2,
  XCircle, Edit3, Send, ArrowRight, LogOut, Plus,
  Phone, Mail, MapPin, Briefcase, ChevronRight, ArrowLeft, Eye
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';

type AppStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

const statusConfig: Record<AppStatus, { label: string; color: string; textColor: string; icon: any; bg: string }> = {
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-600', icon: Clock, bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-500/40' },
  SUBMITTED: { label: 'Pending Review', color: 'bg-amber-500', textColor: 'text-amber-600', icon: Clock, bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-500/40' },
  APPROVED: { label: 'Approved', color: 'bg-green-500', textColor: 'text-green-600', icon: CheckCircle2, bg: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-500/40' },
  REJECTED: { label: 'Rejected', color: 'bg-red-500', textColor: 'text-red-600', icon: XCircle, bg: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-500/40' },
};

type View = 'home' | 'account-detail' | 'update-info';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useOnboarding();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [updateRequest, setUpdateRequest] = useState({ field: '', reason: '', newValue: '' });
  const [submitting, setSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    fetchApp();
  }, []);

  const fetchApp = async () => {
    try {
      const res = await api.get('/application/me');
      setApp(res.data.application || res.data);
    } catch (err) {
      console.error('Failed to fetch application:', err);
    }
    setLoading(false);
  };

  const handleUpdateRequest = async () => {
    if (!updateRequest.field || !updateRequest.reason) return;
    setSubmitting(true);
    try {
      await api.put('/application/update-step', {
        stepName: 'updateRequests',
        data: {
          field: updateRequest.field,
          reason: updateRequest.reason,
          newValue: updateRequest.newValue,
          requestedAt: new Date().toISOString(),
        },
      });
      setRequestSent(true);
      setUpdateRequest({ field: '', reason: '', newValue: '' });
      await fetchApp(); // Refresh data
    } catch (err) {
      console.error('Failed to submit update request:', err);
    }
    setSubmitting(false);
  };

  const logoutHandler = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const status: AppStatus = app?.status || 'IN_PROGRESS';
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const hasAccount = status === 'APPROVED' && app?.accountDetails?.accountNumber;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg banking-gradient flex items-center justify-center">
              <span className="text-white text-sm font-bold">N</span>
            </div>
            {view !== 'home' ? (
              <button onClick={() => setView('home')} className="flex items-center gap-2 text-foreground hover:text-accent transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <h1 className="text-lg font-bold">Back to Dashboard</h1>
              </button>
            ) : (
              <h1 className="text-lg font-bold text-foreground">My Dashboard</h1>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={logoutHandler}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Welcome */}
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Welcome{app?.personalInfo?.fullName ? `, ${app.personalInfo.fullName}` : ''}! 👋
                </h2>
                <p className="text-muted-foreground mt-1">Manage your accounts and applications</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* New Account */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/onboarding')}
                  className="p-6 bg-card rounded-xl border-2 border-dashed border-accent/30 hover:border-accent transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <Plus className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">New Account</h3>
                  <p className="text-xs text-muted-foreground mt-1">Open a new bank account with instant onboarding</p>
                </motion.button>

                {/* My Accounts */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => app && setView('account-detail')}
                  className={`p-6 bg-card rounded-xl border border-border hover:border-accent/50 transition-all text-left group ${!app ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                    <CreditCard className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">My Accounts</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {app && app.status !== 'IN_PROGRESS' ? `1 account • ${config.label}` : 'No accounts yet'}
                  </p>
                </motion.button>

                {/* Update Information */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView('update-info')}
                  className="p-6 bg-card rounded-xl border border-border hover:border-accent/50 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                    <Edit3 className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Update Information</h3>
                  <p className="text-xs text-muted-foreground mt-1">Request changes to your account details</p>
                </motion.button>
              </div>

              {/* My Account Card */}
              {app && app.status !== 'IN_PROGRESS' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">My Applications</h3>
                  </div>

                  <button
                    onClick={() => setView('account-detail')}
                    className="w-full p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg ${hasAccount ? 'banking-gradient' : 'bg-muted'} flex items-center justify-center flex-shrink-0`}>
                      <CreditCard className={`w-5 h-5 ${hasAccount ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {hasAccount ? `Account: ${app.accountDetails.accountNumber}` : (app?.eligibility?.accountType || 'Savings').charAt(0).toUpperCase() + (app?.eligibility?.accountType || 'savings').slice(1) + ' Account Application'}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold text-white ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ref: {app?.applicationReference || '—'} • {new Date(app?.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── Account Detail View ─── */}
          {view === 'account-detail' && app && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Status Banner */}
              <div className={`p-5 rounded-xl border-2 ${config.bg}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/40' : status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                      <StatusIcon className={`w-6 h-6 ${config.textColor}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {app?.personalInfo?.fullName || 'Valued Customer'}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-semibold ${config.textColor}`}>{config.label}</span>
                        {app?.applicationReference && (
                          <span className="text-xs text-muted-foreground">• Ref: {app.applicationReference}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {status === 'SUBMITTED' && (
                    <div className="text-right text-sm text-muted-foreground">
                      <p>⏳ Estimated review time</p>
                      <p className="font-semibold">1-2 business days</p>
                    </div>
                  )}
                  {status === 'APPROVED' && !hasAccount && (
                    <Button onClick={() => navigate('/onboarding')} className="gap-2">
                      Activate Account <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Application Progress</h3>
                <div className="flex items-center justify-between">
                  {[
                    { step: 'Submitted', done: ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(status) },
                    { step: 'Under Review', done: ['APPROVED', 'REJECTED'].includes(status), active: status === 'SUBMITTED' },
                    { step: 'Decision', done: ['APPROVED', 'REJECTED'].includes(status) },
                    { step: 'Account Active', done: !!hasAccount },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-0 flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.done ? 'bg-green-500 text-white' : item.active ? 'bg-amber-400 text-white animate-pulse' : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.done ? '✓' : i + 1}
                        </div>
                        <span className="text-[10px] mt-1 text-muted-foreground text-center w-16">{item.step}</span>
                      </div>
                      {i < 3 && <div className={`flex-1 h-0.5 mx-1 ${item.done ? 'bg-green-400' : 'bg-muted'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Details Card */}
              {hasAccount && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="p-5 banking-gradient text-primary-foreground">
                    <p className="text-xs opacity-80">Account Number</p>
                    <p className="text-xl font-bold font-mono tracking-wider">{app.accountDetails.accountNumber}</p>
                    <div className="flex gap-4 mt-2 text-xs opacity-80">
                      <span>{(app?.eligibility?.accountType || 'savings').toUpperCase()} ACCOUNT</span>
                      <span>IFSC: {app.accountDetails.ifscCode || 'NDB0001234'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Name" value={app?.personalInfo?.fullName} />
                    <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Mobile" value={app?.verification?.mobile} />
                    <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={app?.verification?.email} />
                    <InfoRow icon={<FileText className="w-3.5 h-3.5" />} label="DOB" value={app?.personalInfo?.dob ? new Date(app.personalInfo.dob).toLocaleDateString('en-IN') : undefined} />
                    <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="City" value={app?.address?.currentAddress?.city} />
                    <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Employment" value={app?.employment?.employmentType} />
                    <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Annual Income" value={app?.personalInfo?.annualIncome} />
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-semibold text-foreground">KYC & Compliance</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <InfoRow icon={<FileText className="w-3.5 h-3.5" />} label="PAN" value={app?.kyc?.panNumber ? maskString(app.kyc.panNumber) : undefined} badge={app?.kyc?.panStatus} />
                    <InfoRow icon={<FileText className="w-3.5 h-3.5" />} label="Aadhaar" value={app?.kyc?.aadhaarNumber ? maskString(app.kyc.aadhaarNumber) : undefined} badge={app?.kyc?.aadhaarStatus} />
                    <InfoRow icon={<Shield className="w-3.5 h-3.5" />} label="Risk Score" value={app?.riskProfile?.riskScore ? `${app.riskProfile.riskScore}/100` : undefined} />
                    <InfoRow icon={<Shield className="w-3.5 h-3.5" />} label="Risk Category" value={app?.riskProfile?.riskLevel} />
                    <InfoRow icon={<Shield className="w-3.5 h-3.5" />} label="Compliance Score" value={app?.riskProfile?.complianceScore ? `${app.riskProfile.complianceScore}/100` : undefined} />
                    <InfoRow icon={<FileText className="w-3.5 h-3.5" />} label="AI Decision" value={app?.aiDecision} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Update Information View ─── */}
          {view === 'update-info' && (
            <motion.div
              key="update"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-foreground">Update Information</h2>
                <p className="text-sm text-muted-foreground mt-1">Request changes to your account details. Our team will review and process your request.</p>
              </div>

              {requestSent && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-500/40 rounded-lg text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Your update request has been submitted. Our team will review it shortly.
                </div>
              )}

              {/* Request Form */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-5">
                <h3 className="text-sm font-semibold text-foreground">New Update Request</h3>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Field to Update</label>
                  <select
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
                    value={updateRequest.field}
                    onChange={e => setUpdateRequest(prev => ({ ...prev, field: e.target.value }))}
                  >
                    <option value="">Select a field...</option>
                    <option value="name">Full Name</option>
                    <option value="email">Email Address</option>
                    <option value="address">Address</option>
                    <option value="phone">Phone Number</option>
                    <option value="employment">Employment Details</option>
                    <option value="nominee">Nominee Details</option>
                    <option value="services">Account Services</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">New Value</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
                    placeholder="Enter the updated information"
                    value={updateRequest.newValue}
                    onChange={e => setUpdateRequest(prev => ({ ...prev, newValue: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Reason for Change</label>
                  <textarea
                    className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none resize-none"
                    rows={3}
                    placeholder="Explain why you need this information updated..."
                    value={updateRequest.reason}
                    onChange={e => setUpdateRequest(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setUpdateRequest({ field: '', reason: '', newValue: '' })}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleUpdateRequest} disabled={!updateRequest.field || !updateRequest.reason || submitting}>
                    <Send className="w-3 h-3 mr-1" /> {submitting ? 'Sending...' : 'Submit Request'}
                  </Button>
                </div>
              </div>

              {/* Previous Requests */}
              {app?.updateRequests && app.updateRequests.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Previous Requests</h3>
                  <div className="space-y-3">
                    {app.updateRequests.map((req: any, i: number) => (
                      <div key={i} className="p-3 bg-secondary/30 rounded-lg flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground capitalize">{req.field}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            }`}>
                              {req.status || 'pending'}
                            </span>
                          </div>
                          {req.newValue && <p className="text-xs text-muted-foreground mt-0.5">New: {req.newValue}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">{req.reason}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex-shrink-0">
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// Helper components
const InfoRow = ({ icon, label, value, badge }: { icon: any; label: string; value?: string; badge?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-foreground font-medium">{value || '—'}</span>
      {badge && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
          badge === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
        }`}>
          {badge}
        </span>
      )}
    </div>
  </div>
);

const maskString = (str: string) => {
  if (str.length <= 4) return str;
  return '●●●●' + str.slice(-4);
};

export default UserDashboard;
