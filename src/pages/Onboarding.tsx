import { OnboardingProvider, useOnboarding } from '@/context/OnboardingContext';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ChatbotPopup from '@/components/ChatbotPopup';
import StepWelcome from '@/components/onboarding/StepWelcome';
import StepVerification from '@/components/onboarding/StepVerification';
import StepPersonalInfo from '@/components/onboarding/StepPersonalInfo';
import StepAddress from '@/components/onboarding/StepAddress';
import StepKYC from '@/components/onboarding/StepKYC';
import StepEmployment from '@/components/onboarding/StepEmployment';
import StepRiskProfile from '@/components/onboarding/StepRiskProfile';
import StepNominee from '@/components/onboarding/StepNominee';
import StepServices from '@/components/onboarding/StepServices';
import StepReview from '@/components/onboarding/StepReview';
import StepValidation from '@/components/onboarding/StepValidation';
import StepActivation from '@/components/onboarding/StepActivation';

const steps = [
  StepWelcome, StepVerification, StepPersonalInfo, StepAddress,
  StepKYC, StepEmployment, StepRiskProfile, StepNominee,
  StepServices, StepReview, StepValidation, StepActivation,
];

const OnboardingContent = () => {
  const { currentStep } = useOnboarding();
  const StepComponent = steps[currentStep];

  return (
    <OnboardingLayout>
      <StepComponent />
      <ChatbotPopup currentStep={currentStep} />
    </OnboardingLayout>
  );
};

const Onboarding = () => (
  <OnboardingProvider>
    <OnboardingContent />
  </OnboardingProvider>
);

export default Onboarding;
