import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Edit2, CheckCircle2 } from 'lucide-react';

const Section = ({ title, items, onEdit }: { title: string; items: { label: string; value: string }[]; onEdit: () => void }) => (
  <div className="p-4 bg-secondary/50 rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-bold">{title}</h3>
      <button onClick={onEdit} className="text-xs text-info flex items-center gap-1 hover:underline">
        <Edit2 className="w-3 h-3" /> Edit
      </button>
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {items.filter(i => i.value).map((item, idx) => (
        <div key={idx}>
          <span className="text-xs text-muted-foreground">{item.label}: </span>
          <span className="text-xs font-semibold">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const StepReview = () => {
  const { formData, updateFormData, nextStep, prevStep, goToStep } = useOnboarding();

  const completeness = [
    formData.accountType, formData.otpVerified, formData.fullName, formData.currentAddressLine1,
    formData.panVerified, formData.employmentType, formData.riskCategory, formData.debitCardType,
  ].filter(Boolean).length;
  const pct = Math.round((completeness / 8) * 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Application Review & Summary</h2>
          <p className="text-sm text-muted-foreground">Review all details before final submission</p>
        </div>
      </div>

      {/* Compliance Meter */}
      <div className="p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Compliance Readiness</span>
          <span className={`text-sm font-bold ${pct === 100 ? 'text-success' : 'text-warning'}`}>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <div className="space-y-3">
        <Section title="Account & Eligibility" onEdit={() => goToStep(0)} items={[
          { label: 'Account Type', value: formData.accountType },
          { label: 'Residency', value: formData.residencyStatus },
        ]} />
        <Section title="Personal Information" onEdit={() => goToStep(2)} items={[
          { label: 'Name', value: formData.fullName },
          { label: 'DOB', value: formData.dob },
          { label: 'Gender', value: formData.gender },
          { label: 'Occupation', value: formData.occupation },
          { label: 'Income', value: formData.annualIncome },
        ]} />
        <Section title="Address" onEdit={() => goToStep(3)} items={[
          { label: 'Current', value: [formData.currentAddressLine1, formData.currentCity, formData.currentState].filter(Boolean).join(', ') },
          { label: 'Pincode', value: formData.currentPincode },
        ]} />
        <Section title="KYC Verification" onEdit={() => goToStep(4)} items={[
          { label: 'PAN', value: formData.panNumber },
          { label: 'PAN Verified', value: formData.panVerified ? '✓ Yes' : '✗ No' },
          { label: 'Aadhaar Verified', value: formData.aadhaarVerified ? '✓ Yes' : '✗ No' },
          { label: 'Face Verified', value: formData.faceVerified ? '✓ Yes' : '✗ No' },
        ]} />
        <Section title="Risk Profile" onEdit={() => goToStep(6)} items={[
          { label: 'Risk Score', value: `${formData.riskScore}/100` },
          { label: 'Category', value: formData.riskCategory },
          { label: 'AML', value: formData.amlCleared ? 'Cleared' : 'Flagged' },
        ]} />
        <Section title="Services" onEdit={() => goToStep(8)} items={[
          { label: 'Debit Card', value: formData.debitCardType },
          { label: 'Internet Banking', value: formData.internetBanking ? 'Yes' : 'No' },
          { label: 'UPI', value: formData.upiActivation ? 'Yes' : 'No' },
        ]} />
      </div>

      {/* Digital Signature */}
      <div className="p-4 border-2 border-accent/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Checkbox
            id="signature"
            checked={formData.digitalSignatureConsent}
            onCheckedChange={v => updateFormData({ digitalSignatureConsent: !!v })}
          />
          <Label htmlFor="signature" className="text-xs leading-relaxed">
            I hereby declare that all the information provided above is true, correct, and complete. I authorize the bank
            to verify the information provided and process my account opening application. This serves as my digital signature.
          </Label>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        <Button onClick={async () => {
            try {
                await import('@/api/axios').then(m => m.default.post('/onboarding/submit'));
                nextStep();
            } catch(e) {
                alert('Submission failed');
            }
        }} disabled={!formData.digitalSignatureConsent}>Submit for AI Validation →</Button>
      </div>
    </div>
  );
};

export default StepReview;
