const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route GET /api/seller/bulk-upload/template
 * Generate and download a bulk upload Excel template
 */
router.get('/bulk-upload/template', requireAuth, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Product Data');

    worksheet.columns = [
      { header: 'Product Name*', key: 'name', width: 25 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Price*', key: 'price', width: 15 },
      { header: 'Stock Quantity', key: 'stock', width: 15 },
      { header: 'Min Order Qty', key: 'min_qty', width: 15 },
      { header: 'Category Name*', key: 'category', width: 25 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Price Trend %', key: 'trend', width: 15 }
    ];

    // Style the header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };

    // Add a sample row
    worksheet.addRow({
      name: 'Sample Industrial Drill',
      description: 'High-performance heavy duty drill for construction.',
      price: 15000.0,
      stock: 50,
      min_qty: 5,
      category: 'Machinery',
      location: 'Mumbai, India',
      trend: 2.5
    });

    // Reference Sheet for Categories
    const categoriesSheet = workbook.addWorksheet('Categories Reference');
    categoriesSheet.addRow(['Valid Category Names (Copy exactly)']);
    categoriesSheet.getRow(1).font = { bold: true };
    
    const categories = await prisma.category.findMany({ select: { name: true } });
    categories.forEach(cat => {
      categoriesSheet.addRow([cat.name]);
    });
    categoriesSheet.getColumn(1).width = 30;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'DealsDouble_Bulk_Upload_Template.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('[Seller Template Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/seller/bulk-upload
 * Handle bulk product upload via Excel
 */
router.post('/bulk-upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true }
    });

    if (!user || !user.companyId) {
      return res.status(403).json({ error: 'User must have a registered company to upload products' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet('Product Data') || workbook.worksheets[0];

    const categoriesList = await prisma.category.findMany();
    const categoriesMap = new Map(categoriesList.map(c => [c.name.toLowerCase(), c.id]));

    const productsToAdd = [];
    const errors = [];
    let successCount = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const name = row.getCell(1).value;
      const description = row.getCell(2).value || "";
      const price = row.getCell(3).value;
      const stock = row.getCell(4).value || 0;
      const minQty = row.getCell(5).value || 1;
      const catName = row.getCell(6).value;
      const location = row.getCell(7).value || user.company.location || "India";
      const trend = row.getCell(8).value || 0.0;

      if (!name || !catName) {
        errors.append(`Row ${rowNumber}: Missing Product Name or Category Name`);
        return;
      }

      const categoryId = categoriesMap.get(catName.toString().trim().toLowerCase());
      if (!categoryId) {
        errors.push(`Row ${rowNumber}: Category '${catName}' not found`);
        return;
      }

      productsToAdd.push({
        name: name.toString(),
        description: description.toString(),
        price: parseFloat(price) || 0.0,
        stockQuantity: parseInt(stock) || 0,
        minOrderQuantity: parseInt(minQty) || 1,
        categoryId: categoryId,
        companyId: user.companyId,
        location: location.toString(),
        priceTrend: parseFloat(trend) || 0.0,
        approved: true // Automatically approve bulk uploads for now
      });
      successCount++;
    });

    if (productsToAdd.length > 0) {
      await prisma.product.createMany({
        data: productsToAdd
      });
    }

    res.json({
      message: 'Bulk upload processed',
      success_count: successCount,
      error_count: errors.length,
      errors: errors
    });
  } catch (error) {
    console.error('[Seller Bulk Upload Error]', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
