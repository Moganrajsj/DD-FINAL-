const bcrypt = require('bcryptjs');
const { PrismaClient } = require('./prisma/generated-client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@dealsdoubled.in';
  const newPassword = 'Admin123!';
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  });
  
  console.log(`Successfully updated password for ${email}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${newPassword}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
