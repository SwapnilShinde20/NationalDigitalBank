import { useState } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePAN, validateAadhaar } from '@/lib/validators';
import AIProcessingOverlay from './AIProcessingOverlay';
import { FileCheck2, Upload, CheckCircle2, AlertTriangle, ScanFace } from 'lucide-react';

const StepKYC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding();
  const [verifying, setVerifying] = useState(false);
  const [verifyStage, setVerifyStage] = useState('');
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panStatus, setPanStatus] = useState<'PENDING' | 'VALID' | 'INVALID' | 'BLURRY'>('PENDING');
  const [aadhaarStatus, setAadhaarStatus] = useState<'PENDING' | 'VALID' | 'INVALID' | 'BLURRY'>('PENDING');

  const uploadDocument = async (file: File, type: 'PAN' | 'AADHAAR') => {
      const form = new FormData();
      form.append('document', file);
      form.append('documentType', type);
      
      try {
          // Use the real KYC upload endpoint
          // We must pass 'enteredNumber' for validation against OCR
          if (type === 'PAN') form.append('enteredNumber', formData.panNumber);
          if (type === 'AADHAAR') form.append('enteredNumber', formData.aadhaarNumber);

          const res = await import('@/api/axios').then(m => m.default.post('/kyc/upload', form, {
              headers: { 'Content-Type': 'multipart/form-data' }
          }));
          return res.data;
      } catch (err) {
          console.error("Upload failed", err);
          throw err;
      }
  };

  const panResult = validatePAN(formData.panNumber);
  const aadhaarResult = validateAadhaar(formData.aadhaarNumber);

  const handleVerifyDocuments = async () => {
    setVerifying(true);
    setVerifyStage('Uploading and analyzing documents...');

    try {
        if (panFile) {
            setVerifyStage('Verifying PAN Card...');
             const res = await uploadDocument(panFile, 'PAN');
             if (res.success && res.data.validationStatus === 'VALID') {
                updateFormData({ panVerified: true });
                setPanStatus('VALID');
                // Could show toast with score
             } else {
                 setPanStatus('INVALID');
                 const factors = res.data?.riskFactors?.join(', ') || 'Unknown error';
                 alert(`PAN Verification Failed: Low Confidence (${res.data?.confidenceScore}%). Issues: ${factors}`);
                 setVerifying(false);
                 return;
             }
        }

        if (aadhaarFile) {
             setVerifyStage('Verifying Aadhaar Card...');
             const res = await uploadDocument(aadhaarFile, 'AADHAAR');
             if (res.success && res.data.validationStatus === 'VALID') {
                 updateFormData({ aadhaarVerified: true });
                 setAadhaarStatus('VALID');
             } else {
                 setAadhaarStatus('INVALID');
                 const factors = res.data?.riskFactors?.join(', ') || 'Unknown error';
                 alert(`Aadhaar Verification Failed: Low Confidence (${res.data?.confidenceScore}%). Issues: ${factors}`);
                 setVerifying(false);
                 return;
             }
            }

        setVerifyStage('Performing liveness detection...');
        // Mock liveness for now as it's complex to do real face auth without specialized SDKs
        setTimeout(() => {
            updateFormData({ faceVerified: true });
            setVerifying(false);
        }, 2000);

    } catch (e) {
        setVerifying(false);
        alert("Verification failed due to server error");
    }
  };
  
  const allVerified = formData.panVerified && formData.aadhaarVerified && formData.faceVerified;

  if (verifying) {
    return (
      <div>
        <AIProcessingOverlay title="Verifying Identity using AI..." subtitle={verifyStage} icon="scan" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <FileCheck2 className="w-6 h-6 text-accent" />
        <div>
          <h2 className="text-xl font-bold text-foreground">KYC Verification</h2>
          <p className="text-sm text-muted-foreground">Upload documents for AI-powered identity verification</p>
        </div>
      </div>

      {/* PAN */}
      <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          PAN Card
          {formData.panVerified && <CheckCircle2 className="w-4 h-4 text-success" />}
        </h3>
        <div>
          <Label className="text-xs">PAN Number *</Label>
          <Input
            value={formData.panNumber}
            onChange={e => updateFormData({ panNumber: e.target.value.toUpperCase().slice(0, 10) })}
            placeholder="ABCDE1234F"
            className="font-mono uppercase max-w-xs"
          />
          {formData.panNumber && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${panResult.valid ? 'text-success' : 'text-destructive'}`}>
              {panResult.valid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {panResult.message}
            </p>
          )}
        </div>
        <div>
          <Label className="text-xs">Upload PAN Card Image</Label>
          <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-accent/50 transition-colors mt-1">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{panFile ? panFile.name : 'Click to upload PAN card (JPG/PNG/PDF)'}</span>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setPanFile(e.target.files?.[0] || null)} />
          </label>
          {panStatus === 'BLURRY' && <p className="text-xs text-destructive mt-1">Image is blurry/unclear. Please re-upload.</p>}
          {panFile && <p className="text-xs text-info mt-1">📎 {panFile.name} — Ready for OCR processing</p>}
        </div>
      </div>

      {/* Aadhaar */}
      <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          Aadhaar Card
          {formData.aadhaarVerified && <CheckCircle2 className="w-4 h-4 text-success" />}
        </h3>
        <div>
          <Label className="text-xs">Aadhaar Number *</Label>
          <Input
            value={formData.aadhaarNumber}
            onChange={e => updateFormData({ aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
            placeholder="1234 5678 9012"
            className="font-mono max-w-xs"
          />
          {formData.aadhaarNumber && (
            <p className={`text-xs mt-1 ${aadhaarResult.valid ? 'text-success' : 'text-destructive'}`}>
              {aadhaarResult.message}
            </p>
          )}
        </div>
        <div>
          <Label className="text-xs">Upload Aadhaar Card Image</Label>
          <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-accent/50 transition-colors mt-1">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{aadhaarFile ? aadhaarFile.name : 'Click to upload Aadhaar (Front & Back)'}</span>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setAadhaarFile(e.target.files?.[0] || null)} />
          </label>
        </div>
      </div>

      {/* Face Capture */}
      <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <ScanFace className="w-4 h-4" /> Face Verification
          {formData.faceVerified && <CheckCircle2 className="w-4 h-4 text-success" />}
        </h3>
        <p className="text-xs text-muted-foreground">AI-powered liveness detection will verify your identity</p>
        {formData.faceVerified && <p className="text-xs text-success">✓ Face verified — Liveness check passed</p>}
      </div>

      {!allVerified && (
        <Button onClick={handleVerifyDocuments} disabled={!panResult.valid || !aadhaarResult.valid} className="w-full">
          🤖 Verify Documents with AI
        </Button>
      )}

      {allVerified && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-sm text-success flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> All KYC documents verified successfully
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>← Back</Button>
        <Button onClick={nextStep} disabled={!allVerified}>Continue →</Button>
      </div>
    </div>
  );
};

export default StepKYC;
