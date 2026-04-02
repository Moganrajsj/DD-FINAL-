const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');
const { recordMarketplaceEvent } = require('../lib/analytics');
const { sendMail } = require('../lib/mailer');

/**
 * @route GET /api/buy-requirements
 * Get all buy requirements
 */
router.get('/', async (req, res) => {
  try {
    const requirements = await prisma.buyRequirement.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(requirements.map(r => ({
      id: r.id,
      product_name: r.productName,
      description: r.description,
      quantity: r.quantity,
      location: r.location,
      budget: r.budget,
      email: r.email,
      created_at: r.createdAt.toISOString()
    })));
  } catch (error) {
    console.error('[Get Buy Requirements Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/buy-requirements
 * Post a new buy requirement
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { product_name, description, quantity, location, budget, email, user_id } = req.body;

    if (!product_name || !description) {
      return res.status(400).json({ error: 'Product name and description are required' });
    }

    const requirement = await prisma.buyRequirement.create({
      data: {
        productName: product_name,
        description,
        quantity: quantity || "",
        location: location || "",
        budget: budget || "",
        email: email || ""
      }
    });

    // Record analytics event
    await recordMarketplaceEvent({
      eventType: 'buy_requirement_created',
      userId: user_id ? parseInt(user_id) : (req.user ? req.user.id : null),
      location: location || "",
      searchQuery: product_name,
      metadata: {
        product_name: product_name,
        budget: budget || ""
      }
    });

    // Send Email Notification to Admin
    try {
      const adminEmail = process.env.MAIL_USER;
      if (adminEmail) {
        await sendMail(
          adminEmail,
          `New Buy Requirement: ${product_name}`,
          `
A new buy requirement has been posted on DealsDoubled.in

Product: ${product_name}
Quantity: ${quantity || 'N/A'}
Location: ${location || 'N/A'}
Budget: ${budget || 'N/A'}
Buyer Email: ${email || 'N/A'}

Description:
${description}

View it in the admin panel: ${process.env.FRONTEND_URL}/admin/requirements
          `
        );
        console.log(`[Email] Admin notification sent for requirement: ${requirement.id}`);
      }
    } catch (mailErr) {
      console.error('[Mail Error] Failed to send admin notification:', mailErr);
    }

    res.status(201).json({
      message: 'Buy requirement posted',
      id: requirement.id
    });
  } catch (error) {
    console.error('[Create Buy Requirement Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
