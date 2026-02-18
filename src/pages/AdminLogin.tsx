import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Lock, Loader2 } from 'lucide-react';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('token', data.token);
                toast({ title: 'Welcome Officer', description: 'Access granted to Admin Panel.' });
                navigate('/admin');
            } else {
                toast({ variant: 'destructive', title: 'Access Denied', description: data.message || 'Invalid credentials.' });
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error', description: 'Server unavailable.' });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden text-slate-200">
                <div className="p-6 bg-slate-950 text-center border-b border-slate-800">
                    <Shield className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h1 className="text-xl font-bold">Restricted Access</h1>
                    <p className="text-sm text-slate-400">Bank Officer Portal</p>
                    <div>mail-admin@ndb.gov.in</div>
                    <div>admin123</div>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Officer Email</Label>
                            <Input 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                placeholder="admin@ndb.gov.in" 
                                className="bg-slate-950 border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input 
                                type="password"
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="••••••••" 
                                className="bg-slate-950 border-slate-700"
                            />
                        </div>
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleLogin} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Login to Console <Lock className="w-4 h-4 ml-2" /></>}
                        </Button>
                    </div>
                    
                    <div className="mt-4 text-center">
                        <p className="text-xs text-slate-500">
                            Unauthorized access is a punishable offense under IT Act.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
