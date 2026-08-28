const jwt = require('jsonwebtoken');
const db = require('../config/db');

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tcube_fashions_super_secret_key_987654321'
      );

      const [users] = await db.query(
        'SELECT id, name, email, role, phone, address FROM users WHERE id = ?',
        [decoded.id]
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    } catch (error) {
      // Invalid token — treat as guest for chat
    }
  }

  next();
};

module.exports = { optionalAuth };
