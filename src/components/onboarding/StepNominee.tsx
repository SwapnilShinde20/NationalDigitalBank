import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

const StepNominee = () => {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Nominee Details</h2>
          <p className="text-sm text-muted-foreground">Add a nominee for your bank account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold">Nominee Full Name</Label>
          <Input value={formData.nomineeName} onChange={e => updateFormData({ nomineeName: e.target.value })} placeholder="Full legal name" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Relationship</Label>
          <Select value={formData.nomineeRelationship} onValueChange={v => updateFormData({ nomineeRelationship: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="spouse">Spouse</SelectItem>
              <SelectItem value="father">Father</SelectItem>
              <SelectItem value="mother">Mother</SelectItem>
              <SelectItem value="son">Son</SelectItem>
              <SelectItem value="daughter">Daughter</SelectItem>
              <SelectItem value="brother">Brother</SelectItem>
              <SelectItem value="sister">Sister</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Nominee Date of Birth</Label>
          <Input type="date" value={formData.nomineeDOB} onChange={e => updateFormData({ nomineeDOB: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs font-semibold">Nominee Address</Label>
          <Input value={formData.nomineeAddress} onChange={e => updateFormData({ nomineeAddress: e.target.value })} placeholder="Full address" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">ℹ Nominee details can be updated later through Internet Banking or branch visit.</p>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        <Button onClick={nextStep}>Continue →</Button>
      </div>
    </div>
  );
};

export default StepNominee;
