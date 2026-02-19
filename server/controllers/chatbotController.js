const Groq = require('groq-sdk');
const Application = require('../models/Application');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ── Proactive guidance messages per onboarding step ── */
const stepGuidance = {
  eligibility:
    "👋 Welcome! Let's get started with your **account opening**.\n\n" +
    "In this step you'll choose your **account type** (Savings / Current) and confirm your **residency status**.\n\n" +
    "✅ **Tip:** Ensure you have your **PAN** and **Aadhaar** handy — you'll need them shortly!",

  verification:
    "📱 Time to **verify your identity**!\n\n" +
    "• Enter your **mobile number** — we'll send an OTP.\n" +
    "• Add your **email address** for communication.\n\n" +
    "🔒 Your data is protected with bank-grade encryption.",

  personalInfo:
    "📝 Please fill in your **personal details**.\n\n" +
    "We need: **Full Name**, **Date of Birth**, **Gender**, **Marital Status**, **Father/Mother's name**, **Occupation**, and **Annual Income**.\n\n" +
    "💡 **Tip:** Use your name exactly as it appears on your PAN card.",

  address:
    "🏠 Enter your **current address**.\n\n" +
    "Include **Address Line 1 & 2**, **City**, **State**, and **PIN Code**.\n\n" +
    "📌 A complete address helps speed up verification!",

  kyc:
    "🪪 Now for **KYC Verification** — the most important step!\n\n" +
    "Upload clear images of:\n" +
    "• **PAN Card** — for tax identification\n" +
    "• **Aadhaar Card** — for identity & address\n\n" +
    "📄 Supported formats: JPG, PNG, PDF (max 5 MB).\n" +
    "⚡ Our AI will verify your documents instantly!\n\n" +
    "⚠️ **Important:** The name and date of birth on your documents must match the personal info you entered. Mismatched documents will be flagged.",

  employment:
    "💼 Tell us about your **employment & income**.\n\n" +
    "Select your **employment type**, **employer name** (if applicable), **source of income**, and **tax residency**.\n\n" +
    "⚠️ If you are a **Politically Exposed Person (PEP)**, please disclose — it's a regulatory requirement.",

  riskProfile:
    "🛡️ Your **risk profile** is being calculated automatically.\n\n" +
    "This step evaluates:\n" +
    "• KYC verification status\n" +
    "• Income level\n" +
    "• PEP declaration\n" +
    "• Contact verification\n\n" +
    "📊 Lower risk = faster approval! You can review the results here.",

  nominee:
    "👥 Add a **nominee** for your account.\n\n" +
    "Provide the nominee's **full name**, **relationship**, and **date of birth**.\n\n" +
    "💡 A nominee ensures smooth account management in emergencies.",

  services:
    "🎯 Choose the **banking services** you'd like:\n\n" +
    "• **Debit Card** — Classic, Gold, or Platinum\n" +
    "• **Internet Banking** — 24/7 online access\n" +
    "• **SMS Alerts** — Real-time notifications\n" +
    "• **Cheque Book** — On request\n" +
    "• **UPI Activation** — Instant payments\n\n" +
    "You can change these later from your dashboard.",

  review:
    "📋 Almost done! **Review all your information** carefully.\n\n" +
    "Check every section — personal details, address, KYC, employment, nominee, and services.\n\n" +
    "✏️ You can go back to any step to make corrections before submitting.",

  compliance:
    "🤖 Your application is being **validated by our AI engine**.\n\n" +
    "The system checks:\n" +
    "• ✅ Document completeness\n" +
    "• ✅ KYC verification status\n" +
    "• ✅ Risk assessment\n" +
    "• ✅ Regulatory compliance\n\n" +
    "⏳ This usually takes just a few seconds!",

  accountCreated:
    "🎉 **Congratulations!** Your application has been submitted!\n\n" +
    "Our bank officer will review your application and make a decision.\n" +
    "You'll be notified once your account is **approved and activated**.\n\n" +
    "🏦 Thank you for choosing **National Digital Bank**!",
};

/* ── Step index → step name mapping ── */
const stepIndexToName = [
  'eligibility', 'verification', 'personalInfo', 'address',
  'kyc', 'employment', 'riskProfile', 'nominee',
  'services', 'review', 'compliance', 'accountCreated',
];

/* ── Main handler ── */
exports.message = async (req, res) => {
  const { currentStep, applicationId, userMessage } = req.body;
  const userId = req.user.userId;

  try {
    // 1. Determine step name
    const stepName =
      typeof currentStep === 'number'
        ? stepIndexToName[currentStep] || 'eligibility'
        : currentStep || 'eligibility';

    // 2. If no userMessage → return proactive guidance
    if (!userMessage || !userMessage.trim()) {
      let guidance = stepGuidance[stepName] || stepGuidance.eligibility;

      // Check for identity mismatch and add proactive warning
      if (stepName === 'kyc' || stepName === 'riskProfile') {
        const app = applicationId
          ? await Application.findById(applicationId)
          : await Application.findOne({ userId });

        if (app && app.kyc && app.kyc.identityMismatch) {
          let mismatchDetails = '\n\n🚨 **Identity Mismatch Detected!**\n\n';
          mismatchDetails += 'Our AI found that the documents you uploaded **do not match** your personal information:\n\n';
          
          if (app.kyc.panExtractedName && app.personalInfo?.fullName) {
            mismatchDetails += `• **PAN Name:** ${app.kyc.panExtractedName} vs **Your Name:** ${app.personalInfo.fullName}\n`;
          }
          if (app.kyc.aadhaarExtractedName && app.personalInfo?.fullName) {
            mismatchDetails += `• **Aadhaar Name:** ${app.kyc.aadhaarExtractedName} vs **Your Name:** ${app.personalInfo.fullName}\n`;
          }
          if (app.kyc.panExtractedDOB && app.personalInfo?.dob) {
            mismatchDetails += `• **PAN DOB:** ${app.kyc.panExtractedDOB} vs **Your DOB:** ${new Date(app.personalInfo.dob).toLocaleDateString()}\n`;
          }
          if (app.kyc.aadhaarExtractedDOB && app.personalInfo?.dob) {
            mismatchDetails += `• **Aadhaar DOB:** ${app.kyc.aadhaarExtractedDOB} vs **Your DOB:** ${new Date(app.personalInfo.dob).toLocaleDateString()}\n`;
          }
          
          mismatchDetails += '\n❌ **This will significantly increase your risk score** and may result in application rejection.\n';
          mismatchDetails += '\n✅ **What to do:** Go back and upload documents that belong to **you** — with a name and DOB matching your personal details.';
          
          guidance += mismatchDetails;
        }
      }

      return res.json({
        reply: guidance,
        step: stepName,
        proactive: true,
      });
    }

    // 3. Reactive: user asked a question → call Groq
    const application = applicationId
      ? await Application.findById(applicationId)
      : await Application.findOne({ userId });

    let systemPrompt =
      'You are an intelligent banking onboarding assistant guiding users securely through account opening at National Digital Bank. ' +
      'Be professional, helpful, and concise (under 150 words). Use markdown formatting and emojis for readability. ' +
      'Never ask for passwords, PINs, or full card numbers.\n\n';

    systemPrompt += `The user is currently on the "${stepName}" step of onboarding.\n`;

    if (application) {
      systemPrompt += `\nAPPLICATION CONTEXT:\n`;
      systemPrompt += `- Status: ${application.status || 'IN_PROGRESS'}\n`;
      systemPrompt += `- Name: ${application.personalInfo?.fullName || 'Not provided'}\n`;
      systemPrompt += `- Mobile Verified: ${application.verification?.mobileVerified ? 'Yes' : 'No'}\n`;
      systemPrompt += `- Email Verified: ${application.verification?.emailVerified ? 'Yes' : 'No'}\n`;
      systemPrompt += `- PAN Status: ${application.kyc?.panStatus || 'Pending'}\n`;
      systemPrompt += `- Aadhaar Status: ${application.kyc?.aadhaarStatus || 'Pending'}\n`;
      systemPrompt += `- Risk Level: ${application.riskProfile?.riskLevel || 'Not calculated'}\n`;
      systemPrompt += `- Risk Score: ${application.riskProfile?.riskScore ?? 'N/A'}\n`;
      systemPrompt += `- Compliance Score: ${application.riskProfile?.complianceScore ?? 'N/A'}\n`;

      // Identity mismatch context for Groq
      if (application.kyc?.identityMismatch) {
        systemPrompt += `\n⚠️ IDENTITY MISMATCH DETECTED:\n`;
        systemPrompt += `The user uploaded KYC documents belonging to a DIFFERENT person.\n`;
        if (application.kyc.panExtractedName) systemPrompt += `- PAN shows name: "${application.kyc.panExtractedName}" but user entered: "${application.personalInfo?.fullName}"\n`;
        if (application.kyc.aadhaarExtractedName) systemPrompt += `- Aadhaar shows name: "${application.kyc.aadhaarExtractedName}" but user entered: "${application.personalInfo?.fullName}"\n`;
        if (application.kyc.panExtractedDOB) systemPrompt += `- PAN shows DOB: "${application.kyc.panExtractedDOB}" but user entered: "${application.personalInfo?.dob}"\n`;
        systemPrompt += `\nExplain this issue clearly and tell them they MUST upload their own documents with matching name and DOB. This is a serious compliance issue.\n`;
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    // Race with timeout
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 8000)
    );

    const groqCall = groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const completion = await Promise.race([groqCall, timeout]);
    const reply =
      completion.choices?.[0]?.message?.content ||
      "I'm sorry, I couldn't process that right now. Please try again!";

    return res.json({ reply, step: stepName, proactive: false });
  } catch (err) {
    console.error('Chatbot error:', err.message?.substring(0, 100));

    // Fallback: return the proactive guidance for the current step
    const stepName =
      typeof currentStep === 'number'
        ? stepIndexToName[currentStep] || 'eligibility'
        : currentStep || 'eligibility';

    return res.json({
      reply:
        stepGuidance[stepName] ||
        "I'm your banking assistant! I can help you with the onboarding process. What would you like to know?",
      step: stepName,
      proactive: true,
    });
  }
};
