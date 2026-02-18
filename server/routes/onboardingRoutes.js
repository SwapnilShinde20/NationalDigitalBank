const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/update', authMiddleware, onboardingController.createOrUpdateApplication);
router.get('/', authMiddleware, onboardingController.getApplication);
router.post('/upload', authMiddleware, upload.single('document'), onboardingController.uploadDocument);
router.post('/submit', authMiddleware, onboardingController.submitApplication);

module.exports = router;
