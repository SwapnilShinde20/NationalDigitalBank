import { ONBOARDING_STEPS, useOnboarding } from '@/context/OnboardingContext';
import { Check, Circle } from 'lucide-react';

const ProgressStepper = () => {
  const { currentStep, completedSteps } = useOnboarding();

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max px-2 py-4">
        {ONBOARDING_STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isPast = index < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted || isPast
                      ? 'bg-success text-success-foreground'
                      : isCurrent
                      ? 'bg-accent text-accent-foreground step-glow'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {isCompleted || isPast ? <Check className="w-4 h-4" /> : <span>{index + 1}</span>}
                </div>
                <span
                  className={`text-[10px] mt-1 text-center max-w-[60px] leading-tight ${
                    isCurrent ? 'text-accent font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < ONBOARDING_STEPS.length - 1 && (
                <div
                  className={`w-6 h-0.5 mx-1 mt-[-14px] transition-colors ${
                    isPast || isCompleted ? 'bg-success' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
