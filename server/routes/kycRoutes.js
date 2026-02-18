const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const upload = require('../utils/uploadConfig');
const authMiddleware = require('../middleware/authMiddleware');

// Protected route for document upload
router.post('/upload', authMiddleware, upload.single('document'), kycController.uploadDocument);

module.exports = router;
