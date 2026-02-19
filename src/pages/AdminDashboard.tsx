import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/api/axios';
import {
  Shield, Eye, Brain, Search, Filter, CheckCircle2, XCircle,
  AlertTriangle, LogOut, Info
} from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';

const riskBadge: Record<string, string> = {
  Low: 'bg-green-100 text-green-700 border border-green-200',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  High: 'bg-red-100 text-red-700 border border-red-200',
};

const statusBadge: Record<string, { label: string; cls: string }> = {
  IN_PROGRESS: { label: 'In Progress', cls: 'text-blue-600' },
  SUBMITTED: { label: 'Under Review', cls: 'text-amber-600' },
  APPROVED: { label: 'Approved', cls: 'text-green-600' },
  REJECTED: { label: 'Rejected', cls: 'text-red-600' },
  REVIEW: { label: 'Escalated', cls: 'text-orange-600' },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useOnboarding();
  const [applications, setApplications] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/admin/applications');
      setApplications(res.data);
    } catch (err) { console.error('Failed to fetch:', err); }
    setLoading(false);
  };

  const handleOverride = async (appId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(status);
    try {
      const res = await api.post(`/admin/application/${appId}/override`, {
        status,
        remarks: remarks || `Admin ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      });
      const updated = res.data.application;
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, ...updated } : a));
      setSelected((prev: any) => prev?._id === appId ? { ...prev, ...updated } : prev);
      setRemarks('');
    } catch (err) { console.error('Override failed:', err); }
    setActionLoading('');
  };

  const filtered = applications.filter(app => {
    const risk = getRisk(app);
    if (filterRisk !== 'all' && risk !== filterRisk) return false;
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (app.personalInfo?.fullName || '').toLowerCase();
      const ref = (app.applicationReference || app._id || '').toLowerCase();
      const mobile = (app.userId?.mobile || '').toLowerCase();
      if (!name.includes(q) && !ref.includes(q) && !mobile.includes(q)) return false;
    }
    return true;
  });

  const logoutHandler = async () => {
    await logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header — dark strip */}
      <header className="bg-[#1a1f2e] text-white">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-extrabold tracking-wide">BANK OFFICER — ADMIN PANEL</h1>
            <p className="text-[11px] text-gray-400">Human-in-the-Loop Decision Dashboard</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] px-3 py-1 rounded-full border border-green-500/50 text-green-400 font-semibold">
              ✓ Authorized Access Only
            </span>
            <span className="text-[10px] px-3 py-1 rounded-full border border-cyan-500/50 text-cyan-400 font-semibold flex items-center gap-1">
              <Brain className="w-3 h-3" /> AI Engine Active
            </span>
            <button onClick={logoutHandler} className="ml-2 p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-5">
        {/* Search + Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or application ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'Low', 'Medium', 'High'].map(r => (
              <button key={r} onClick={() => setFilterRisk(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  filterRisk === r ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >{r === 'all' ? 'All Risk' : `${r} Risk`}</button>
            ))}
            <span className="w-px bg-gray-200 mx-1 self-stretch" />
            {['all', 'SUBMITTED', 'APPROVED', 'REJECTED'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  filterStatus === s ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >{s === 'all' ? 'All Status' : (statusBadge[s]?.label || s)}</button>
            ))}
          </div>
        )}

        {/* Main: Table + Detail */}
        <div className="flex gap-5 items-start">
          {/* Table */}
          <div className={`${selected ? 'w-[58%]' : 'w-full'} transition-all duration-300`}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Application ID</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Risk ↕</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Score ↕</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">AI Rec.</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No applications found</td></tr>
                  ) : (
                    filtered.map(app => {
                      const risk = getRisk(app);
                      const score = getScore(app);
                      const aiRec = getAiRec(app);
                      const isSelected = selected?._id === app._id;
                      const st = statusBadge[app.status] || statusBadge.IN_PROGRESS;

                      return (
                        <tr key={app._id}
                          className={`border-b border-gray-100 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          onClick={() => setSelected(isSelected ? null : app)}
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-gray-700">{app.applicationReference || ('ONB-' + (app._id?.slice(-8) || '').toUpperCase())}</span>
                              {risk === 'High' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold uppercase tracking-wide">Escalated</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-semibold text-gray-800">{app.personalInfo?.fullName || 'N/A'}</p>
                            <p className="text-[10px] text-gray-400">{capFirst(app.eligibility?.accountType || 'Savings')} Account</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${riskBadge[risk] || riskBadge.Low}`}>{risk}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-bold font-mono text-gray-800">{score}<span className="text-gray-400 text-xs">/100</span></span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-semibold ${st.cls}`}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-semibold ${
                              aiRec === 'Approve' ? 'text-green-600' : aiRec === 'Review' ? 'text-orange-500' : 'text-red-600'
                            }`}>{aiRec}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : app); }}
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.2 }}
                className="w-[42%] flex-shrink-0"
              >
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">{(selected.personalInfo?.fullName || 'N')[0]}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">{selected.personalInfo?.fullName || 'Applicant'}</h3>
                        <p className="text-[10px] text-gray-400">{selected.userId?.mobile || ''} {selected.userId?.email ? `• ${selected.userId.email}` : ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-4 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">

                    {/* ── Personal Information ── */}
                    <Section title="Personal Information">
                      <Row label="Full Name" value={selected.personalInfo?.fullName} />
                      <Row label="Date of Birth" value={selected.personalInfo?.dob ? new Date(selected.personalInfo.dob).toLocaleDateString('en-IN') : undefined} />
                      <Row label="Gender" value={selected.personalInfo?.gender} />
                      <Row label="Marital Status" value={selected.personalInfo?.maritalStatus} />
                      <Row label="Father's Name" value={selected.personalInfo?.fatherName} />
                      <Row label="Mother's Name" value={selected.personalInfo?.motherName} />
                      <Row label="Occupation" value={selected.personalInfo?.occupation} />
                      <Row label="Annual Income" value={selected.personalInfo?.annualIncome} />
                    </Section>

                    {/* ── Contact & Verification ── */}
                    <Section title="Contact & Verification">
                      <Row label="Mobile" value={selected.verification?.mobile || selected.userId?.mobile} />
                      <Row label="Mobile Verified">
                        <StatusPill ok={selected.verification?.mobileVerified} />
                      </Row>
                      <Row label="Email" value={selected.verification?.email || selected.userId?.email} />
                      <Row label="Email Verified">
                        <StatusPill ok={selected.verification?.emailVerified} />
                      </Row>
                    </Section>

                    {/* ── Address ── */}
                    <Section title="Address">
                      <Row label="Line 1" value={selected.address?.currentAddress?.line1} />
                      <Row label="Line 2" value={selected.address?.currentAddress?.line2} />
                      <Row label="City" value={selected.address?.currentAddress?.city} />
                      <Row label="State" value={selected.address?.currentAddress?.state} />
                      <Row label="PIN Code" value={selected.address?.currentAddress?.pinCode} />
                    </Section>

                    {/* ── KYC Documents ── */}
                    <Section title="KYC Documents">
                      <Row label="PAN Number" value={selected.kyc?.panNumber ? maskStr(selected.kyc.panNumber) : undefined} />
                      <Row label="PAN Status">
                        <StatusPill ok={['valid','verified'].includes((selected.kyc?.panStatus||'').toLowerCase())} label={selected.kyc?.panStatus} />
                      </Row>
                      <Row label="Aadhaar Number" value={selected.kyc?.aadhaarNumber ? maskStr(selected.kyc.aadhaarNumber) : undefined} />
                      <Row label="Aadhaar Status">
                        <StatusPill ok={['valid','verified'].includes((selected.kyc?.aadhaarStatus||'').toLowerCase())} label={selected.kyc?.aadhaarStatus} />
                      </Row>
                    </Section>

                    {/* ── Employment ── */}
                    <Section title="Employment">
                      <Row label="Employment Type" value={selected.employment?.employmentType} />
                      <Row label="Employer" value={selected.employment?.employerName} />
                      <Row label="Source of Income" value={selected.employment?.sourceOfIncome} />
                      <Row label="Tax Residency" value={selected.employment?.taxResidency} />
                      <Row label="PEP Declaration">
                        {selected.employment?.pepDeclaration
                          ? <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200">YES — PEP</span>
                          : <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 border border-green-200">No</span>
                        }
                      </Row>
                    </Section>

                    {/* ── Risk & Compliance ── */}
                    <Section title="Risk & Compliance">
                      <Row label="Risk Score" value={`${getScore(selected)}/100`} />
                      <Row label="Risk Level">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${riskBadge[getRisk(selected)] || riskBadge.Low}`}>{getRisk(selected)}</span>
                      </Row>
                      <Row label="Compliance Score" value={selected.riskProfile?.complianceScore != null ? `${selected.riskProfile.complianceScore}/100` : undefined} />
                      <Row label="AML Status" value={selected.riskProfile?.amlStatus} />
                      <Row label="Fraud Status" value={selected.riskProfile?.fraudStatus} />
                    </Section>

                    {/* ── Risk Factors ── */}
                    {selected.riskProfile?.riskFactors?.length > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <h4 className="text-[10px] font-bold text-red-600 uppercase mb-2">⚠ Risk Factors</h4>
                        <ul className="space-y-1">
                          {selected.riskProfile.riskFactors.map((f: string, i: number) => (
                            <li key={i} className="text-xs text-red-700 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ── Nominee ── */}
                    {selected.nominee?.fullName && (
                      <Section title="Nominee">
                        <Row label="Name" value={selected.nominee?.fullName} />
                        <Row label="Relationship" value={selected.nominee?.relationship} />
                        <Row label="DOB" value={selected.nominee?.dob ? new Date(selected.nominee.dob).toLocaleDateString('en-IN') : undefined} />
                      </Section>
                    )}

                    {/* ── Services ── */}
                    {selected.services && (
                      <Section title="Selected Services">
                        <Row label="Debit Card" value={selected.services.debitCardType || '—'} />
                        <Row label="Internet Banking"><StatusPill ok={selected.services.internetBanking} /></Row>
                        <Row label="SMS Alerts"><StatusPill ok={selected.services.smsAlerts} /></Row>
                        <Row label="Cheque Book"><StatusPill ok={selected.services.chequeBook} /></Row>
                        <Row label="UPI Activation"><StatusPill ok={selected.services.upiActivation} /></Row>
                      </Section>
                    )}

                    {/* ── Eligibility ── */}
                    <Section title="Application Info">
                      <Row label="Application ID" value={selected.applicationReference || ('ONB-' + (selected._id?.slice(-8) || '').toUpperCase())} />
                      <Row label="Account Type" value={capFirst(selected.eligibility?.accountType || 'Savings') + ' Account'} />
                      <Row label="Residency" value={selected.eligibility?.residencyStatus} />
                      <Row label="Submitted" value={new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                      <Row label="AI Decision" value={selected.aiDecision} />
                    </Section>

                    {/* AI vs Human */}
                    <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-gray-400" /> AI Recommendation vs Final Decision
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg border border-gray-100 text-center">
                          <p className="text-[10px] text-gray-400 mb-1">AI Says</p>
                          <p className={`text-sm font-bold ${getAiRec(selected) === 'Approve' ? 'text-green-600' : getAiRec(selected) === 'Review' ? 'text-orange-500' : 'text-red-600'}`}>{getAiRec(selected)}</p>
                          {selected.riskProfile?.complianceScore != null && (
                            <p className="text-[10px] text-gray-400 mt-0.5">Compliance: {selected.riskProfile.complianceScore}%</p>
                          )}
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-100 text-center">
                          <p className="text-[10px] text-gray-400 mb-1">Officer Decision</p>
                          <p className={`text-sm font-bold ${
                            selected.status === 'APPROVED' ? 'text-green-600' :
                            selected.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {selected.status === 'APPROVED' ? 'Approved' :
                             selected.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Officer Actions */}
                    {(selected.status === 'SUBMITTED' || selected.status === 'IN_PROGRESS' || selected.status === 'REVIEW') && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-gray-800">Officer Actions</h4>
                        <input
                          type="text"
                          placeholder="Add remarks (optional)..."
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-400"
                          value={remarks}
                          onChange={e => setRemarks(e.target.value)}
                        />
                        <button
                          onClick={() => handleOverride(selected._id, 'APPROVED')}
                          disabled={!!actionLoading}
                          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {actionLoading === 'APPROVED' ? 'Processing...' : 'Approve Application'}
                        </button>
                        <button
                          onClick={() => handleOverride(selected._id, 'REJECTED')}
                          disabled={!!actionLoading}
                          className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          {actionLoading === 'REJECTED' ? 'Processing...' : 'Reject Application'}
                        </button>
                        {getRisk(selected) === 'High' && (
                          <button className="w-full py-2.5 bg-amber-50 border border-amber-300 text-amber-700 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-amber-100">
                            <AlertTriangle className="w-4 h-4" /> Manual Risk Override
                          </button>
                        )}
                      </div>
                    )}

                    {/* Already decided */}
                    {(selected.status === 'APPROVED' || selected.status === 'REJECTED') && (
                      <div className={`p-3.5 rounded-lg border ${selected.status === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {selected.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                          <p className={`text-xs font-semibold ${selected.status === 'APPROVED' ? 'text-green-700' : 'text-red-700'}`}>
                            Application {selected.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                          </p>
                        </div>
                        {selected.humanDecision && <p className="text-[10px] text-gray-500 mt-1">{selected.humanDecision}</p>}
                        {selected.accountDetails?.accountNumber && (
                          <p className="text-xs text-green-700 mt-2 font-mono font-semibold">Account: {selected.accountDetails.accountNumber}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

/* ─── helpers ────────────────────────────────────── */

function getRisk(app: any) { return app.riskProfile?.riskLevel || app.riskCategory || 'Low'; }
function getScore(app: any) { return app.riskProfile?.riskScore ?? app.riskScore ?? 0; }
function getAiRec(app: any) {
  const d = app.aiDecision || '';
  if (d.includes('Approve') || d.includes('Approval')) return 'Approve';
  if (d.includes('Careful') || d.includes('High Risk') || d.includes('Review') || d.includes('Escalated')) return 'Review';
  if (d.includes('Reject')) return 'Reject';
  return 'Approve';
}
function capFirst(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function maskStr(s: string) { return s && s.length > 4 ? '●●●●' + s.slice(-4) : s || '—'; }

const Row = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div className="flex items-center justify-between text-xs py-0.5">
    <span className="text-gray-500">{label}</span>
    {children || <span className="font-semibold text-gray-800 text-right max-w-[60%] truncate">{value || '—'}</span>}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5">
    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</h4>
    {children}
  </div>
);

const StatusPill = ({ ok, label }: { ok?: boolean; label?: string }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
    ok ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
  }`}>
    {label || (ok ? 'Verified' : 'Pending')}
  </span>
);

export default AdminDashboard;
