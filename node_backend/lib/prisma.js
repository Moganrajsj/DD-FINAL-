const { PrismaClient } = require('@prisma/client');

// In Vercel serverless, a new PrismaClient is reused across hot reloads
// by caching it on the global object to avoid "too many connections"
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({ log: ['warn', 'error'] });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
