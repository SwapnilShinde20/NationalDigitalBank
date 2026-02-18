import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Smartphone, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/api/axios';
import { useOnboarding } from '@/context/OnboardingContext';

const Login = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { updateFormData } = useOnboarding();
    
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [demoOtp, setDemoOtp] = useState(''); // Store Demo OTP
    const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (mobile.length !== 10) {
            toast({ variant: 'destructive', title: 'Invalid Mobile', description: 'Please enter a valid 10-digit number.' });
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/send-mobile-otp', { mobile });
            setStep('OTP');
            if (res.data.demoOTP) {
                setDemoOtp(res.data.demoOTP);
                // toast({ title: 'OTP Sent', description: `Demo OTP: ${res.data.demoOTP}` }); // Optional: Show in toast too
            }
            toast({ title: 'OTP Sent', description: 'Please check your mobile number.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send OTP.' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return;
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-mobile-otp', { mobile, otp });
            localStorage.setItem('token', res.data.token);
            
            // Update context with basic info
            updateFormData({ mobileNumber: mobile, otpVerified: true });
            
            toast({ title: 'Login Successful', description: 'Redirecting to dashboard...' });
            navigate('/dashboard');
        } catch (e: any) {
            const msg = e.response?.data?.message || 'Invalid OTP';
            toast({ variant: 'destructive', title: 'Verification Failed', description: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen banking-gradient flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-xl banking-shadow-lg overflow-hidden">
                <div className="p-6 bg-accent/5 text-center border-b">
                    <Shield className="w-12 h-12 text-accent mx-auto mb-3" />
                    <h1 className="text-xl font-bold">Secure Login</h1>
                    <p className="text-sm text-muted-foreground">National Digital Bank Onboarding</p>
                </div>
                
                <div className="p-8 space-y-6">
                    {step === 'MOBILE' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Mobile Number</Label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground font-mono text-sm">+91</div>
                                    <Input 
                                        value={mobile} 
                                        onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                                        placeholder="9876543210" 
                                        className="font-mono text-lg"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleSendOtp} disabled={loading || mobile.length !== 10}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4 ml-2" /></>}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-sm text-muted-foreground">OTP sent to +91 {mobile}</p>
                                <button onClick={() => setStep('MOBILE')} className="text-xs text-accent hover:underline">Change Number</button>
                                {demoOtp && (
                                    <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 text-sm font-mono rounded border border-yellow-300">
                                        Use Demo OTP: <strong>{demoOtp}</strong>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Enter OTP</Label>
                                <Input 
                                    value={otp} 
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                                    placeholder="XXXXXX" 
                                    className="font-mono text-center text-2xl tracking-widest"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>
                            <Button className="w-full" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Proceed'}
                            </Button>
                        </div>
                    )}
                    
                    <div className="mt-4 text-center">
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3" /> 256-bit Secure Encryption
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
