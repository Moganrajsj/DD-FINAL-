const { PrismaClient } = require('./prisma/generated-client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const email = 'seller@test.com';
  const newPassword = 'Seller123!';
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Use raw SQL update to avoid any Prisma metadata sync issues during the reset
  await prisma.$executeRawUnsafe(`UPDATE users SET password = '${passwordHash}' WHERE email = '${email}'`);
  
  console.log(`Successfully reset ${email} to ${newPassword}`);
}
main().finally(() => prisma.$disconnect());
