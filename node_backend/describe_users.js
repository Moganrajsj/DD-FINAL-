const { PrismaClient } = require('./prisma/generated-client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRaw`DESCRIBE users`;
  console.log(JSON.stringify(columns, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
