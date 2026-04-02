const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

/**
 * @route GET /api/categories
 * List all product categories with searching and sorting
 */
router.get('/', async (req, res) => {
  try {
    const { search, sort = 'name' } = req.query;
    
    const where = {};
    if (search) {
      where.name = { contains: search };
    }

    let orderBy = { name: 'asc' };
    if (sort === 'views') orderBy = { views: 'desc' };
    if (sort === 'sales') orderBy = { salesCount: 'desc' };
    if (sort === 'trending') orderBy = [{ views: 'desc' }, { lastVisitedAt: 'desc' }];

    const categories = await prisma.category.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: { products: { where: { approved: true } } }
        }
      }
    });

    res.json(categories.map(c => ({
      ...c,
      product_count: c._count.products
    })));
  } catch (error) {
    console.error('[Categories List Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route GET /api/categories/:id
 * Get a single category and its subcategories/statistics
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid category ID' });

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: { where: { approved: true } } }
        }
      }
    });

    if (!category) return res.status(404).json({ error: 'Category not found' });

    // Update views (optional)
    prisma.category.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(e => console.error('Failed to increment view', e));

    res.json({
      ...category,
      product_count: category._count.products
    });
  } catch (error) {
    console.error('[Category Detail Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
