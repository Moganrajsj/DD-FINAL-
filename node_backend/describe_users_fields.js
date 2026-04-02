const { PrismaClient } = require('./prisma/generated-client');
const prisma = new PrismaClient();
async function main() {
  const columns = await prisma.$queryRaw`DESCRIBE users`;
  console.log(columns.map(c => c.Field).join(', '));
}
main().finally(() => prisma.$disconnect());
