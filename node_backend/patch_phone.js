const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function patchPhone() {
  try {
    console.log('Adding phone column to users table...');
    await prisma.$executeRawUnsafe("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT ''");
    console.log('Success!');
  } catch (error) {
    console.error('Error patching DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

patchPhone();
