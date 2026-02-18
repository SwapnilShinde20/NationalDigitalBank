const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes protected
router.use(authMiddleware);

router.post('/create', applicationController.createApplication);
router.get('/me', applicationController.getApplication); // Get current user's application
router.put('/update-step', applicationController.updateStep);

module.exports = router;
