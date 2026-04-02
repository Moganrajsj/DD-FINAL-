const { PrismaClient } = require('./prisma/generated-client');
const prisma = new PrismaClient();
async function main() {
  const sql = [
    // Product
    "ALTER TABLE product ADD COLUMN IF NOT EXISTS featured TINYINT(1) DEFAULT 0",
    "ALTER TABLE product ADD COLUMN IF NOT EXISTS approved TINYINT(1) DEFAULT 1",
    "ALTER TABLE product ADD COLUMN IF NOT EXISTS location VARCHAR(120) DEFAULT 'India'",
    "ALTER TABLE product ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0",
    "ALTER TABLE product ADD COLUMN IF NOT EXISTS views INT DEFAULT 0",
    
    // Category
    "ALTER TABLE category ADD COLUMN IF NOT EXISTS views INT DEFAULT 0",
    "ALTER TABLE category ADD COLUMN IF NOT EXISTS sales_count INT DEFAULT 0",
    "ALTER TABLE category ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMP NULL DEFAULT NULL",
    "ALTER TABLE category ADD COLUMN IF NOT EXISTS description TEXT NULL",
    "ALTER TABLE category ADD COLUMN IF NOT EXISTS icon_url VARCHAR(255) NULL"
  ];
  for (const cmd of sql) {
    try {
      await prisma.$executeRawUnsafe(cmd);
      console.log(`Success: ${cmd}`);
    } catch (e) {
      console.log(`Note: ${cmd} - ${e.message}`);
    }
  }
}
main().finally(() => prisma.$disconnect());
