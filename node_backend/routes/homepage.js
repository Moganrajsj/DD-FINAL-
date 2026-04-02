const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

/**
 * @route GET /api/homepage/data
 * Consolidated endpoint for homepage — returns stats, categories, velocity, and featured products.
 */
router.get('/data', async (req, res) => {
  try {
    // 1. Stats
    const [productCount, supplierCount, categoryCount, userCount] = await Promise.all([
      prisma.product.count({ where: { approved: true } }),
      prisma.company.count({ where: { verified: true } }),
      prisma.category.count(),
      prisma.user.count()
    ]);

    // 2. Categories sorted by trending (views)
    const allCategories = await prisma.category.findMany({
      orderBy: [
        { views: 'desc' },
        { lastVisitedAt: 'desc' }
      ]
    });

    const categoriesData = allCategories.map(c => ({
      id: c.id,
      name: c.name,
      views: c.views,
      sales_count: c.salesCount
    }));

    // 3. Featured products: up to 3 per category (max 5 categories)
    const featuredProducts = [];
    const topCats = allCategories.slice(0, 5);
    
    // We can do this in parallel for performance
    const productPromises = topCats.map(cat => 
      prisma.product.findMany({
        where: { categoryId: cat.id, approved: true },
        orderBy: [
          { isPriority: 'desc' },
          { views: 'desc' }
        ],
        take: 3,
        include: {
          company: {
            select: { name: true, location: true, verified: true }
          },
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      })
    );

    const results = await Promise.all(productPromises);
    
    results.forEach((products, index) => {
      const cat = topCats[index];
      products.forEach(p => {
        featuredProducts.push({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image_url: p.images[0]?.url || p.imageUrl,
          category_id: p.categoryId,
          category_name: cat.name,
          company_id: p.companyId,
          company_name: p.company?.name || null,
          location: p.company?.location || "India",
          is_priority: p.isPriority,
          verified: p.company?.verified || false,
        });
      });
    });

    // 4. Velocity data (12-month trend)
    // Note: In a real production app with millions of events, this would be cached or pre-computed.
    // For now, we'll try to query it or use the fallback logic from the original app.
    let velocityData = [];
    try {
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const count = await prisma.marketplaceEvent.count({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            },
            eventType: {
              in: ['product_view', 'inquiry_created', 'search']
            }
          }
        });
        velocityData.push(count || 0);
      }

      // Check if we have no data and apply fallback like Python version
      if (Math.max(...velocityData) === 0) {
        const base = [42, 58, 66, 61, 73, 81, 77, 69, 88, 84, 79, 91];
        velocityData = base.map(v => Math.min(100, Math.max(10, v + Math.floor(Math.random() * 11) - 5)));
      }
    } catch (ve) {
      console.error('[Homepage] Velocity calc error:', ve);
      velocityData = [42, 58, 66, 61, 73, 81, 77, 69, 88, 84, 79, 91];
    }

    res.json({
      stats: {
        products: productCount,
        suppliers: supplierCount,
        categories: categoryCount,
        users: userCount,
      },
      categories: categoriesData,
      featured_products: featuredProducts,
      velocity: velocityData,
    });
  } catch (error) {
    console.error('[Homepage Data Error]', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

module.exports = router;
