import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

const StepPersonalInfo = () => {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding();

  const canProceed = formData.fullName && formData.dob && formData.gender && formData.fatherName && formData.occupation && formData.annualIncome;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
          <p className="text-sm text-muted-foreground">Enter your identity details as per official documents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold">Full Name (as per PAN) *</Label>
          <Input value={formData.fullName} onChange={e => updateFormData({ fullName: e.target.value })} placeholder="RAJESH KUMAR SINGH" className="uppercase" />
          {formData.fullName && <p className="text-xs text-success mt-1">✓ Valid</p>}
        </div>
        <div>
          <Label className="text-xs font-semibold">Date of Birth *</Label>
          <Input type="date" value={formData.dob} onChange={e => updateFormData({ dob: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Gender *</Label>
          <Select value={formData.gender} onValueChange={v => updateFormData({ gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Marital Status</Label>
          <Select value={formData.maritalStatus} onValueChange={v => updateFormData({ maritalStatus: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Father's Name *</Label>
          <Input value={formData.fatherName} onChange={e => updateFormData({ fatherName: e.target.value })} placeholder="Father's full name" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Mother's Name</Label>
          <Input value={formData.motherName} onChange={e => updateFormData({ motherName: e.target.value })} placeholder="Mother's full name" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Occupation *</Label>
          <Select value={formData.occupation} onValueChange={v => updateFormData({ occupation: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="salaried">Salaried</SelectItem>
              <SelectItem value="self-employed">Self-Employed</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="homemaker">Homemaker</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Annual Income Range *</Label>
          <Select value={formData.annualIncome} onValueChange={v => updateFormData({ annualIncome: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="below-1l">Below ₹1 Lakh</SelectItem>
              <SelectItem value="1l-2.5l">₹1 - 2.5 Lakhs</SelectItem>
              <SelectItem value="2.5l-5l">₹2.5 - 5 Lakhs</SelectItem>
              <SelectItem value="5l-10l">₹5 - 10 Lakhs</SelectItem>
              <SelectItem value="10l-25l">₹10 - 25 Lakhs</SelectItem>
              <SelectItem value="25l-50l">₹25 - 50 Lakhs</SelectItem>
              <SelectItem value="above-50l">Above ₹50 Lakhs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        <Button onClick={nextStep} disabled={!canProceed}>Continue →</Button>
      </div>
    </div>
  );
};

export default StepPersonalInfo;
