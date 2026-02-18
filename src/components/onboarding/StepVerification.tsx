import { useState, useEffect } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateMobile, validateEmail } from '@/lib/validators';
import { Smartphone, Mail, CheckCircle2, Loader2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const StepVerification = () => {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding();
  
  // Mobile States
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [verifyingMobileOtp, setVerifyingMobileOtp] = useState(false);
  const [mobileDemoOtp, setMobileDemoOtp] = useState('');

  // Email States (Link Flow)
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [sendingEmailLink, setSendingEmailLink] = useState(false);
  const [checkingEmailStatus, setCheckingEmailStatus] = useState(false);

  const { toast } = useToast();

  const mobileValid = validateMobile(formData.mobileNumber);
  const emailValid = validateEmail(formData.email);

  // --- Mobile OTP ---
  const handleSendMobileOTP = async () => {
    try {
      setSendingMobileOtp(true);
      const res = await api.post('/auth/send-otp', { identifier: formData.mobileNumber, type: 'mobile' });
      setMobileOtpSent(true);
      if (res.data.demoOTP) setMobileDemoOtp(res.data.demoOTP);
      toast({ title: 'OTP Sent', description: 'Please check your mobile number.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send OTP' });
    } finally {
      setSendingMobileOtp(false);
    }
  };

  const handleVerifyMobileOTP = async () => {
    try {
      setVerifyingMobileOtp(true);
      const res = await api.post('/auth/verify-otp', { identifier: formData.mobileNumber, type: 'mobile', otp: mobileOtp });
      localStorage.setItem('token', res.data.token);
      updateFormData({ otpVerified: true });
      toast({ title: 'Verified', description: 'Mobile number verified successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: 'Please try again.' });
    } finally {
      setVerifyingMobileOtp(false);
    }
  };

  // --- Email Verification Link ---
  const handleSendEmailLink = async () => {
    try {
      setSendingEmailLink(true);
      // We pass mobile number as well to help backend identify the user if email is not yet linked
      const res = await api.post('/auth/send-email-verification', { 
        email: formData.email,
        mobile: formData.mobileNumber 
      });
      
      if (res.data.alreadyVerified) {
          updateFormData({ emailVerified: true });
          toast({ title: 'Verified', description: 'Email is already verified.' });
      } else {
          setEmailLinkSent(true);
          toast({ title: 'Link Sent', description: 'Verification link sent to your email.' });
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
          toast({ variant: 'destructive', title: 'Error', description: error.response.data.message });
      } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to send verification link' });
      }
    } finally {
      setSendingEmailLink(false);
    }
  };

  const checkEmailStatus = async () => {
      try {
        setCheckingEmailStatus(true);
        // fetch the latest user profile
        const res = await api.get('/auth/me');
        const user = res.data.user;

        if (user && user.emailVerified) {
             updateFormData({ emailVerified: true });
             toast({ title: 'Success', description: 'Email verified successfully!' });
        } else {
             toast({ variant: 'destructive', title: 'Not Verified', description: 'Email is not yet verified. Please click the link in your email.' });
        }
      } catch (err) {
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to check status.' });
      } finally {
        setCheckingEmailStatus(false);
      }
  };

  const canProceed = formData.otpVerified && formData.emailVerified;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Mobile & Email Verification</h2>
          <p className="text-sm text-muted-foreground">Verify your contact details to continue</p>
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
        <Label className="text-sm font-semibold">Mobile Number *</Label>
        <div className="flex gap-2">
          <span className="flex items-center px-3 bg-secondary rounded-md text-sm font-mono">+91</span>
          <Input
            value={formData.mobileNumber}
            onChange={e => updateFormData({ mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder="9876543210"
            disabled={formData.otpVerified}
            className="font-mono"
          />
          {!formData.otpVerified && (
            <Button onClick={handleSendMobileOTP} disabled={!mobileValid.valid || sendingMobileOtp} size="sm">
              {sendingMobileOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
            </Button>
          )}
        </div>
        {mobileDemoOtp && !formData.otpVerified && (
          <div className="text-[10px] font-mono text-accent/70 bg-accent/5 p-1 rounded inline-block">
            DEBUG: Mobile OTP is {mobileDemoOtp}
          </div>
        )}

        {mobileOtpSent && !formData.otpVerified && (
          <div className="flex gap-2 mt-2">
            <Input
              value={mobileOtp}
              onChange={e => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="font-mono max-w-[200px]"
            />
            <Button onClick={handleVerifyMobileOTP} disabled={mobileOtp.length !== 6 || verifyingMobileOtp} size="sm">
              {verifyingMobileOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </Button>
          </div>
        )}

        {formData.otpVerified && (
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle2 className="w-4 h-4" /> Mobile verified successfully
          </div>
        )}
      </div>

      {/* Email Verification Link Flow */}
      <div className="space-y-3 p-4 bg-secondary/50 rounded-lg">
        <Label className="text-sm font-semibold">Email Address *</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            value={formData.email}
            onChange={e => updateFormData({ email: e.target.value })}
            placeholder="your@email.com"
            disabled={formData.emailVerified || emailLinkSent}
          />
          {!formData.emailVerified && !emailLinkSent && (
            <Button onClick={handleSendEmailLink} disabled={!emailValid.valid || sendingEmailLink} size="sm">
              {sendingEmailLink ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Link'}
            </Button>
          )}
        </div>

        {emailLinkSent && !formData.emailVerified && (
          <div className="mt-3 p-3 bg-accent/10 rounded-md border border-accent/20">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-accent mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Verification Link Sent!</p>
                <p className="text-xs text-muted-foreground">
                  We've sent a secure link to <span className="font-semibold text-foreground">{formData.email}</span>. 
                  Please check your inbox and click the link to verify.
                </p>
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" size="sm" onClick={checkEmailStatus} className="text-xs h-8">
                        {checkingEmailStatus ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                        I have verified
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSendEmailLink} className="text-xs h-8 text-muted-foreground" disabled={sendingEmailLink}>
                        Resend Link
                    </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.emailVerified && (
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle2 className="w-4 h-4" /> Email verified successfully
          </div>
        )}
      </div>

      <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground flex items-center gap-2">
        🔐 Device binding: This session is bound to your current device for security.
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        <Button onClick={nextStep} disabled={!canProceed}>Continue →</Button>
      </div>
    </div>
  );
};

export default StepVerification;
