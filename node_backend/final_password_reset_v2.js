const { PrismaClient } = require('./prisma/generated-client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const email = 'seller@test.com';
  const newPassword = 'Seller123!';
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // List columns to be 100% sure
  const cols = await prisma.$queryRaw`DESCRIBE users`;
  const colNames = cols.map(c => c.Field);
  console.log('Columns in users:', colNames.join(', '));
  
  const targetCol = colNames.includes('password') ? 'password' : (colNames.includes('password_hash') ? 'password_hash' : null);
  
  if (!targetCol) {
     throw new Error('No password column found!');
  }
  
  await prisma.$executeRawUnsafe(`UPDATE users SET ${targetCol} = '${passwordHash}' WHERE email = '${email}'`);
  
  console.log(`Successfully reset ${email} using column ${targetCol}`);
}
main().finally(() => prisma.$disconnect());
