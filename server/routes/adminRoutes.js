const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Admin login (hardcoded for hackathon)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@ndb.gov.in' && password === 'admin123') {
    const token = jwt.sign({ userId: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, role: 'admin' });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

router.get('/applications', authMiddleware, adminController.getAllApplications);
router.get('/application/:id', authMiddleware, adminController.getApplicationById);
router.post('/application/:id/override', authMiddleware, adminController.overrideDecision);

module.exports = router;
