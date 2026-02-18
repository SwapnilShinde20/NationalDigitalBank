import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Wifi, MessageSquare, BookOpen, Smartphone } from 'lucide-react';

const cardTypes = [
  { value: 'classic', label: 'Classic', desc: 'Standard debit card', limit: '₹25,000/day' },
  { value: 'gold', label: 'Gold', desc: 'Enhanced benefits', limit: '₹50,000/day' },
  { value: 'platinum', label: 'Platinum', desc: 'Premium privileges', limit: '₹1,00,000/day' },
];

const StepServices = () => {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Banking Services Selection</h2>
          <p className="text-sm text-muted-foreground">Choose the services you want activated</p>
        </div>
      </div>

      {/* Debit Card */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Debit Card Type</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cardTypes.map(card => (
            <button
              key={card.value}
              onClick={() => updateFormData({ debitCardType: card.value })}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                formData.debitCardType === card.value
                  ? 'border-accent bg-accent/10 step-glow'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <CreditCard className={`w-5 h-5 mb-2 ${formData.debitCardType === card.value ? 'text-accent' : 'text-muted-foreground'}`} />
              <p className="font-bold text-sm">{card.label}</p>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
              <p className="text-xs font-mono mt-1 text-foreground">Limit: {card.limit}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-info" />
            <div>
              <p className="text-sm font-semibold">Internet Banking</p>
              <p className="text-xs text-muted-foreground">Access your account online 24/7</p>
            </div>
          </div>
          <Switch checked={formData.internetBanking} onCheckedChange={v => updateFormData({ internetBanking: v })} />
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-info" />
            <div>
              <p className="text-sm font-semibold">SMS Alerts</p>
              <p className="text-xs text-muted-foreground">Transaction alerts on mobile</p>
            </div>
          </div>
          <Switch checked={formData.smsAlerts} onCheckedChange={v => updateFormData({ smsAlerts: v })} />
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-info" />
            <div>
              <p className="text-sm font-semibold">Cheque Book</p>
              <p className="text-xs text-muted-foreground">Request cheque book delivery</p>
            </div>
          </div>
          <Switch checked={formData.chequeBook} onCheckedChange={v => updateFormData({ chequeBook: v })} />
        </div>

        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-info" />
            <div>
              <p className="text-sm font-semibold">UPI Activation</p>
              <p className="text-xs text-muted-foreground">Enable UPI payments via linked mobile</p>
            </div>
          </div>
          <Switch checked={formData.upiActivation} onCheckedChange={v => updateFormData({ upiActivation: v })} />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        <Button onClick={nextStep}>Continue →</Button>
      </div>
    </div>
  );
};

export default StepServices;
