const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// New Routes specific to Mobile OTP
router.post('/send-mobile-otp', authController.sendMobileOTP);
router.post('/verify-mobile-otp', authController.verifyMobileOTP);

// New Routes specific to Email Verification Link
router.post('/send-email-verification', authController.sendEmailVerification);
// New Routes specific to Email Verification Link
router.post('/send-email-verification', authController.sendEmailVerification);
router.get('/verify-email', authController.verifyEmailLink); // GET request for link click
router.get('/me', require('../middleware/authMiddleware'), authController.getUserProfile); // Status check

// Session and Logout
router.get('/session', require('../middleware/authMiddleware'), authController.checkSession);
router.post('/logout', authController.logout);

// Keep generic aliases for backward compatibility
router.post('/send-otp', authController.sendMobileOTP);
router.post('/verify-otp', authController.verifyMobileOTP);

module.exports = router;
