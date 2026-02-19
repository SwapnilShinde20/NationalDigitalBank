const User = require('../models/User');
const OTP = require('../models/Otp');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const generateOTP = require('../utils/generateOTP');
const emailService = require('../utils/emailService');
const crypto = require('crypto');

// --- Send OTP ---
exports.sendMobileOTP = async (req, res) => {
  try {
    const { mobile, identifier } = req.body;
    const mobileNumber = mobile || identifier;

    // 1. Validate Mobile
    if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
    }

    // 2. Clear old OTPs
    await OTP.deleteMany({ mobile: mobileNumber });

    // 3. Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    // 4. Save to DB
    const newOTP = new OTP({
      mobile: mobileNumber,
      otp,
      expiresAt
    });
    await newOTP.save();

    console.log(`[DEMO MODE] OTP for ${mobileNumber}: ${otp}`);

    // LOGGING
    await AuditLog.create({
        action: 'OTP_SENT',
        details: { mobile: mobileNumber, type: 'mobile' },
        actor: 'SYSTEM'
    });

    // 5. Return Response (with Demo OTP)
    res.json({
      success: true,
      message: 'OTP sent successfully',
      demoOTP: otp // For Hackathon Demo Only
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ success: false, message: 'Server error sending OTP' });
  }
};

// --- Verify Mobile OTP ---
exports.verifyMobileOTP = async (req, res) => {
  try {
    const { mobile, identifier, otp } = req.body;
    const mobileNumber = mobile || identifier;
    
    // 1. Find OTP Record
    const otpRecord = await OTP.findOne({ mobile: mobileNumber }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP not requested or expired' });
    }

    // 2. Check Expiry
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // 3. Check if already verified
    if (otpRecord.verified) {
      return res.status(400).json({ success: false, message: 'OTP already used' });
    }

    // 4. Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // --- OTP is Valid ---
    otpRecord.verified = true;
    await otpRecord.save();

    // 5. Create/Update User (for demo/onboarding flow)
    let user = await User.findOne({ mobile: mobileNumber });
    if (!user) {
        user = new User({ mobile: mobileNumber, mobileVerified: true });
    } else {
        user.mobileVerified = true;
    }
    await user.save();

    // 6. Generate Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set HTTP-only cookie
    const isProd = process.env.NODE_ENV === 'production' || req.hostname !== 'localhost';
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: isProd || req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: isProd ? 'none' : 'lax', // 'none' is required for cross-site cookies
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 7. Ensure Application Exists (Auto-create)
    const Application = require('../models/Application');
    let application = await Application.findOne({ userId: user._id });
    if (!application) {
        application = new Application({
            userId: user._id,
            status: 'IN_PROGRESS',
            currentStep: 1,
            verification: {
                mobile: user.mobile,
                mobileVerified: true
            }
        });
        await application.save();
    } else {
        // sync mobile
        if (!application.verification) application.verification = {};
        application.verification.mobile = user.mobile;
        application.verification.mobileVerified = true;
        await application.save();
    }

    await AuditLog.create({
        userId: user._id,
        action: 'OTP_VERIFIED',
        details: { mobile: mobileNumber },
        actor: 'USER'
    });

    res.json({
      success: true,
      message: 'Mobile verified successfully',
      user
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: 'Server error verifying OTP' });
  }
};

// --- Send Email Verification Link ---
exports.sendEmailVerification = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    // 1. Validate Email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // 2. Generate Token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    // 3. Save/Update User with Token
    // Try to find by email first, then mobile
    let query = {};
    if (mobile) {
        query = { $or: [{ email }, { mobile }] };
    } else {
        query = { email };
    }
    
    // Check if email is already taken by ANOTHER user
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
        // Normalize mobile numbers for comparison (remove spaces, dashes, plus signs)
        const normalizeMobile = (m) => String(m).replace(/[^0-9]/g, '').slice(-10); // Check last 10 digits
        
        let isSameUser = false;
        if (mobile && existingEmailUser.mobile) {
             if (normalizeMobile(mobile) === normalizeMobile(existingEmailUser.mobile)) {
                 isSameUser = true;
             }
        }

        // If mobile matches, it's the same user.
        // If mobile NOT provided, we assume it might be the same user (risky, but relying on subsequent steps).
        // But if mobile IS provided and it's DIFFERENT, then email is taken.
        if (mobile && !isSameUser) {
             return res.status(400).json({ success: false, message: 'Email already in use by another account.' });
        }
        
        // If we found the user (or it is the same user) and they are already verified
        if (existingEmailUser.emailVerified) {
             return res.status(200).json({ success: true, message: 'Email is already verified.', alreadyVerified: true });
        }
    }
    
    // If no user found by email, try finding by mobile to link it
    let user = existingEmailUser;
    if (!user && mobile) {
        user = await User.findOne({ mobile });
    }
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found. Please verify mobile first.' });
    }

    // Ensure email is set on user
    user.email = email;
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    // 4. Construct Link
    // Pointing to Backend API which redirects to Frontend
    const verificationLink = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${token}`;
    
    // 5. Send Email
    const emailSent = await emailService.sendVerificationEmail(email, verificationLink);

    // LOGGING
    await AuditLog.create({
        action: 'EMAIL_LINK_SENT',
        details: { email, sentStatus: emailSent },
        actor: 'SYSTEM'
    });

    if (!emailSent) {
        return res.status(500).json({ success: false, message: 'Failed to send email. Check server logs.' });
    }

    res.json({
      success: true,
      message: 'Verification link sent to your email.'
    });

  } catch (error) {
    console.error("Send Email Link Error:", error);
    res.status(500).json({ success: false, message: 'Server error sending verification link' });
  }
};

// --- Verify Email Link ---
exports.verifyEmailLink = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send("Invalid link");
    }
    
    // 1. Find User by Token
    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    // 2. Verify
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Sync with Application
    const Application = require('../models/Application');
    let application = await Application.findOne({ userId: user._id });
    if (application) {
        if (!application.verification) application.verification = {};
        application.verification.email = user.email;
        application.verification.emailVerified = true;
        await application.save();
    }

    await AuditLog.create({
        userId: user._id,
        action: 'EMAIL_VERIFIED_LINK',
        details: { email: user.email },
        actor: 'USER'
    });

    // 3. Redirect to Frontend Success Page
    const frontendSuccessUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/email-verified-success`;
    res.redirect(frontendSuccessUrl);

  } catch (error) {
    console.error("Verify Email Link Error:", error);
    res.status(500).send("Server error verifying email.");
  }
};

// --- Get Current User Profile (Status Check) ---
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// --- Session Check ---
exports.checkSession = async (req, res) => {
    try {
        // Handle hardcoded admin
        if (req.user.userId === 'admin') {
            return res.json({
                success: true,
                user: { fullName: 'Bank Administrator', email: 'admin@ndb.gov.in' },
                role: 'admin'
            });
        }

        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }
        res.json({
            success: true,
            user,
            role: req.user.role || 'user'
        });
    } catch (error) {
        console.error("Session check error:", error);
        res.status(500).json({ success: false, message: 'Session check failed' });
    }
};

// --- Logout ---
exports.logout = (req, res) => {
    res.clearCookie('authToken', { path: '/' });
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

