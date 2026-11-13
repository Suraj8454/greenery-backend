const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  // Check for cookie first (admin panel), then header (API)
  const token = req.cookies?.adminToken || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    if (req.accepts('html')) return res.redirect('/admin/login');
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      if (req.accepts('html')) return res.redirect('/admin/login');
      return res.status(403).json({ error: 'Admin only' });
    }
    req.admin = decoded;
    next();
  } catch {
    if (req.accepts('html')) return res.redirect('/admin/login');
    res.status(401).json({ error: 'Invalid token' });
  }
};