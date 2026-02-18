const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/message', authMiddleware, chatbotController.message);

module.exports = router;
