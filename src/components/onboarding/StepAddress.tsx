import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { validatePincode } from '@/lib/validators';
import { MapPin } from 'lucide-react';

const StepAddress = () => {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding();

  const handleCurrentPincode = (pin: string) => {
    updateFormData({ currentPincode: pin });
    const result = validatePincode(pin);
    if (result.city && result.state) {
      updateFormData({ currentCity: result.city, currentState: result.state });
    }
  };

  const handlePermanentPincode = (pin: string) => {
    updateFormData({ permanentPincode: pin });
    const result = validatePincode(pin);
    if (result.city && result.state) {
      updateFormData({ permanentCity: result.city, permanentState: result.state });
    }
  };

  const handleSameAddress = (checked: boolean) => {
    updateFormData({
      sameAsCurrent: checked,
      ...(checked ? {
        permanentAddressLine1: formData.currentAddressLine1,
        permanentAddressLine2: formData.currentAddressLine2,
        permanentCity: formData.currentCity,
        permanentState: formData.currentState,
        permanentPincode: formData.currentPincode,
      } : {}),
    });
  };

  const canProceed = formData.currentAddressLine1 && formData.currentCity && formData.currentState && formData.currentPincode;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <MapPin className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Address Details</h2>
          <p className="text-sm text-muted-foreground">Enter residential address for correspondence</p>
        </div>
      </div>

      {/* Current Address */}
      <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
        <h3 className="text-sm font-bold text-foreground">Current / Communication Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label className="text-xs">Address Line 1 *</Label>
            <Input value={formData.currentAddressLine1} onChange={e => updateFormData({ currentAddressLine1: e.target.value })} placeholder="House/Flat No., Building Name" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Address Line 2</Label>
            <Input value={formData.currentAddressLine2} onChange={e => updateFormData({ currentAddressLine2: e.target.value })} placeholder="Street, Area, Landmark" />
          </div>
          <div>
            <Label className="text-xs">PIN Code *</Label>
            <Input value={formData.currentPincode} onChange={e => handleCurrentPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="110001" className="font-mono" />
            {formData.currentPincode?.length === 6 && (
              <p className="text-xs text-success mt-1">{validatePincode(formData.currentPincode).message}</p>
            )}
          </div>
          <div>
            <Label className="text-xs">City *</Label>
            <Input value={formData.currentCity} onChange={e => updateFormData({ currentCity: e.target.value })} placeholder="City" />
          </div>
          <div>
            <Label className="text-xs">State *</Label>
            <Input value={formData.currentState} onChange={e => updateFormData({ currentState: e.target.value })} placeholder="State" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="same-addr" checked={formData.sameAsCurrent} onCheckedChange={v => handleSameAddress(!!v)} />
        <Label htmlFor="same-addr" className="text-sm">Permanent address same as current address</Label>
      </div>

      {!formData.sameAsCurrent && (
        <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
          <h3 className="text-sm font-bold text-foreground">Permanent Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label className="text-xs">Address Line 1 *</Label>
              <Input value={formData.permanentAddressLine1} onChange={e => updateFormData({ permanentAddressLine1: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Address Line 2</Label>
              <Input value={formData.permanentAddressLine2} onChange={e => updateFormData({ permanentAddressLine2: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">PIN Code *</Label>
              <Input value={formData.permanentPincode} onChange={e => handlePermanentPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="font-mono" />
            </div>
            <div>
              <Label className="text-xs">City *</Label>
              <Input value={formData.permanentCity} onChange={e => updateFormData({ permanentCity: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">State *</Label>
              <Input value={formData.permanentState} onChange={e => updateFormData({ permanentState: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        <Button onClick={nextStep} disabled={!canProceed}>Continue →</Button>
      </div>
    </div>
  );
};

export default StepAddress;
