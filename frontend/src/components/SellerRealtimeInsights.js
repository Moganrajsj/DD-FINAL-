import React from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiMail,
  FiPackage,
  FiShield,
  FiShoppingCart,
} from 'react-icons/fi';

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

function SellerRealtimeInsights({ data, loading = false, onMarkRead }) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8">
        <div className="animate-pulse text-slate-500">Loading real-time seller insights...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const cards = [
    { label: 'Trust Score', value: data.overview?.trust_score, icon: FiShield, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Views (24h)', value: data.overview?.product_views_24h, icon: FiEye, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Inquiries (24h)', value: data.overview?.new_inquiries_24h, icon: FiMail, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Orders (7d)', value: data.overview?.orders_7d, icon: FiShoppingCart, tone: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-8 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${card.tone}`}>
              <card.icon size={22} />
            </div>
            <p className="text-slate-500 text-sm font-medium">{card.label}</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{formatNumber(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-6">
            <FiActivity className="text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">Hot Product Demand</h3>
          </div>
          <div className="space-y-4">
            {(data.hot_products || []).slice(0, 6).map((product) => (
              <div key={product.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-800">{product.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Views {product.views} | Inquiries {product.inquiries} | Orders {product.orders}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black tracking-widest uppercase">
                  score {product.intent_score}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs text-slate-400 uppercase font-bold">View to Inquiry</p>
              <p className="text-2xl font-black text-slate-800 mt-2">{data.funnel?.view_to_inquiry_rate || 0}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs text-slate-400 uppercase font-bold">Inquiry to Order</p>
              <p className="text-2xl font-black text-slate-800 mt-2">{data.funnel?.inquiry_to_order_rate || 0}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs text-slate-400 uppercase font-bold">Response Rate</p>
              <p className="text-2xl font-black text-slate-800 mt-2">{data.trust?.response_rate || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="text-orange-500" />
              <h3 className="text-lg font-bold text-slate-800">Alert Center</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest">
              {data.overview?.unread_alerts || 0} unread
            </span>
          </div>

          <div className="space-y-3">
            {(data.alerts || []).length === 0 && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
                No active alerts right now.
              </div>
            )}

            {(data.alerts || []).slice(0, 6).map((alert) => (
              <div key={alert.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">{alert.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2">{new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                  {!alert.is_read && (
                    <button
                      type="button"
                      onClick={() => onMarkRead && onMarkRead(alert.id)}
                      className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-600 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(data.low_stock || []).length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <FiPackage className="text-amber-500" />
                <h4 className="font-bold text-slate-800">Low Stock Watch</h4>
              </div>
              <div className="space-y-2">
                {data.low_stock.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs text-amber-700 mt-1">{item.stock} units left</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-5">
            <FiClock className="text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">Live Activity</h3>
          </div>
          <div className="space-y-3">
            {(data.live_feed || []).slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {item.product_name || item.company_name || item.search_query || 'Marketplace signal'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-2 mb-5">
            <FiCheckCircle className="text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">Smart Recommendations</h3>
          </div>
          <div className="space-y-3">
            {(data.recommendations || []).map((item, index) => (
              <div key={index} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerRealtimeInsights;
