const { PrismaClient } = require('./prisma/generated-client');
const prisma = new PrismaClient();
async function main() {
  const tables = ['inquiry', 'orders', 'review', 'wishlist', 'buy_requirement', 'category', 'seller_alert', 'rfq_match', 'subscription', 'marketplace_event'];
  for (const t of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
      console.log(`Success: ${t}`);
    } catch(e) {
      console.log(`Note: ${t} - ${e.message}`);
    }
  }
}
main().finally(() => prisma.$disconnect());
