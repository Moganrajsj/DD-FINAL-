const { PrismaClient } = require('./prisma/generated-client');
const prisma = new PrismaClient();
async function main() {
  const sql = "ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INT DEFAULT NULL";
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log("Success: Added company_id to users");
  } catch(e) {
    console.log("Note: " + e.message);
  }
}
main().finally(() => prisma.$disconnect());
