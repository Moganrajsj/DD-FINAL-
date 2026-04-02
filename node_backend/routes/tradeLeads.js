const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { recordMarketplaceEvent } = require('../lib/analytics');

/**
 * @route GET /api/trade-leads
 * Get all trade leads with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { type = 'all', category } = req.query;
    
    let where = {};
    if (type !== 'all') {
      where.type = type;
    }
    if (category) {
      where.category = category;
    }

    const leads = await prisma.tradeLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        category: true,
        location: true,
        createdAt: true,
        price: true,
        // Don't select contact info by default unless purchased
      }
    });

    res.json(leads.map(l => ({
      id: l.id,
      title: l.title,
      description: l.description,
      type: l.type,
      category: l.category,
      location: l.location,
      created_at: l.createdAt.toISOString()
    })));
  } catch (error) {
    console.error('[Get Trade Leads Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/trade-leads/:id/purchase
 * Purchase a trade lead to unlock contact info
 */
router.post('/:id/purchase', requireAuth, async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(leadId)) return res.status(400).json({ error: 'Invalid lead ID' });

    const lead = await prisma.tradeLead.findUnique({ where: { id: leadId } });
    if (!lead) return res.status(404).json({ error: 'Trade lead not found' });

    // Check if already purchased
    const existing = await prisma.leadPurchase.findUnique({
      where: {
        userId_leadId: { userId, leadId }
      }
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Already purchased',
        contact_name: lead.contactName,
        contact_email: lead.contactEmail,
        contact_phone: lead.contactPhone
      });
    }

    // In a real app, process payment here. For now, simulate success.
    await prisma.leadPurchase.create({
      data: { userId, leadId }
    });

    // Record analytics event
    await recordMarketplaceEvent({
      eventType: 'lead_purchased',
      userId,
      inquiryId: leadId, // Proxy for lead_id as per original app
      metadata: {
        lead_id: leadId,
        price: lead.price,
        category: lead.category
      }
    });

    res.json({
      success: true,
      message: 'Lead unlocked successfully',
      contact_name: lead.contactName,
      contact_email: lead.contactEmail,
      contact_phone: lead.contactPhone
    });
  } catch (error) {
    console.error('[Purchase Lead Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/admin/leads
 * Admin-only: Create a new trade lead
 */
router.post('/admin/create', requireAdmin, async (req, res) => {
  try {
    const { title, description, type = 'buy', category, location, contact_name, contact_email, contact_phone, price = 500 } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Missing title, description, or category' });
    }

    const lead = await prisma.tradeLead.create({
      data: {
        title,
        description,
        type,
        category,
        location: location || "",
        contactName: contact_name || "",
        contactEmail: contact_email || "",
        contactPhone: contact_phone || "",
        price: parseInt(price)
      }
    });

    // Record analytics event
    await recordMarketplaceEvent({
      eventType: 'lead_created',
      userId: req.user.id,
      location: location || "",
      metadata: {
        lead_id: lead.id,
        category,
        type
      }
    });

    res.status(201).json({
      message: 'Trade lead created successfully',
      id: lead.id
    });
  } catch (error) {
    console.error('[Admin Create Lead Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
