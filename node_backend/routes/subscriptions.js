const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');

/**
 * @route POST /api/subscriptions
 * Create or update a subscription for a user
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { user_id, plan_type = 'basic' } = req.body;
    const userId = user_id ? parseInt(user_id) : (req.user ? req.user.id : null);

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user already has an active subscription
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true
      }
    });

    if (existing) {
      return res.json({
        message: 'Subscription already active',
        id: existing.id
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planType: plan_type,
        isActive: true
      }
    });

    res.status(201).json({
      message: 'Subscription created',
      id: subscription.id
    });
  } catch (error) {
    console.error('[Create Subscription Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/subscriptions/check/:user_id
 * Check if a user has an active subscription
 */
router.get('/check/:user_id', async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true
      }
    });

    res.json({
      has_subscription: !!subscription,
      plan_type: subscription ? subscription.planType : null
    });
  } catch (error) {
    console.error('[Check Subscription Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
