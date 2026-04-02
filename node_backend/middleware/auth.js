const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const SECRET = process.env.SECRET_KEY || 'dev-secret';

// Attach user to request if token present (optional auth)
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.replace('Bearer ', '').trim();
    if (!token || token === 'null') return next();
    const payload = jwt.verify(token, SECRET);
    req.user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { company: true } });
  } catch { /* invalid token, keep req.user undefined */ }
  next();
};

// Require a valid token
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.replace('Bearer ', '').trim();
    if (!token || token === 'null') return res.status(401).json({ error: 'Authentication required' });
    const payload = jwt.verify(token, SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { company: true } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Require admin role
const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

// Sign a JWT token for a user
const signToken = (user) => {
  return jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
};

module.exports = { optionalAuth, requireAuth, requireAdmin, signToken };
