import { useEffect, useState } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { calculateRiskScore, checkAML, checkFraud } from '@/lib/riskEngine';
import AIProcessingOverlay from './AIProcessingOverlay';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, ShieldAlert, Brain, TrendingUp, Search, Fingerprint } from 'lucide-react';

const StepRiskProfile = () => {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding();
  const [phase, setPhase] = useState<'scanning' | 'aml' | 'fraud' | 'done'>('scanning');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('aml'), 2000);
    const timer2 = setTimeout(() => setPhase('fraud'), 4000);
    const timer3 = setTimeout(() => {
      const risk = calculateRiskScore(formData);
      const aml = checkAML(formData.fullName);
      const fraud = checkFraud(formData);
      updateFormData({
        riskScore: risk.score,
        riskCategory: risk.category,
        riskFactors: risk.factors.map(f => f.factor),
        amlCleared: aml.cleared,
        fraudCheckPassed: fraud.passed,
      });
      setPhase('done');
    }, 5500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, []);

  if (phase !== 'done') {
    const titles = {
      scanning: 'Calculating Risk Score...',
      aml: 'Running AML Watchlist Screening...',
      fraud: 'Checking Fraud Patterns...',
    };
    const subtitles = {
      scanning: 'Analyzing applicant profile against risk parameters',
      aml: 'Screening against global sanctions and PEP databases',
      fraud: 'AI analyzing behavioral patterns and anomalies',
    };
    return <AIProcessingOverlay title={titles[phase]} subtitle={subtitles[phase]} icon="shield" />;
  }

  const risk = calculateRiskScore(formData);
  const scoreColor = risk.category === 'Low' ? 'text-success' : risk.category === 'Medium' ? 'text-warning' : 'text-destructive';
  const scoreBg = risk.category === 'Low' ? 'bg-success/10 border-success/30' : risk.category === 'Medium' ? 'bg-warning/10 border-warning/30' : 'bg-destructive/10 border-destructive/30';
  const CategoryIcon = risk.category === 'Low' ? ShieldCheck : risk.category === 'Medium' ? AlertTriangle : ShieldAlert;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Risk Profiling & AML Screening</h2>
          <p className="text-sm text-muted-foreground">Automated compliance assessment complete</p>
        </div>
      </div>

      {/* Risk Score */}
      <div className={`p-6 rounded-lg border ${scoreBg} text-center`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="inline-block"
        >
          <div className={`text-5xl font-bold ${scoreColor} font-mono`}>
            {risk.score}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
        </motion.div>
        <div className={`flex items-center justify-center gap-2 mt-2 ${scoreColor}`}>
          <CategoryIcon className="w-5 h-5" />
          <span className="font-bold text-lg">Risk Level: {risk.category}</span>
        </div>
      </div>

      {/* Screening Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-secondary/50 rounded-lg text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-info" />
          <p className="text-xs font-semibold">Risk Score</p>
          <p className={`text-lg font-bold font-mono ${scoreColor}`}>{risk.score}</p>
        </div>
        <div className="p-3 bg-secondary/50 rounded-lg text-center">
          <Search className="w-5 h-5 mx-auto mb-1 text-info" />
          <p className="text-xs font-semibold">AML Screening</p>
          <p className={`text-sm font-bold ${formData.amlCleared ? 'text-success' : 'text-destructive'}`}>
            {formData.amlCleared ? '✓ Cleared' : '✗ Flagged'}
          </p>
        </div>
        <div className="p-3 bg-secondary/50 rounded-lg text-center">
          <Fingerprint className="w-5 h-5 mx-auto mb-1 text-info" />
          <p className="text-xs font-semibold">Fraud Check</p>
          <p className={`text-sm font-bold ${formData.fraudCheckPassed ? 'text-success' : 'text-destructive'}`}>
            {formData.fraudCheckPassed ? '✓ Passed' : '✗ Anomaly'}
          </p>
        </div>
      </div>

      {/* Explainable AI */}
      <div className="p-4 bg-secondary/50 rounded-lg">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" /> Explainable AI — Risk Factors
        </h3>
        {risk.factors.length === 0 ? (
          <p className="text-xs text-success">No risk factors identified. Profile is clean.</p>
        ) : (
          <div className="space-y-2">
            {risk.factors.map((f, i) => (
              <div key={i} className={`p-2 rounded text-xs border ${f.impact > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-success/5 border-success/20'}`}>
                <p className="font-semibold">{f.impact > 0 ? '⚠' : '✓'} {f.factor} ({f.impact > 0 ? '+' : ''}{f.impact} points)</p>
                <p className="text-muted-foreground mt-0.5">{f.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {risk.category === 'High' && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive">
          ⚠ High risk detected — Application will be escalated to a bank officer for manual review.
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        <Button onClick={nextStep}>Continue →</Button>
      </div>
    </div>
  );
};

export default StepRiskProfile;
