import { useEffect } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { generateAccountNumber } from '@/lib/riskEngine';
import { motion } from 'framer-motion';
import { PartyPopper, Download, ArrowRight, Shield, CreditCard, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { jsPDF } from 'jspdf';

const StepActivation = () => {
  const { formData, updateFormData } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    const activateAccount = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!formData.accountNumber) {
          updateFormData({ accountNumber: generateAccountNumber() });
        }
        return;
      }

      try {
        const res = await api.put('/application/update-step', {
          stepName: 'accountDetails',
          data: {
            accountNumber: formData.accountNumber || generateAccountNumber(),
            ifscCode: 'NDB0001234',
            activatedAt: new Date().toISOString(),
            createAccount: true,
          },
          currentStep: 12,
        });
        console.log('Account details saved to MongoDB');

        const savedApp = res.data?.application;
        if (savedApp?.accountDetails?.accountNumber) {
          updateFormData({ accountNumber: savedApp.accountDetails.accountNumber });
        }
      } catch (err) {
        console.error('Failed to save account details:', err);
        if (!formData.accountNumber) {
          updateFormData({ accountNumber: generateAccountNumber() });
        }
      }
    };
    activateAccount();
  }, []);

  const downloadWelcomeKit = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // --- Header ---
    doc.setFillColor(15, 30, 65);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('National Digital Bank', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Welcome Kit - New Account', pageWidth / 2, 28, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Generated on: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), pageWidth / 2, 37, { align: 'center' });

    // --- Account Details ---
    y = 58;
    doc.setTextColor(15, 30, 65);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Details', 20, y);
    y += 3;
    doc.setDrawColor(200, 170, 50);
    doc.setLineWidth(0.8);
    doc.line(20, y, 80, y);

    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const details: [string, string][] = [
      ['Account Holder', formData.fullName || 'Valued Customer'],
      ['Account Number', formData.accountNumber || 'N/A'],
      ['Account Type', (formData.accountType || 'Savings').toUpperCase()],
      ['IFSC Code', 'NDB0001234'],
      ['Branch', 'National Digital Bank - Digital Branch'],
      ['Mobile', formData.mobileNumber || 'N/A'],
      ['Email', formData.email || 'N/A'],
    ];

    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(label + ':', 25, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 30, 65);
      doc.text(String(value), 80, y);
      y += 8;
    });

    // --- Services ---
    y += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 30, 65);
    doc.text('Services Activated', 20, y);
    y += 3;
    doc.setDrawColor(200, 170, 50);
    doc.line(20, y, 85, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const services: [string, string][] = [
      ['Debit Card', formData.debitCardType ? formData.debitCardType.charAt(0).toUpperCase() + formData.debitCardType.slice(1) + ' - delivery in 5-7 days' : 'Classic'],
      ['Internet Banking', formData.internetBanking ? 'Enabled' : 'Disabled'],
      ['SMS Alerts', formData.smsAlerts ? 'Enabled' : 'Disabled'],
      ['Cheque Book', formData.chequeBook ? 'Requested' : 'Not Requested'],
      ['UPI', formData.upiActivation ? 'Activated' : 'Not Activated'],
    ];

    services.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('  ' + label + ':', 25, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 30, 65);
      doc.text(String(value), 80, y);
      y += 8;
    });

    // --- Important Notes ---
    y += 8;
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(15, y - 5, pageWidth - 30, 45, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 30, 65);
    doc.text('Important Information', 20, y + 3);
    y += 12;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const notes = [
      '1. Please visit your nearest branch with original KYC documents within 30 days.',
      '2. Your debit card PIN will be sent separately via registered mobile.',
      '3. Activate Internet Banking using your registered mobile number.',
      '4. For support, call 1800-NDB-1234 (toll-free) or email support@ndb.in',
    ];
    notes.forEach(note => {
      doc.text(note, 22, y);
      y += 7;
    });

    // --- Footer ---
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFillColor(15, 30, 65);
    doc.rect(0, footerY - 5, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('National Digital Bank | CIN: U00000MH2025PLC000001 | RBI Lic: XXXX', pageWidth / 2, footerY + 2, { align: 'center' });
    doc.text('This is a system-generated document. No signature required.', pageWidth / 2, footerY + 8, { align: 'center' });

    // --- Save ---
    doc.save('NDB_Welcome_Kit_' + (formData.accountNumber || 'Account') + '.pdf');
  };

  return (
    <div className="space-y-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <PartyPopper className="w-16 h-16 text-accent mx-auto" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">🎉 Account Successfully Activated!</h2>
        <p className="text-muted-foreground mt-2">Welcome to National Digital Bank, {formData.fullName || 'Valued Customer'}!</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 banking-gradient text-primary-foreground rounded-lg max-w-sm mx-auto banking-shadow-lg"
      >
        <p className="text-xs opacity-80">Your Account Number</p>
        <p className="text-2xl font-bold font-mono tracking-wider mt-1">{formData.accountNumber}</p>
        <div className="mt-3 text-xs opacity-80">
          <p>{formData.accountType?.toUpperCase()} ACCOUNT</p>
          <p>IFSC: NDB0001234</p>
        </div>
      </motion.div>

      {/* Next Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
        <div className="p-3 bg-secondary/50 rounded-lg">
          <CreditCard className="w-5 h-5 text-accent mb-2" />
          <p className="text-xs font-semibold">Debit Card</p>
          <p className="text-xs text-muted-foreground">Will be delivered in 5-7 days</p>
        </div>
        <div className="p-3 bg-secondary/50 rounded-lg">
          <Smartphone className="w-5 h-5 text-accent mb-2" />
          <p className="text-xs font-semibold">Mobile Banking</p>
          <p className="text-xs text-muted-foreground">Download our app to get started</p>
        </div>
        <div className="p-3 bg-secondary/50 rounded-lg">
          <Shield className="w-5 h-5 text-accent mb-2" />
          <p className="text-xs font-semibold">Security</p>
          <p className="text-xs text-muted-foreground">Set up 2FA in Internet Banking</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
        <Button className="w-full gap-2" onClick={downloadWelcomeKit}>
          <Download className="w-4 h-4" /> Download Welcome Kit (PDF)
        </Button>
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full gap-2">
          <ArrowRight className="w-4 h-4" /> Go to Dashboard
        </Button>
        <Button variant="outline" onClick={() => navigate('/')} className="w-full">
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default StepActivation;
