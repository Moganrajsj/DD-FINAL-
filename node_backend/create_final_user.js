const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'testuser_final@example.com';
    const password = 'Password@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword }
      });
      console.log('Updated existing user password.');
    } else {
      user = await prisma.user.create({
        data: {
          name: 'Final Test User',
          email,
          passwordHash: hashedPassword,
          role: 'seller',
          isAdmin: true
        }
      });
      console.log('Created new test user with ID:', user.id);
    }
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
