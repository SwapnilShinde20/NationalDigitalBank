import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Shield, Wallet, Briefcase, Building2 } from 'lucide-react';

const accountTypes = [
  { value: 'savings', label: 'Savings Account', desc: 'Personal savings with interest', icon: Wallet },
  { value: 'salary', label: 'Salary Account', desc: 'Linked to employer payroll', icon: Briefcase },
  { value: 'current', label: 'Current Account', desc: 'For business transactions', icon: Building2 },
];

const StepWelcome = () => {
  const { formData, updateFormData, nextStep } = useOnboarding();

  const canProceed = formData.accountType && formData.termsAccepted && formData.dataConsent && formData.dob;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Welcome — Eligibility Check</h2>
          <p className="text-sm text-muted-foreground">Let's start your digital account opening journey</p>
        </div>
      </div>

      {/* Account Type */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Select Account Type *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {accountTypes.map(type => (
            <button
              key={type.value}
              onClick={() => updateFormData({ accountType: type.value })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                formData.accountType === type.value
                  ? 'border-accent bg-accent/10 step-glow'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <type.icon className={`w-6 h-6 mb-2 ${formData.accountType === type.value ? 'text-accent' : 'text-muted-foreground'}`} />
              <p className="font-semibold text-sm text-foreground">{type.label}</p>
              <p className="text-xs text-muted-foreground">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Residency */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Residency Status *</Label>
        <RadioGroup value={formData.residencyStatus} onValueChange={v => updateFormData({ residencyStatus: v })} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="resident" id="resident" />
            <Label htmlFor="resident" className="text-sm">Indian Resident</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="nri" id="nri" />
            <Label htmlFor="nri" className="text-sm">NRI / OCI</Label>
          </div>
        </RadioGroup>
      </div>

      {/* DOB for age verification */}
      <div>
        <Label htmlFor="dob-check" className="text-sm font-semibold mb-2 block">Date of Birth (Age Verification) *</Label>
        <Input
          id="dob-check"
          type="date"
          value={formData.dob}
          onChange={e => updateFormData({ dob: e.target.value })}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
          className="max-w-xs"
        />
        {formData.dob && (
          <p className="text-xs mt-1 text-success">
            Age: {new Date().getFullYear() - new Date(formData.dob).getFullYear()} years — Eligible ✓
          </p>
        )}
      </div>

      {/* Consents */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={formData.termsAccepted}
            onCheckedChange={v => updateFormData({ termsAccepted: !!v })}
          />
          <Label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
            I agree to the Terms & Conditions, Privacy Policy, and account opening guidelines as per RBI regulations. *
          </Label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="data-consent"
            checked={formData.dataConsent}
            onCheckedChange={v => updateFormData({ dataConsent: !!v })}
          />
          <Label htmlFor="data-consent" className="text-xs leading-relaxed text-muted-foreground">
            I consent to the collection, processing, and storage of my personal data for account opening and KYC verification purposes. *
          </Label>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={nextStep} disabled={!canProceed} className="px-8">
          Proceed to Verification →
        </Button>
      </div>
    </div>
  );
};

export default StepWelcome;
