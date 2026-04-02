const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');

/**
 * @route GET /api/admin/stats
 * Get comprehensive admin statistics
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalProducts,
      approvedProducts,
      totalCompanies,
      verifiedCompanies,
      totalCategories,
      totalUsers,
      totalInquiries
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { approved: true } }),
      prisma.company.count(),
      prisma.company.count({ where: { verified: true } }),
      prisma.category.count(),
      prisma.user.count(),
      prisma.inquiry.count()
    ]);

    res.json({
      products: totalProducts,
      approved_products: approvedProducts,
      suppliers: totalCompanies,
      verified_suppliers: verifiedCompanies,
      categories: totalCategories,
      users: totalUsers,
      inquiries: totalInquiries
    });
  } catch (error) {
    console.error('[Admin Stats Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/admin/users
 * List all users for admin management
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { company: true }
    });

    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      is_admin: u.isAdmin,
      is_buyer_manager: u.isBuyerManager,
      company_name: u.company ? u.company.name : null,
      created_at: u.createdAt.toISOString()
    })));
  } catch (error) {
    console.error('[Admin Users Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/admin/buyer-managers
 * List all buyer managers
 */
router.get('/buyer-managers', requireAdmin, async (req, res) => {
  try {
    const managers = await prisma.user.findMany({
      where: { isBuyerManager: true },
      include: {
        assignedInquiries: true
      }
    });

    res.json(managers.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      assigned_count: m.assignedInquiries.length
    })));
  } catch (error) {
    console.error('[Admin Buyer Managers Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/admin/users/:id/toggle-manager
 * Toggle buyer manager status
 */
router.post('/users/:id/toggle-manager', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isBuyerManager: !user.isBuyerManager }
    });

    res.json({
      message: `User ${updatedUser.name} is ${updatedUser.isBuyerManager ? 'now' : 'no longer'} a Buyer Manager`,
      is_buyer_manager: updatedUser.isBuyerManager
    });
  } catch (error) {
    console.error('[Admin Toggle Manager Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/admin/inquiries
 * List all inquiries for admin oversight
 */
router.get('/inquiries', requireAdmin, async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        manager: true
      }
    });

    res.json(inquiries.map(i => ({
      id: i.id,
      product_name: i.product ? i.product.name : "Deleted Product",
      buyer_name: i.name,
      buyer_email: i.email,
      quantity: i.quantity,
      manager_id: i.managerId,
      manager_name: i.manager ? i.manager.name : null,
      created_at: i.createdAt.toISOString()
    })));
  } catch (error) {
    console.error('[Admin Inquiries Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/admin/assign-manager
 * Manually assign a manager to an inquiry
 */
router.post('/assign-manager', requireAdmin, async (req, res) => {
  try {
    const { inquiry_id, manager_id } = req.body;
    if (!inquiry_id || !manager_id) {
      return res.status(400).json({ error: 'Missing inquiry_id or manager_id' });
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: parseInt(inquiry_id) },
      data: { managerId: parseInt(manager_id) },
      include: { manager: true }
    });

    res.json({
      message: `Inquiry assigned to ${updatedInquiry.manager.name} successfully`,
      inquiry_id: updatedInquiry.id,
      manager_name: updatedInquiry.manager.name
    });
  } catch (error) {
    console.error('[Admin Assign Manager Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/admin/products/:id/approve
 * Approve a pending product
 */
router.post('/products/:id/approve', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await prisma.product.update({
      where: { id },
      data: { approved: true }
    });

    res.json({
      message: 'Product approved successfully',
      id: product.id,
      name: product.name
    });
  } catch (error) {
    console.error('[Admin Approve Product Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/admin/companies/:id/toggle-best-seller
 * Toggle best seller status for a company
 */
router.post('/companies/:id/toggle-best-seller', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { bestSeller: !company.bestSeller }
    });

    res.json({
      message: `Company '${updatedCompany.name}' has been ${updatedCompany.bestSeller ? 'marked as Best Seller' : 'removed from Best Seller'}`,
      company_id: updatedCompany.id,
      best_seller: updatedCompany.bestSeller
    });
  } catch (error) {
    console.error('[Admin Toggle Best Seller Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/admin/companies/approve-all
 * Approve all pending companies
 */
router.post('/companies/approve-all', requireAdmin, async (req, res) => {
  try {
    const result = await prisma.company.updateMany({
      where: { verified: false },
      data: { verified: true }
    });

    res.json({
      message: `${result.count} companies approved successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('[Admin Approve All Companies Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/admin/db/reset
 * Reset the database (Admin only / CAUTION)
 */
router.post('/db/reset', requireAdmin, async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'RESET_MY_DATABASE') {
      return res.status(400).json({ error: 'Please confirm with exact string RESET_MY_DATABASE' });
    }

    // In a serverless environment, we can't easily run migrations, 
    // but we can clear tables in a specific order if needed.
    // For now, let's just return a safety message as this is very destructive.
    res.json({ message: 'Database reset requested. This feature is restricted for safety.' });
  } catch (error) {
    console.error('[Admin Reset DB Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
