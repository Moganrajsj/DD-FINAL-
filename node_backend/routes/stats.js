const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

/**
 * @route GET /api/stats
 * Global platform statistics for public and admin dashboards
 */
router.get('/', async (req, res) => {
  try {
    const [
      totalProducts,
      approvedProducts,
      totalCompanies,
      verifiedCompanies,
      totalCategories,
      totalUsers
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { approved: true } }),
      prisma.company.count(),
      prisma.company.count({ where: { verified: true } }),
      prisma.category.count(),
      prisma.user.count()
    ]);

    res.json({
      products: totalProducts,
      approved_products: approvedProducts,
      suppliers: verifiedCompanies,
      verified_suppliers: verifiedCompanies,
      categories: totalCategories,
      users: totalUsers,
    });
  } catch (error) {
    console.error('[Stats Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
