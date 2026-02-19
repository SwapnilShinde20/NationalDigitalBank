const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies?.authToken;

  if (!token) {
    console.log(`[AUTH] No token found for request to ${req.originalUrl} from ${req.ip}`);
    return res.status(401).json({ message: 'No session, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId: ... }
    next();
  } catch (err) {
    console.error(`[AUTH] JWT verify failed for ${req.ip}:`, err.message);
    res.status(401).json({ message: 'Session is not valid' });
  }
};
