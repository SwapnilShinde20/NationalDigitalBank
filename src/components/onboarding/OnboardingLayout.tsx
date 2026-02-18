import { ReactNode } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import ProgressStepper from './ProgressStepper';
import AIAssistantPanel from './AIAssistantPanel';
import { Shield } from 'lucide-react';

const OnboardingLayout = ({ children }: { children: ReactNode }) => {
  const { currentStep } = useOnboarding();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="banking-gradient text-primary-foreground">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">National Digital Bank</h1>
              <p className="text-xs opacity-80">AI-Powered Customer Onboarding</p>
            </div>
          </div>
          <div className="text-right text-xs opacity-80">
            <p>Application Reference</p>
            <p className="font-mono font-bold">NDB-{Date.now().toString().slice(-8)}</p>
          </div>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="bg-card border-b">
        <div className="container max-w-6xl mx-auto px-4">
          <ProgressStepper />
        </div>
      </div>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="bg-card rounded-lg banking-shadow p-6 md:p-8">
          {children}
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>🔒 Your data is encrypted and secured as per RBI guidelines</p>
          <p className="mt-1">Step {currentStep + 1} of 12 · All information is confidential</p>
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistantPanel />
    </div>
  );
};

export default OnboardingLayout;
