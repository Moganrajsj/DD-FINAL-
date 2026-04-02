const path = require('path');
const rootDir = 'c:\\Users\\mogan\\b2b-marketplace\\DealsDoubled.in\\DealsDoubled.in';
const { PrismaClient } = require(path.join(rootDir, 'node_backend', 'prisma', 'generated-client'));
const dotenv = require('dotenv');

// Load env from node_backend
dotenv.config({ path: path.join(rootDir, 'node_backend', '.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, isAdmin: true },
    take: 5
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
