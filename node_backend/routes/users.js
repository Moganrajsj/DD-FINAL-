const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

/**
 * @route GET /api/users/:id/profile
 * Get user profile including company and stats
 */
router.get('/:id/profile', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    // In a real app, restrict access to own profile or admins
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view this profile' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
        inquiries: { take: 5, orderBy: { createdAt: 'desc' } },
        rating: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Flatten representation for frontend
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatarUrl,
      membership_tier: user.membershipTier,
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        verified: user.company.verified,
        location: user.company.location
      } : null,
      created_at: user.createdAt.toISOString()
    });
  } catch (error) {
    console.error('[User Profile Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route PUT /api/users/:id/profile
 * Update user profile
 */
router.put('/:id/profile', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, phone, avatar_url } = req.body;

    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        avatarUrl: avatar_url,
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Profile updated successfully',
      id: updatedUser.id,
      name: updatedUser.name
    });
  } catch (error) {
    console.error('[Update Profile Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
