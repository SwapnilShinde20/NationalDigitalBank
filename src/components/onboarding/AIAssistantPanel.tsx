import { useState } from 'react';
import { useOnboarding, ONBOARDING_STEPS } from '@/context/OnboardingContext';
import { MessageCircle, X, Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const stepTips: Record<number, string[]> = {
  0: ['Select the account type that best suits your needs.', 'Savings accounts are ideal for personal use.', 'Current accounts are for business transactions.'],
  1: ['Enter your registered mobile number.', 'You will receive an OTP for verification.', 'Make sure you have access to your phone.'],
  2: ['Enter your full legal name as per your PAN card.', 'Date of birth must match your documents.', 'All fields marked with * are mandatory.'],
  3: ['Enter your current residential address.', 'Use the pincode for auto-fill feature.', 'Permanent address is needed for KYC compliance.'],
  4: ['Upload clear images of your PAN and Aadhaar.', 'Our AI will auto-extract details from documents.', 'Ensure documents are not blurred or cropped.'],
  5: ['Select your current employment status.', 'PEP declaration is mandatory per RBI norms.', 'Source of income helps in risk assessment.'],
  6: ['AI is analyzing your risk profile automatically.', 'Risk scoring considers multiple compliance factors.', 'Low risk applications are auto-approved.'],
  7: ['Nominee details are important for your account.', 'You can update nominee details later as well.'],
  8: ['Select banking services you wish to activate.', 'UPI and Internet Banking are recommended.', 'Debit card will be delivered to your address.'],
  9: ['Review all details carefully before submission.', 'You can edit any section by clicking the edit button.', 'Ensure compliance meter shows green.'],
  10: ['AI is performing final compliance validation.', 'This may take a few moments.', 'High risk cases are escalated to bank officers.'],
  11: ['Congratulations! Your account is ready.', 'Download your welcome kit for reference.', 'You can start using digital banking services.'],
};

const AIAssistantPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: 'bot' | 'user'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const { currentStep } = useOnboarding();

  const tips = stepTips[currentStep] || ['How can I help you today?'];

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user' as const, text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    const token = localStorage.getItem('token');
    if (!token) {
        setMessages(prev => [...prev, { from: 'bot', text: "Please complete the Mobile Verification step first to securely access the AI assistant." }]);
        return;
    }
    
    try {
        // Prepare history for context
        const history = messages.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
        
        const res = await import('@/api/axios').then(m => m.default.post('/chat', { message: input, history }));
        
        setMessages(prev => [...prev, { from: 'bot', text: res.data.reply }]);
    } catch (e: any) {
        if (e.response?.status === 401) {
             setMessages(prev => [...prev, { from: 'bot', text: "Session expired. Please refresh the page or verify mobile again." }]);
        } else {
             setMessages(prev => [...prev, { from: 'bot', text: "I'm having trouble connecting to the bank server. Please try again." }]);
        }
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full banking-gradient text-primary-foreground flex items-center justify-center banking-shadow-lg hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-[460px] bg-card rounded-lg banking-shadow-lg border flex flex-col overflow-hidden">
          <div className="banking-gradient text-primary-foreground p-3 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <div>
              <p className="text-sm font-bold">AI Banking Assistant</p>
              <p className="text-[10px] opacity-80">Powered by NDB Intelligence</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Step tips */}
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-xs font-semibold text-foreground mb-2">
                💡 Tips for: {ONBOARDING_STEPS[currentStep]?.title}
              </p>
              {tips.map((tip, i) => (
                <p key={i} className="text-xs text-muted-foreground mb-1">• {tip}</p>
              ))}
            </div>

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                    msg.from === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="text-xs h-8"
            />
            <Button size="sm" onClick={handleSend} className="h-8 w-8 p-0">
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantPanel;
