const { PrismaClient } = require('./prisma/generated-client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Applying full database patch to align with Node.js backend...");
  
  const sqlCommands = [
    // Users table fixes
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT '' AFTER id",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin TINYINT(1) DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_buyer_manager TINYINT(1) DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(50) DEFAULT 'STARTER'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent TINYINT(1) DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at DATETIME DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",

    // Company table fixes
    "ALTER TABLE company ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    
    // Product table fixes
    "ALTER TABLE product ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    
    // Category table fixes
    "ALTER TABLE category ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
  ];

  for (const cmd of sqlCommands) {
    try {
      await prisma.$executeRawUnsafe(cmd);
      console.log(`Success: ${cmd}`);
    } catch (e) {
      console.log(`Note: ${cmd} - ${e.message}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
