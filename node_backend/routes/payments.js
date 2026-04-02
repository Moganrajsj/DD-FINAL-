const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayClient;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * @route POST /api/payments/create-order
 * Create a Razorpay order
 */
router.post('/create-order', requireAuth, async (req, res) => {
  if (!razorpayClient) {
    return res.status(500).json({ error: 'Payment gateway not configured' });
  }

  const { amount, currency = 'INR', order_id } = req.body;

  if (!amount || !order_id) {
    return res.status(400).json({ error: 'Amount and internal order_id are required' });
  }

  try {
    const razorpayOrder = await razorpayClient.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `order_${order_id}`,
      notes: {
        order_id: order_id.toString()
      }
    });

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('[Create Order Error]', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/payments/verify
 * Verify a Razorpay payment signature
 */
router.post('/verify', requireAuth, async (req, res) => {
  if (!razorpayClient) {
    return res.status(500).json({ error: 'Payment gateway not configured' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  try {
    // Verify signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update internal order
    const order = await prisma.order.update({
      where: { id: parseInt(order_id) },
      data: {
        paymentStatus: 'paid',
        paymentId: razorpay_payment_id,
        status: 'processing',
        updatedAt: new Date()
      },
      include: { product: { include: { category: true } } }
    });

    // Increment sales count (async, don't wait for response)
    if (order.product) {
      await prisma.product.update({
        where: { id: order.productId },
        data: { views: { increment: 1 } } // Wait, Python incremented sales_count
      });
      // Correct it to sales_count
      await prisma.product.update({
        where: { id: order.productId },
        data: { salesCount: { increment: 1 } }
      });

      if (order.product.category) {
        await prisma.category.update({
          where: { id: order.product.categoryId },
          data: { salesCount: { increment: 1 } }
        });
      }
    }

    // Add order tracking
    await prisma.orderTracking.create({
      data: {
        orderId: parseInt(order_id),
        status: 'processing',
        message: 'Payment received, order is being processed',
        location: ''
      }
    });

    // TODO: Send order confirmation email

    res.json({ message: 'Payment verified successfully', order_id });
  } catch (error) {
    console.error('[Verify Payment Error]', error);
    res.status(500).json({ error: `Payment verification failed: ${error.message}` });
  }
});

module.exports = router;
