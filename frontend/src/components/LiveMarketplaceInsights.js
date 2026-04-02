import React from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiClock,
  FiMapPin,
  FiPackage,
  FiSearch,
  FiShoppingCart,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from 'react-icons/fi';

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function LiveMarketplaceInsights({ data, loading = false }) {
  if (loading) {
    return (
      <div className="glass-effect rounded-xl p-8 mb-8">
        <div className="animate-pulse text-dark-muted">Loading live marketplace insights...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-effect rounded-xl p-8 mb-8">
        <p className="text-dark-muted">Live marketplace insights will appear here as buyer activity grows.</p>
      </div>
    );
  }

  const overviewCards = [
    { label: 'Active Buyers (24h)', value: formatNumber(data.overview?.active_buyers_24h), icon: FiUsers, tone: 'from-blue-500 to-cyan-500' },
    { label: 'Searches (24h)', value: formatNumber(data.overview?.searches_24h), icon: FiSearch, tone: 'from-purple-500 to-pink-500' },
    { label: 'Product Views (24h)', value: formatNumber(data.overview?.product_views_24h), icon: FiPackage, tone: 'from-emerald-500 to-teal-500' },
    { label: 'Inquiries (24h)', value: formatNumber(data.overview?.inquiries_24h), icon: FiZap, tone: 'from-orange-500 to-amber-500' },
    { label: 'Orders (24h)', value: formatNumber(data.overview?.orders_24h), icon: FiShoppingCart, tone: 'from-indigo-500 to-violet-500' },
  ];

  return (
    <div className="space-y-6 mb-8">
      <div className="glass-effect rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-dark-text">Live Marketplace Pulse</h2>
            <p className="text-sm text-dark-muted">Real-time buyer intent, demand signals, and conversion health.</p>
          </div>
          <span className="text-xs font-semibold text-dark-muted">Updated {new Date(data.updated_at).toLocaleTimeString()}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {overviewCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.tone} text-white flex items-center justify-center mb-4`}>
                <card.icon size={20} />
              </div>
              <p className="text-sm text-dark-muted">{card.label}</p>
              <p className="text-2xl font-black text-dark-text mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-effect rounded-xl p-6 xl:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <FiActivity className="text-accent-purple" />
            <h3 className="text-xl font-bold text-dark-text">Buyer Intent Radar</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-dark-muted mb-3">Top Searches</p>
              <div className="space-y-3">
                {(data.buyer_intent?.top_searches || []).slice(0, 5).map((item) => (
                  <div key={item.term} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-sm font-semibold text-dark-text">{item.term}</span>
                    <span className="text-xs text-accent-purple font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-dark-muted mb-3">Active Categories</p>
              <div className="space-y-3">
                {(data.buyer_intent?.active_categories || []).slice(0, 5).map((item) => (
                  <div key={item.name} className="rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-dark-text">{item.name}</span>
                      <span className="text-xs text-accent-blue font-bold">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-dark-muted mb-3">High Intent Products</p>
              <div className="space-y-3">
                {(data.buyer_intent?.high_intent_products || []).slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-dark-text">{item.name}</p>
                    <p className="text-xs text-dark-muted mt-1">
                      Views {item.views} | Inquiries {item.inquiries} | Orders {item.orders}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <FiBarChart2 className="text-accent-blue" />
            <h3 className="text-xl font-bold text-dark-text">Conversion Funnel</h3>
          </div>
          <div className="space-y-4">
            {[
              ['Visitors', data.funnel?.visitors],
              ['Searches', data.funnel?.searches],
              ['Product Views', data.funnel?.product_views],
              ['Inquiries', data.funnel?.inquiries],
              ['Orders', data.funnel?.orders],
            ].map(([label, value], index) => (
              <div key={label} className="rounded-xl bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-dark-text">{index + 1}. {label}</span>
                  <span className="text-sm font-black text-dark-text">{formatNumber(value)}</span>
                </div>
                <div className="h-2 rounded-full bg-white overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-pink"
                    style={{ width: `${Math.min(100, (Number(value || 0) / Math.max(Number(data.funnel?.visitors || 1), 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-sm text-dark-muted">
            <p>Search to view: <span className="font-bold text-dark-text">{data.funnel?.search_to_view_rate || 0}%</span></p>
            <p>View to inquiry: <span className="font-bold text-dark-text">{data.funnel?.view_to_inquiry_rate || 0}%</span></p>
            <p>Inquiry to order: <span className="font-bold text-dark-text">{data.funnel?.inquiry_to_order_rate || 0}%</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <FiMapPin className="text-accent-green" />
            <h3 className="text-xl font-bold text-dark-text">Demand Heatmap</h3>
          </div>
          <div className="space-y-3">
            {(data.demand_heatmap || []).slice(0, 6).map((item) => (
              <div key={`${item.location}-${item.category}`} className="rounded-xl bg-gray-50 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-dark-text">{item.location}</p>
                    <p className="text-xs text-dark-muted">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-dark-text">{item.intent_score}</p>
                    <p className="text-xs text-dark-muted">intent score</p>
                  </div>
                </div>
                <p className="text-xs text-dark-muted mt-2">
                  Events {item.events} | Inquiries {item.inquiries} | Orders {item.orders}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <FiTrendingUp className="text-accent-orange" />
            <h3 className="text-xl font-bold text-dark-text">Price Intelligence</h3>
          </div>
          <div className="space-y-3 mb-5">
            {(data.price_intelligence?.categories || []).slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-dark-text">{item.name}</span>
                  <span className={`text-xs font-bold ${item.avg_trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.avg_trend >= 0 ? '+' : ''}{item.avg_trend}%
                  </span>
                </div>
                <p className="text-xs text-dark-muted mt-1">
                  Avg price {formatCurrency(item.avg_price)} | {item.product_count} products
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-dark-muted mb-3">Hot Products</p>
          <div className="space-y-2">
            {(data.price_intelligence?.products || []).slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-dark-text">{item.name}</p>
                  <p className="text-xs text-dark-muted">{item.company_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-dark-text">{formatCurrency(item.price)}</p>
                  <p className={`text-xs font-semibold ${item.price_trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.price_trend >= 0 ? '+' : ''}{item.price_trend}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-effect rounded-xl p-6 xl:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <FiClock className="text-accent-purple" />
            <h3 className="text-xl font-bold text-dark-text">Live Activity Feed</h3>
          </div>
          <div className="space-y-3">
            {(data.live_feed || []).slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-xl bg-gray-50 px-4 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-dark-text">{item.title}</p>
                  <p className="text-xs text-dark-muted mt-1">
                    {item.product_name || item.category_name || item.search_query || item.company_name || 'Marketplace activity'}
                  </p>
                </div>
                <span className="text-xs text-dark-muted whitespace-nowrap">
                  {new Date(item.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-bold text-dark-text mb-5">Recommendations</h3>
          <div className="space-y-3">
            {(data.recommendations || []).map((item, index) => (
              <div key={index} className="rounded-xl bg-gray-50 px-4 py-4 text-sm text-dark-text">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveMarketplaceInsights;
