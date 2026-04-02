const { PrismaClient } = require('./prisma/generated-client');
const prisma = new PrismaClient();
async function main() {
  const email = 'seller@test.com';
  const u = await prisma.$queryRaw`SELECT password, password_hash FROM users WHERE email = ${email}`;
  console.log('User data for ' + email + ':', JSON.stringify(u[0], null, 2));
}
main().finally(() => prisma.$disconnect());
