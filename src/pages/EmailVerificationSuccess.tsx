import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const EmailVerificationSuccess = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            <CheckCircle2 className="w-16 h-16 text-success mb-6 animate-in zoom-in duration-500" />
            <h1 className="text-3xl font-bold mb-2">Email Verified Successfully!</h1>
            <p className="text-muted-foreground mb-8 text-lg">
                Your email has been verified. You can now close this tab and return to the onboarding page to continue.
            </p>
            <Button 
                onClick={() => window.close()} 
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full"
            >
                Close Tab
            </Button>
        </div>
    );
};

export default EmailVerificationSuccess;
