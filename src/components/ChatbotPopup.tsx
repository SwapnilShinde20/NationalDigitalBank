import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import api from '@/api/axios';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  proactive?: boolean;
}

interface ChatbotPopupProps {
  currentStep: number;
  applicationId?: string;
}

const stepLabels = [
  'Eligibility', 'Verification', 'Personal Info', 'Address',
  'KYC', 'Employment', 'Risk Profile', 'Nominee',
  'Services', 'Review', 'AI Validation', 'Account Created',
];

const ChatbotPopup = ({ currentStep, applicationId }: ChatbotPopupProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef<number>(-1);
  const initialFetched = useRef(false);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /* ── Fetch proactive guidance when step changes ── */
  const fetchProactiveGuidance = useCallback(async (step: number) => {
    try {
      const res = await api.post('/chatbot/message', {
        currentStep: step,
        applicationId,
      });
      const guidance: Message = {
        role: 'assistant',
        content: res.data.reply,
        proactive: true,
      };
      setMessages(prev => [...prev, guidance]);
      if (!open) setHasNewMessage(true);
    } catch (err) {
      console.error('Chatbot proactive fetch failed:', err);
    }
  }, [applicationId, open]);

  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep;
      if (!initialFetched.current) {
        initialFetched.current = true;
      }
      fetchProactiveGuidance(currentStep);
    }
  }, [currentStep, fetchProactiveGuidance]);

  /* ── Send user message ── */
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', {
        currentStep,
        applicationId,
        userMessage: text,
      });
      const botMsg: Message = { role: 'assistant', content: res.data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't process your request. Please try again!" },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating chat bubble ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setOpen(true); setHasNewMessage(false); }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Bot className="w-6 h-6 text-white" />
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[520px] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/20"
            style={{
              background: 'linear-gradient(180deg, #1a1f2e 0%, #0f1219 100%)',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Assistant</h3>
                  <p className="text-[10px] text-gray-400">
                    Step {currentStep + 1}: {stepLabels[currentStep] || 'Onboarding'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[280px] max-h-[360px]">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Bot className="w-10 h-10 text-gray-600 mb-3" />
                  <p className="text-sm text-gray-400">AI guidance will appear here as you navigate steps.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                    >
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white/10 text-gray-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant'
                      ? renderMarkdown(msg.content)
                      : msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                  >
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-white/10 px-3 py-2 rounded-xl rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-white/10">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
                <input
                  type="text"
                  placeholder="Ask anything about this step..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: input.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent' }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <p className="text-[9px] text-gray-600 text-center mt-1.5">Powered by Groq · llama3-70b</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Simple markdown renderer for bold/bullets ── */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold
    let processed = line.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    // Inline code
    processed = processed.replace(/`(.+?)`/g, '<code>$1</code>');
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: processed }} />
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default ChatbotPopup;
