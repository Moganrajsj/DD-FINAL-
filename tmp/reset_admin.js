const bcrypt = require('bcryptjs');
const path = require('path');
const rootDir = 'c:\\Users\\mogan\\b2b-marketplace\\DealsDoubled.in\\DealsDoubled.in';
const { PrismaClient } = require(path.join(rootDir, 'node_backend', 'prisma', 'generated-client'));
const dotenv = require('dotenv');

dotenv.config({ path: path.join(rootDir, 'node_backend', '.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@dealsdoubled.in';
  const newPassword = 'Admin123!';
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash }
  });
  
  console.log(`Successfully updated password for ${email}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${newPassword}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
