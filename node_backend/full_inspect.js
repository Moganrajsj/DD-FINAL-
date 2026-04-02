const { PrismaClient } = require('./prisma/generated-client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const tables = ['users', 'company', 'product', 'category'];
  for (const table of tables) {
    try {
      const columns = await prisma.$queryRawUnsafe(`DESCRIBE ${table}`);
      console.log(`Table: ${table}`);
      console.log(columns.map(c => c.Field).join(', '));
      console.log('---');
    } catch (e) {
      console.log(`Error describing ${table}: ${e.message}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
