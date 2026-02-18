import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Briefcase } from 'lucide-react';

const StepEmployment = () => {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding();

  const canProceed = formData.employmentType && formData.sourceOfIncome;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Briefcase className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Employment & Financial Details</h2>
          <p className="text-sm text-muted-foreground">Required for financial compliance assessment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold">Employment Type *</Label>
          <Select value={formData.employmentType} onValueChange={v => updateFormData({ employmentType: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="salaried">Salaried</SelectItem>
              <SelectItem value="self-employed">Self-Employed</SelectItem>
              <SelectItem value="business">Business Owner</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="government">Government Employee</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="unemployed">Unemployed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Employer Name</Label>
          <Input value={formData.employerName} onChange={e => updateFormData({ employerName: e.target.value })} placeholder="Company / Organization name" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Source of Income *</Label>
          <Select value={formData.sourceOfIncome} onValueChange={v => updateFormData({ sourceOfIncome: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="salary">Salary</SelectItem>
              <SelectItem value="business-income">Business Income</SelectItem>
              <SelectItem value="investments">Investments</SelectItem>
              <SelectItem value="rental">Rental Income</SelectItem>
              <SelectItem value="pension">Pension</SelectItem>
              <SelectItem value="agriculture">Agriculture</SelectItem>
              <SelectItem value="others">Others</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Tax Residency</Label>
          <Select value={formData.taxResidency} onValueChange={v => updateFormData({ taxResidency: v })}>
            <SelectTrigger><SelectValue placeholder="India" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="India">India</SelectItem>
              <SelectItem value="USA">USA</SelectItem>
              <SelectItem value="UK">UK</SelectItem>
              <SelectItem value="UAE">UAE</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PEP Declaration */}
      <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg space-y-3">
        <Label className="text-sm font-bold">Politically Exposed Person (PEP) Declaration *</Label>
        <p className="text-xs text-muted-foreground">
          As per RBI Master Direction on KYC, a PEP is an individual who is or has been entrusted with prominent public functions.
        </p>
        <RadioGroup value={formData.isPEP ? 'yes' : 'no'} onValueChange={v => updateFormData({ isPEP: v === 'yes' })}>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="pep-no" />
              <Label htmlFor="pep-no" className="text-sm">No, I am not a PEP</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="pep-yes" />
              <Label htmlFor="pep-yes" className="text-sm">Yes, I am a PEP</Label>
            </div>
          </div>
        </RadioGroup>
        {formData.isPEP && (
          <p className="text-xs text-warning font-semibold">⚠ Enhanced due diligence will be applied to your application</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        <Button onClick={nextStep} disabled={!canProceed}>Continue →</Button>
      </div>
    </div>
  );
};

export default StepEmployment;
