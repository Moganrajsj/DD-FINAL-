const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { signToken, requireAuth } = require('../middleware/auth');
const { sendMail } = require('../lib/mailer');
const crypto = require('crypto');

/**
 * @route POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Default roles / logic
    const isBuyerManager = role === 'manager';

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || "",
        isBuyerManager,
        membershipTier: "STARTER",
      }
    });

    const token = signToken(newUser);
    
    // In production, you would send a welcome email here
    /*
    await sendMail({
      to: email,
      subject: "Welcome to DealsDoubled",
      html: `<h1>Welcome ${name}!</h1><p>Your account is ready.</p>`
    });
    */

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin || false,
        is_admin: newUser.isAdmin || false,
        isBuyerManager: newUser.isBuyerManager,
        is_buyer_manager: newUser.isBuyerManager,
        membershipTier: newUser.membershipTier
      }
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { company: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        is_admin: user.isAdmin || false,
        isBuyerManager: user.isBuyerManager,
        is_buyer_manager: user.isBuyerManager,
        membershipTier: user.membershipTier,
        company_id: user.companyId,
        company: user.company
      }
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

/**
 * @route GET /api/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, (req, res) => {
  const { user } = req;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin || false,
      is_admin: user.isAdmin || false,
      isBuyerManager: user.isBuyerManager,
      is_buyer_manager: user.isBuyerManager,
      membershipTier: user.membershipTier,
      companyId: user.companyId,
      company: user.company
    }
  });
});

/**
 * @route POST /api/auth/send-otp
 * Send OTP for phone-based login
 */
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // Simple numeric cleaning
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
  }

  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.slice(-10)}`;
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  try {
    // Delete existing unverified OTPs
    await prisma.oTP.deleteMany({
      where: { phone: formattedPhone, verified: false }
    });

    // Create new OTP record
    await prisma.oTP.create({
      data: {
        phone: formattedPhone,
        otpCode,
        expiresAt
      }
    });

    // Mock SMS sending - logs to console for development
    console.log('\n' + '='.repeat(40));
    console.log(`[OTP NOTIFICATION]`);
    console.log(`Phone: ${formattedPhone}`);
    console.log(`OTP Code: ${otpCode}`);
    console.log(`Valid for: 5 minutes`);
    console.log('='.repeat(40) + '\n');

    // Email fallback if user exists
    const user = await prisma.user.findFirst({
      where: { OR: [{ phone: formattedPhone }, { phone: cleanPhone.slice(-10) }] }
    });

    if (user && user.email) {
      await sendMail({
        to: user.email,
        subject: 'Your DealsDoubled Login OTP',
        html: `
          <h3>Your Login OTP</h3>
          <p>Dear ${user.name},</p>
          <p>Your OTP for login is: <strong style="font-size: 24px; color: #6366f1; letter-spacing: 2px;">${otpCode}</strong></p>
          <p>Valid for 5 minutes.</p>
        `
      }).catch(e => console.error('OTP Email fallback failed', e));
    }

    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    res.json({
      message: 'OTP sent successfully',
      phone: cleanPhone.slice(-10),
      ...(isDev ? { otp: otpCode, note: 'OTP included for development only' } : {})
    });
  } catch (error) {
    console.error('[Send OTP Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/auth/verify-otp
 * Verify OTP and login user
 */
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.slice(-10)}`;

  try {
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: formattedPhone,
        otpCode: otp,
        verified: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Mark as verified
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    // Find or create user? Usually login only find, but some apps create.
    // Python backend seems to only login existing user or returns error.
    let user = await prisma.user.findFirst({
      where: { OR: [{ phone: formattedPhone }, { phone: cleanPhone.slice(-10) }] },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this phone number. Please register first.' });
    }

    const token = signToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        is_admin: user.isAdmin || false,
        isBuyerManager: user.isBuyerManager,
        is_buyer_manager: user.isBuyerManager,
        companyId: user.companyId,
        company: user.company
      }
    });
  } catch (error) {
    console.error('[Verify OTP Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    await sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset for your DealsDoubled account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `
    });

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/auth/check-admin
 * Used by frontend to verify admin rights
 */
router.get('/check-admin', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: user_id }
    });

    if (!user) {
      return res.status(404).json({ is_admin: false, error: 'User not found' });
    }

    res.json({ 
      is_admin: user.isAdmin || false,
      isAdmin: user.isAdmin || false
    });
  } catch (error) {
    console.error('[Check Admin Error]', error);
    res.status(500).json({ is_admin: false, error: 'Internal server error' });
  }
});

module.exports = router;
