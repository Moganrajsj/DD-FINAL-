const Pusher = require('pusher');

let pusher = null;

if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER || 'ap2',
    useTLS: true,
  });
}

/**
 * Trigger a Pusher event (replaces Socket.IO emit)
 * @param {string} channel - e.g. 'admin-dashboard' or 'seller-123'
 * @param {string} event   - e.g. 'new-inquiry' or 'seller-alert'
 * @param {object} data    - payload to send
 */
const triggerEvent = async (channel, event, data) => {
  if (!pusher) {
    // No Pusher configured — silently skip (real-time disabled)
    return;
  }
  try {
    await pusher.trigger(channel, event, data);
  } catch (err) {
    console.warn('[Pusher] Failed to trigger event:', err.message);
  }
};

// Standardized channel names matching the frontend subscriptions
const Channels = {
  adminDashboard: () => 'admin-dashboard',
  sellerDashboard: (companyId) => `seller-dashboard-${companyId}`,
  inquiry: (inquiryId) => `inquiry-${inquiryId}`,
};

module.exports = { triggerEvent, Channels };
