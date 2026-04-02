const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { recordMarketplaceEvent, createSellerAlert, scoreLeadQuality } = require('../lib/analytics');
const { triggerEvent, Channels } = require('../lib/pusher');

/**
 * @route POST /api/inquiries
 * Create a new inquiry (RFQ)
 */
router.post('/', optionalAuth, async (req, res) => {
  const { productId, name, email, phone, message, quantity } = req.body;

  if (!productId || !name || !email || !phone || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { company: true }
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Create the inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        productId: parseInt(productId),
        name,
        email,
        phone,
        message,
        quantity: quantity || "",
        negotiationStatus: "OPEN"
      }
    });

    const leadQuality = scoreLeadQuality(message, quantity);

    // Automated Buyer Manager Assignment for high-value B2B sourcing
    const keywords = ["bulk", "partnership", "container", "export", "import", "wholesale", "deal", "contract"];
    const isHighValue = leadQuality.quantity >= 100 || keywords.some(kw => (message || "").toLowerCase().includes(kw));

    if (isHighValue) {
      // Find a random buyer manager
      const managers = await prisma.user.findMany({
        where: { isBuyerManager: true }
      });
      if (managers.length > 0) {
        const randomManager = managers[Math.floor(Math.random() * managers.length)];
        await prisma.inquiry.update({
          where: { id: inquiry.id },
          data: { managerId: randomManager.id }
        });
        console.log(`[High-Value Assignment] Assigned Manager ${randomManager.name} to Inquiry #${inquiry.id}`);
      }
    }

    // Record the event
    await recordMarketplaceEvent({
      eventType: 'inquiry_created',
      userId: req.user ? req.user.id : null,
      productId: parseInt(productId),
      companyId: product.companyId,
      categoryId: product.categoryId,
      inquiryId: inquiry.id,
      location: product.company ? product.company.location : "",
      metadata: { 
        product_name: product.name,
        buyer_name: name,
        lead_score: leadQuality.score,
        lead_temperature: leadQuality.temperature,
        quantity: quantity,
      }
    });

    // Notify the seller
    if (product.companyId) {
      await createSellerAlert({
        companyId: product.companyId,
        alertType: 'new_inquiry',
        title: `${leadQuality.temperature.toUpperCase()} lead for ${product.name}`,
        message: `${name} submitted an inquiry with lead score ${leadQuality.score}.`,
        severity: leadQuality.temperature === 'hot' ? 'high' : 'info',
        entityType: 'inquiry',
        entityId: inquiry.id
      });
    }

    res.status(201).json({
      message: 'Inquiry submitted successfully',
      inquiry_id: inquiry.id
    });
  } catch (error) {
    console.error('[Create Inquiry Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/inquiries/:id
 * Get inquiry details (for chat/negotiation)
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid inquiry ID' });

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        product: {
          include: { company: true }
        },
        chatMessages: {
          include: { sender: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' }
        },
        replies: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    res.json(inquiry);
  } catch (error) {
    console.error('[Inquiry Detail Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/inquiries/:id/chat
 * Get chat messages for a specific inquiry
 */
router.get('/:id/chat', optionalAuth, async (req, res) => {
  try {
    const inquiryId = parseInt(req.params.id);
    if (isNaN(inquiryId)) return res.status(400).json({ error: 'Invalid inquiry ID' });

    const messages = await prisma.inquiryMessage.findMany({
      where: { inquiryId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { name: true, avatarUrl: true } }
      }
    });

    res.json(messages.map(m => ({
      id: m.id,
      sender_id: m.senderId,
      sender_name: m.sender.name,
      message: m.message,
      created_at: m.createdAt.toISOString()
    })));
  } catch (error) {
    console.error('[Get Chat Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/inquiries/:id/chat
 * Send a chat message for a specific inquiry
 */
router.post('/:id/chat', requireAuth, async (req, res) => {
  try {
    const inquiryId = parseInt(req.params.id);
    const { message } = req.body;
    const senderId = req.user.id;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    const newMsg = await prisma.inquiryMessage.create({
      data: {
        inquiryId,
        senderId,
        message
      },
      include: { sender: { select: { name: true } } }
    });

    // Update status to ACTIVE if it was OPEN
    if (inquiry.negotiationStatus === 'OPEN') {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { negotiationStatus: 'ACTIVE' }
      });
    }

    // Trigger Pusher event for real-time update
    triggerEvent(Channels.INQUIRY(inquiryId), 'receive_message', {
      id: newMsg.id,
      inquiry_id: inquiryId,
      sender_id: senderId,
      sender_name: newMsg.sender.name,
      message,
      created_at: newMsg.createdAt.toISOString()
    });

    res.json({
      id: newMsg.id,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('[Send Chat Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/admin/inquiries/:id/matches
 * Get AI-powered supplier matches and comparison for an inquiry
 */
router.get('/:id/matches', requireAuth, async (req, res) => {
  try {
    const inquiryId = parseInt(req.params.id);
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { product: true }
    });

    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    const matches = await prisma.rFQMatch.findMany({
      where: { inquiryId: inquiryId },
      include: { company: true }
    });

    const comparison = [];

    for (const match of matches) {
      // In a real scenario, trust calculations would be complex.
      // Here we simulate the logic from Python.
      const trustScore = match.company.verified ? 85 : 45;
      
      let reason = "Category match with healthy supplier trust";
      if (trustScore >= 80) reason = "Top trust supplier with strong match relevance";

      comparison.append({
        company_id: match.companyId,
        company_name: match.company.name,
        supplier_name: match.company.name,
        supplier_location: match.company.location,
        verified: match.company.verified,
        membership_tier: match.company.membershipTier,
        score: match.score,
        match_score: match.score,
        status: match.status,
        trust_score: trustScore,
        recommended_action: trustScore >= 70 ? "Request quote now" : "Review supplier profile first",
        match_reason: reason,
      });
    }

    // Sort by score
    comparison.sort((a, b) => b.match_score - a.match_score);

    res.json(comparison);
  } catch (error) {
    console.error('[Get Matches Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
