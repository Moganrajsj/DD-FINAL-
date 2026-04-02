const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const prisma = require('./lib/prisma');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const inquiryRoutes = require('./routes/inquiries');
const homepageRoutes = require('./routes/homepage');
const locationRoutes = require('./routes/locations');
const statsRoutes = require('./routes/stats');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const tradeLeadRoutes = require('./routes/tradeLeads');
const buyRequirementRoutes = require('./routes/buyRequirements');
const subscriptionRoutes = require('./routes/subscriptions');
const companyRoutes = require('./routes/companies');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/seller');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/trade-leads', tradeLeadRoutes);
app.use('/api/buy-requirements', buyRequirementRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.send('DealsDoubled.in Node.js Backend API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server only if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
  });
}

module.exports = app;
