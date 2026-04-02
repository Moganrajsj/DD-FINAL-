const prisma = require('./prisma');
const { triggerEvent, Channels } = require('./pusher');

/**
 * Record a marketplace event for analytics and real-time dashboard updates.
 */
const recordMarketplaceEvent = async ({
  eventType,
  sessionId = "",
  userId = null,
  companyId = null,
  productId = null,
  categoryId = null,
  inquiryId = null,
  orderId = null,
  location = "",
  searchQuery = "",
  metadata = {},
  emitUpdates = true,
}) => {
  try {
    const event = await prisma.marketplaceEvent.create({
      data: {
        eventType,
        sessionId,
        userId,
        companyId,
        productId,
        categoryId,
        inquiryId,
        orderId,
        location,
        searchQuery: searchQuery.substring(0, 255),
        metadataJson: JSON.stringify(metadata),
      },
      include: {
        user: true,
        company: true,
        product: true,
        category: true,
      },
    });

    if (emitUpdates) {
      // Emit to admin dashboard
      await triggerEvent(Channels.adminDashboard(), 'marketplace_event', serializeEvent(event));
      
      // Emit to seller dashboard if relevant
      if (companyId) {
        await triggerEvent(Channels.sellerDashboard(companyId), 'marketplace_event', serializeEvent(event));
      }
    }

    return event;
  } catch (error) {
    console.error('[Analytics Error]', error);
  }
};

/**
 * Create a persistent alert for a seller.
 */
const createSellerAlert = async ({
  companyId,
  alertType,
  title,
  message = "",
  severity = "info",
  entityType = "",
  entityId = null,
  emitUpdates = true,
}) => {
  try {
    const alert = await prisma.sellerAlert.create({
      data: {
        companyId,
        alertType,
        title,
        message,
        severity,
        entityType,
        entityId,
      },
    });

    if (emitUpdates) {
      await triggerEvent(Channels.sellerDashboard(companyId), 'seller_alert', alert);
    }

    return alert;
  } catch (error) {
    console.error('[Alert Error]', error);
  }
};

/**
 * Helper to serialize event for Pusher/API
 */
const serializeEvent = (event) => {
  const labels = {
    homepage_view: "Landing page visit",
    catalog_view: "Catalog exploration",
    search: event.searchQuery ? `Search: ${event.searchQuery}` : "Marketplace search",
    product_view: event.product ? `Viewed ${event.product.name}` : "Product view",
    inquiry_created: event.product ? `Inquiry for ${event.product.name}` : "New inquiry",
    order_created: event.product ? `Order for ${event.product.name}` : "New order",
    buy_requirement_created: "Buy requirement posted",
    negotiation_message: "Negotiation activity",
  };

  const metadata = JSON.parse(event.metadataJson || '{}');

  return {
    id: event.id,
    event_type: event.eventType,
    title: labels[event.eventType] || event.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    location: event.location || "Unknown",
    company_name: event.company ? event.company.name : null,
    product_name: event.product ? event.product.name : metadata.product_name,
    category_name: event.category ? event.category.name : metadata.category_name,
    search_query: event.searchQuery || null,
    metadata,
    created_at: event.createdAt.toISOString(),
  };
};

const scoreLeadQuality = (message = "", quantity = "") => {
  const lowered = (message || "").toLowerCase();
  let score = 35;

  let qtyNum = 0;
  try {
    const qtyMatch = (quantity || "").toString().match(/\d+/g);
    qtyNum = qtyMatch ? parseInt(qtyMatch.join("")) : 0;
  } catch (e) {
    qtyNum = 0;
  }

  if (qtyNum >= 1000) score += 30;
  else if (qtyNum >= 250) score += 20;
  else if (qtyNum >= 50) score += 10;

  const keywords = {
    bulk: 12,
    wholesale: 10,
    export: 10,
    contract: 12,
    urgent: 8,
    container: 12,
    repeat: 8,
    monthly: 10,
    partnership: 14,
  };

  for (const [keyword, weight] of Object.entries(keywords)) {
    if (lowered.includes(keyword)) {
      score += weight;
    }
  }

  score = Math.max(0, Math.min(score, 100));
  let temperature = "cold";
  if (score >= 80) temperature = "hot";
  else if (score >= 55) temperature = "warm";

  return {
    score,
    temperature,
    quantity: qtyNum,
  };
};

module.exports = {
  recordMarketplaceEvent,
  createSellerAlert,
  scoreLeadQuality,
};
