const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/**
 * @route POST /api/companies/register
 * Register a new company for a user
 */
router.post('/register', requireAuth, async (req, res) => {
  try {
    const { name, description, location = 'India', website, phone, gst_number, logo_url } = req.body;
    const userId = req.user.id;

    if (!name || !gst_number) {
      return res.status(400).json({ error: 'Company name and GST number are required' });
    }

    // Check if user already has a company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.companyId) return res.status(400).json({ error: 'User already has a company registered' });

    // Create company and link to user
    const company = await prisma.company.create({
      data: {
        name,
        description,
        location,
        website,
        phone,
        gstNumber: gst_number,
        logoUrl: logo_url,
        verified: false,
        users: {
          connect: { id: userId }
        }
      }
    });

    res.status(201).json({
      message: 'Company registered successfully. Waiting for admin verification.',
      company_id: company.id,
      company_name: company.name
    });
  } catch (error) {
    console.error('[Company Register Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/companies/verify/:id
 * Verify a company (Admin only)
 */
router.post('/verify/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid company ID' });

    const company = await prisma.company.update({
      where: { id },
      data: { verified: true }
    });

    // TODO: Send approval email

    res.json({
      message: 'Company verified successfully',
      company_id: company.id,
      company_name: company.name,
      verified: true
    });
  } catch (error) {
    console.error('[Company Verify Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/companies/unverify/:id
 * Unverify a company (Admin only)
 */
router.post('/unverify/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid company ID' });

    const company = await prisma.company.update({
      where: { id },
      data: { verified: false }
    });

    res.json({
      message: 'Company unverified successfully',
      company_id: company.id,
      company_name: company.name,
      verified: false
    });
  } catch (error) {
    console.error('[Company Unverify Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
