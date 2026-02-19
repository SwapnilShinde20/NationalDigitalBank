import { Toaster } from "@/components/ui/toaster";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import EmailVerificationSuccess from "./pages/EmailVerificationSuccess";
import UserDashboard from "./pages/UserDashboard";
import { useOnboarding } from "./context/OnboardingContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, type }: { children: JSX.Element, type: 'user' | 'admin' }) => {
    const { isAuthenticated, isAdmin, authLoading } = useOnboarding();
    
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center banking-gradient">
                <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-semibold text-accent">Securing Session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={type === 'user' ? '/login' : '/admin/login'} replace />;
    }

    if (type === 'admin' && !isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OnboardingProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/email-verified-success" element={<EmailVerificationSuccess />} />
            
            <Route path="/onboarding" element={
                <ProtectedRoute type="user">
                    <Onboarding />
                </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
                <ProtectedRoute type="user">
                    <UserDashboard />
                </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
                <ProtectedRoute type="admin">
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </OnboardingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
