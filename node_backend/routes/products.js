const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { recordMarketplaceEvent } = require('../lib/analytics');

const listProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search, 
      min_price, 
      max_price, 
      location,
      sort = 'created_at_desc',
      approved_only = 'true'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    
    // Approved filter
    if (approved_only === 'true') {
      where.approved = true;
    }

    // Category filter
    if (category) {
      where.categoryId = parseInt(category);
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } }
      ];
    }

    // Price filter
    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price.gte = parseFloat(min_price);
      if (max_price) where.price.lte = parseFloat(max_price);
    }

    // Location filter
    if (location) {
      where.location = { contains: location };
    }

    // Sorting
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'views_desc') orderBy = { views: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          company: {
            select: { id: true, name: true, verified: true, location: true, membershipTier: true }
          },
          images: {
            where: { isPrimary: true },
            take: 1
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    // Analytics search event
    if (search && parseInt(page) === 1) {
      recordMarketplaceEvent({
        eventType: 'search',
        userId: req.user ? req.user.id : null,
        searchQuery: search,
        metadata: { results_count: total }
      });
    }

    // Flatten products for frontend compatibility
    const flattenedProducts = products.map(p => ({
      ...p,
      company_id: p.company?.id,
      company_name: p.company?.name,
      verified: p.company?.verified || false,
      membership_tier: p.company?.membershipTier || 'FREE',
      image_url: p.images[0]?.url || p.imageUrl,
      category_name: p.category?.name
    }));

    res.json({
      products: flattenedProducts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Products List Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @route GET /api/products
 * @route GET /api/products/search
 * List products with filtering, search, and pagination
 */
router.get('/', optionalAuth, listProducts);
router.get('/search', optionalAuth, listProducts);

/**
 * @route GET /api/products/:id
 * Get a single product details
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        company: {
          include: {
            products: {
              where: { id: { not: id }, approved: true },
              take: 4,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        images: { orderBy: { displayOrder: 'asc' } },
        reviews: {
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Increment views (optional, could be throttled)
    prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(e => console.error('Failed to increment view', e));

    // Analytics event
    recordMarketplaceEvent({
      eventType: 'product_view',
      userId: req.user ? req.user.id : null,
      productId: id,
      companyId: product.companyId,
      categoryId: product.categoryId,
      location: product.location
    });

    res.json(product);
  } catch (error) {
    console.error('[Product Detail Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
