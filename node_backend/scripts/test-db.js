const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Connectivity Test ---');
  console.log(`Connecting to: ${process.env.DATABASE_URL.split('@')[1]}`);

  try {
    // 1. Simple count on a core table
    const userCount = await prisma.user.count();
    console.log('✅ Connection Successful!');
    console.log(`📊 Found ${userCount} users in the database.`);

    // 2. Fetch one product to check related tables
    const sampleProduct = await prisma.product.findFirst({
      include: { category: true }
    });
    
    if (sampleProduct) {
      console.log('✅ Data Retrieval Successful!');
      console.log(`📦 Sample Product: ${sampleProduct.name} (Category: ${sampleProduct.category ? sampleProduct.category.name : 'N/A'})`);
    } else {
      console.log('⚠️ No products found in the database, but connection is open.');
    }

  } catch (error) {
    console.error('❌ Connectivity Test Failed!');
    console.error('Error Details:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.error('💡 Suggestion: Ensure Hostinger allows remote MySQL connections from your IP.');
    } else if (error.message.includes('Access denied for user')) {
      console.error('💡 Suggestion: Double-check your username/password in .env and ensure special characters are URL-encoded.');
    }
  } finally {
    await prisma.$disconnect();
    console.log('--- Test Complete ---');
  }
}

main();
