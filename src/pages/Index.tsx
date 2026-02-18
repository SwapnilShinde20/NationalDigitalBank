import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Brain, Lock, FileCheck2, Users, BarChart3, Smartphone } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI-Powered KYC', desc: 'OCR document extraction and liveness detection' },
  { icon: Lock, title: 'Secure & Compliant', desc: 'End-to-end encryption, RBI-grade security' },
  { icon: FileCheck2, title: 'Smart Validation', desc: 'Real-time PAN, Aadhaar, and address verification' },
  { icon: BarChart3, title: 'Risk Profiling', desc: 'Automated AML screening and fraud detection' },
  { icon: Users, title: 'Admin Dashboard', desc: 'Complete officer view with case management' },
  { icon: Smartphone, title: 'Digital First', desc: 'Fully paperless onboarding experience' },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="banking-gradient text-primary-foreground">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">National Digital Bank</h1>
              <p className="text-xs opacity-80">Ministry of Finance, Government of India</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="text-primary-foreground border-primary-foreground/30 bg-primary-foreground/10"
          >
            Admin Panel
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="banking-gradient text-primary-foreground pb-16 pt-12">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-6">
            <Brain className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-accent">AI-Powered Intelligent Onboarding</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Open Your Bank Account<br />
            <span className="text-accent">100% Digital. AI Verified.</span>
          </h2>
          <p className="text-sm md:text-base opacity-80 max-w-xl mx-auto mb-8">
            Experience the future of banking with our AI-powered digital account opening platform.
            Complete KYC, risk assessment, and account activation — all in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="banking-gradient-gold text-accent-foreground font-bold px-8 hover:opacity-90"
            >
              Open Account Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/admin/login')}
              className="text-primary-foreground border-primary-foreground/30 bg-primary-foreground/10"
            >
              Bank Officer Login
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-card border-b">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">🔒 256-bit SSL Encryption</span>
          <span className="flex items-center gap-1">🏛️ RBI Compliant</span>
          <span className="flex items-center gap-1">📋 PMLA Adherent</span>
          <span className="flex items-center gap-1">🛡️ ISO 27001 Certified</span>
          <span className="flex items-center gap-1">🤖 AI/ML Powered</span>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-4xl mx-auto px-4 py-16">
        <h3 className="text-xl font-bold text-center mb-8">Intelligent Onboarding Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="p-5 bg-card rounded-lg banking-shadow hover:banking-shadow-lg transition-shadow">
              <f.icon className="w-8 h-8 text-accent mb-3" />
              <h4 className="font-bold text-sm mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-secondary/50 py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <h3 className="text-xl font-bold text-center mb-8">12-Step Compliance Workflow</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Eligibility Check', 'Mobile & Email OTP', 'Personal Info', 'Address Details',
              'KYC Verification', 'Employment Details', 'Risk Profiling', 'Nominee Details',
              'Services Selection', 'Document Review', 'AI Validation', 'Account Activation',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-card rounded-lg">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="banking-gradient text-primary-foreground py-8">
        <div className="container max-w-4xl mx-auto px-4 text-center text-xs opacity-70">
          <p>© 2025 National Digital Bank — AI-Powered Intelligent Customer Onboarding System</p>
          <p className="mt-1">This is a prototype demonstration. Not an actual banking service.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
