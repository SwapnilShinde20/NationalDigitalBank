const Groq = require('groq-sdk');
const Application = require('../models/Application');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- Local Fallback Responses (for when Groq is unavailable) ---
const fallbackResponses = {
    greeting: "Welcome to National Digital Bank! 🏦 I'm your AI onboarding assistant. I can help you with:\n\n• **Account Opening** - Step-by-step guidance\n• **KYC Verification** - PAN & Aadhaar upload help\n• **Risk Assessment** - Understanding your risk profile\n• **Document Upload** - Supported formats & tips\n\nHow can I help you today?",
    
    account: "To open an account with NDB, follow these steps:\n\n1. **Verify Mobile** - Enter your number & OTP\n2. **Personal Details** - Name, DOB, Address\n3. **KYC Upload** - PAN Card & Aadhaar\n4. **Employment Info** - Income & occupation\n5. **Nominee Details** - Add a nominee\n6. **Review & Submit** - AI validates your application\n\nYour account can be activated within minutes! 🚀",
    
    kyc: "For KYC verification, you'll need:\n\n📄 **PAN Card** - For tax identification\n🪪 **Aadhaar Card** - For identity & address proof\n\n**Tips:**\n- Upload clear, readable images\n- Ensure all corners are visible\n- File size should be under 5MB\n- Supported formats: JPG, PNG, PDF",
    
    risk: "Your risk assessment is calculated automatically based on:\n\n• **Income Level** - Annual income verification\n• **KYC Status** - Document verification completion\n• **PEP Status** - Politically Exposed Person check\n• **Address Verification** - Complete address details\n\n**Categories:**\n- 🟢 Low Risk (0-30) - Fast-track approval\n- 🟡 Medium Risk (31-70) - Standard review\n- 🔴 High Risk (71-100) - Manual review required",
    
    status: "To check your application status:\n\n1. Complete all onboarding steps\n2. Submit your application\n3. Check the **Review** tab for AI validation results\n4. Your officer will review if needed\n\nThe admin dashboard shows real-time status updates!",
    
    help: "Here are things I can help with:\n\n• Type **'account'** - How to open an account\n• Type **'kyc'** - KYC document requirements\n• Type **'risk'** - Understanding risk assessment\n• Type **'status'** - Check application status\n• Type **'documents'** - Document upload help\n\nOr ask me any banking question! 💬",
    
    default: "Thank you for your question! As your NDB banking assistant, I recommend completing each onboarding step carefully. If you need specific help, try asking about:\n\n• Account opening process\n• KYC requirements\n• Risk assessment\n• Document uploads\n\nI'm here to guide you! 🏦"
};

function getLocalResponse(message, application) {
    const msg = message.toLowerCase();
    
    if (msg.match(/^(hi|hello|hey|helo|good morning|good evening)/)) {
        return fallbackResponses.greeting;
    }
    if (msg.includes('account') || msg.includes('open') || msg.includes('start')) {
        return fallbackResponses.account;
    }
    if (msg.includes('kyc') || msg.includes('pan') || msg.includes('aadhaar') || msg.includes('document') || msg.includes('upload')) {
        return fallbackResponses.kyc;
    }
    if (msg.includes('risk') || msg.includes('score') || msg.includes('assessment')) {
        let response = fallbackResponses.risk;
        if (application && application.riskCategory) {
            response += `\n\n**Your Current Risk:** ${application.riskCategory} (Score: ${application.riskScore || 'Calculating...'})`;
        }
        return response;
    }
    if (msg.includes('status') || msg.includes('progress') || msg.includes('where') || msg.includes('next')) {
        let response = fallbackResponses.status;
        if (application) {
            response += `\n\n**Your Status:** ${application.status || 'In Progress'}`;
        }
        return response;
    }
    if (msg.includes('help') || msg.includes('what can')) {
        return fallbackResponses.help;
    }
    
    return fallbackResponses.default;
}

// --- Main Chat Handler ---
exports.chat = async (req, res) => {
    const { message, history } = req.body;
    const userId = req.user.userId;

    try {
        // 1. Fetch User Context
        const application = await Application.findOne({ userId });

        // 2. Build System Instruction
        let systemText = `You are an intelligent banking onboarding assistant for National Digital Bank (NDB). 
        Help customers open bank accounts, verify identity (KYC), and solve issues.
        Be professional, secure, and helpful. Do NOT ask for passwords or PINs.
        Keep responses concise (under 150 words). Use bullet points and emojis for readability.`;

        if (application) {
            systemText += `\n\nUSER CONTEXT:
            - Status: ${application.status}
            - Risk: ${application.riskCategory || 'Not Calculated'}
            - Completed: ${application.personalDetails?.fullName ? 'Personal Info ✓' : 'Personal Info ✗'}, ${application.kycDetails?.panVerified ? 'KYC ✓' : 'KYC ✗'}`;
        }

        // 3. Normalize History for Groq (OpenAI-compatible format)
        const chatMessages = [
            { role: 'system', content: systemText }
        ];

        // Add conversation history
        if (history && history.length > 0) {
            for (const msg of history) {
                if (msg.content && (msg.role === 'user' || msg.role === 'assistant')) {
                    chatMessages.push({
                        role: msg.role,
                        content: msg.content
                    });
                }
            }
        }

        // Add current user message
        chatMessages.push({ role: 'user', content: message });

        // 4. Try Groq API (with fast timeout)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 8000)
        );

        const groqPromise = groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: chatMessages,
            max_tokens: 300,
            temperature: 0.7,
        });

        const chatCompletion = await Promise.race([groqPromise, timeoutPromise]);
        const text = chatCompletion.choices[0]?.message?.content || fallbackResponses.default;

        return res.json({ reply: text });

    } catch (error) {
        console.log('Groq unavailable, using local fallback:', error.message?.substring(0, 80) || 'timeout');

        // 5. Fallback: Use local response engine
        try {
            const application = await Application.findOne({ userId: req.user.userId });
            const localReply = getLocalResponse(message, application);
            return res.json({ reply: localReply });
        } catch (fallbackError) {
            return res.json({ reply: fallbackResponses.default });
        }
    }
};
