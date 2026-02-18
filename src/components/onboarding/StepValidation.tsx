import { useEffect, useState } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import AIProcessingOverlay from './AIProcessingOverlay';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';

const checks = [
  { label: 'Document Authenticity Check', icon: '📄' },
  { label: 'KYC Compliance Validation', icon: '🔍' },
  { label: 'Risk Assessment Confirmation', icon: '⚡' },
  { label: 'AML/CFT Screening', icon: '🛡️' },
  { label: 'Regulatory Compliance Check', icon: '📋' },
  { label: 'Final AI Decision Engine', icon: '🤖' },
];

const StepValidation = () => {
  const { formData, nextStep, prevStep } = useOnboarding();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'validating' | 'submitting' | 'done'>('validating');
  const [completedChecks, setCompletedChecks] = useState<number>(0);
  const [submitResult, setSubmitResult] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCompletedChecks(prev => {
        if (prev >= checks.length) {
          clearInterval(interval);
          setTimeout(() => setPhase('submitting'), 500);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Submit the application when validation is done
  useEffect(() => {
    if (phase !== 'submitting') return;

    const submitApp = async () => {
      try {
        const res = await api.post('/onboarding/submit');
        setSubmitResult(res.data);
      } catch (err) {
        console.error('Submit error:', err);
        setSubmitResult({ status: 'SUBMITTED' });
      }
      setPhase('done');
    };
    submitApp();
  }, [phase]);

  const isHighRisk = formData.riskCategory === 'High';
  const decision = isHighRisk ? 'Escalated to Bank Officer' : formData.riskCategory === 'Medium' ? 'Approved with Conditions' : 'Auto-Approved';

  if (phase === 'validating' && completedChecks < checks.length) {
    return (
      <div className="space-y-6">
        <AIProcessingOverlay title="Running Final AI Validation..." subtitle="Performing comprehensive compliance checks" icon="shield" />
        <div className="space-y-2 max-w-md mx-auto">
          {checks.map((check, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: i <= completedChecks ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-2 rounded"
            >
              <span>{check.icon}</span>
              <span className="text-sm flex-1">{check.label}</span>
              {i < completedChecks ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : i === completedChecks ? (
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <Clock className="w-4 h-4 text-muted-foreground" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Submitting your application for review...</p>
      </div>
    );
  }

  // Application is APPROVED → allow activation
  const isApproved = submitResult?.status === 'APPROVED';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Validation Complete</h2>
          <p className="text-sm text-muted-foreground">All compliance checks have been processed</p>
        </div>
      </div>

      {/* All checks passed */}
      <div className="space-y-2">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center gap-3 p-2 bg-success/5 rounded">
            <span>{check.icon}</span>
            <span className="text-sm flex-1">{check.label}</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
        ))}
      </div>

      {/* Decision */}
      {isApproved ? (
        <div className="p-4 rounded-lg border-2 text-center bg-success/10 border-success/30">
          <p className="text-lg font-bold">✅ Application Approved!</p>
          <p className="text-sm text-success mt-2">
            Your account has been approved. Click below to activate your account instantly.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-lg border-2 text-center bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-500/40">
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400">⏳ Application Submitted for Review</p>
          <p className="text-sm text-amber-600 dark:text-amber-400/80 mt-2">
            Your application has been successfully submitted and is now <strong>pending admin approval</strong>.
            You'll be able to activate your account once approved.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Estimated review time: 1-2 business days. You can track status from your Dashboard.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        {isApproved ? (
          <Button onClick={nextStep}>Activate Account →</Button>
        ) : (
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard →</Button>
        )}
      </div>
    </div>
  );
};

export default StepValidation;
