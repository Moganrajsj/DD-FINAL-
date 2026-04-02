import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiPackage, FiMail, FiShoppingCart, FiEdit, FiCheck, FiX, 
  FiClock, FiDollarSign, FiBarChart2, FiSend, FiMessageCircle,
  FiHome, FiLayers, FiTrendingUp, FiAlertCircle, FiPlus, FiTrash2,
  FiArrowRight, FiMaximize2, FiChevronRight, FiBox, FiCheckCircle, FiXCircle,
  FiRotateCw, FiUsers, FiUploadCloud, FiDownload, FiFileText, FiMessageSquare
} from 'react-icons/fi';
import NegotiationChat from '../components/NegotiationChat';
import SellerRealtimeInsights from '../components/SellerRealtimeInsights';
import { getPusher } from '../socket';

// --- Custom SVG Chart Components (Power BI Style) ---

const LineChart = ({ data = [], color = "#8884d8", height = 200 }) => {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-dark-muted">No data</div>;
  
  const width = 400;
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const padding = 20;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((d.total / maxVal) * (height - padding * 2) + padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="animate-draw-line"
      />
      <path
        d={`M ${padding},${height} L ${points} L ${width - padding},${height} Z`}
        fill="url(#lineGradient)"
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((d.total / maxVal) * (height - padding * 2) + padding);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2" className="hover:r-6 cursor-pointer transition-all" />
            <text x={x} y={height - 2} fontSize="8" textAnchor="middle" fill="#94a3b8">{d.month?.split('-')[1]}</text>
          </g>
        );
      })}
    </svg>
  );
};

const DonutChart = ({ data = [], height = 200 }) => {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-dark-muted text-sm">No data</div>;
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;
  const colors = ["#6366f1", "#a855f7", "#ec4899", "#f97316", "#10b981", "#3b82f6"];

  return (
    <div className="flex items-center">
      <svg viewBox="0 0 100 100" height={height} width={height} className="drop-shadow-lg">
        {data.map((d, i) => {
          const angle = (d.value / total) * 360;
          const x1 = 50 + 40 * Math.cos((Math.PI * currentAngle) / 180);
          const y1 = 50 + 40 * Math.sin((Math.PI * currentAngle) / 180);
          const x2 = 50 + 40 * Math.cos((Math.PI * (currentAngle + angle)) / 180);
          const y2 = 50 + 40 * Math.sin((Math.PI * (currentAngle + angle)) / 180);
          const largeArcFlag = angle > 180 ? 1 : 0;
          const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          currentAngle += angle;
          return <path key={i} d={pathData} fill={colors[i % colors.length]} stroke="white" strokeWidth="1" />;
        })}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      <div className="ml-4 space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center text-xs">
            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: colors[i % colors.length] }}></span>
            <span className="text-dark-muted truncate w-24">{d.name}</span>
            <span className="text-dark-text font-bold ml-auto">{Math.round((d.value/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---

function SellerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [liveInsights, setLiveInsights] = useState(null);
  
  // Interaction State
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [negotiatingWith, setNegotiatingWith] = useState(null);
  
  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/api/seller/bulk-upload/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DealsDouble_Bulk_Upload_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template. Please ensure the backend is running.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.is_admin) { navigate('/admin'); return; }
    if (!parsedUser.has_company) { navigate('/register-company'); return; }
    if (!parsedUser.company_verified) { navigate('/post-product'); return; }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const [statsRes, productsRes, inquiriesRes, ordersRes, liveInsightsRes] = await Promise.all([
        axios.get(`/api/seller/stats?user_id=${currentUser.id}`),
        axios.get(`/api/seller/products?user_id=${currentUser.id}`),
        axios.get(`/api/seller/inquiries?company_id=${currentUser.company_id}`),
        axios.get(`/api/seller/orders?user_id=${currentUser.id}`),
        axios.get(`/api/seller/live-insights?user_id=${currentUser.id}`),
      ]);
      
      setStats(statsRes.data);
      setProducts(productsRes.data);
      setInquiries(inquiriesRes.data);
      setOrders(ordersRes.data);
      setLiveInsights(liveInsightsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.company_id) return undefined;

    const pusher = getPusher();
    const room = `seller_dashboard_${user.company_id}`;
    const channel = pusher.subscribe(room);

    const handleDashboardUpdate = () => {
      fetchDashboardData();
    };

    channel.bind('dashboard_update', handleDashboardUpdate);
    channel.bind('seller_alert', handleDashboardUpdate);

    return () => {
      channel.unbind('dashboard_update', handleDashboardUpdate);
      channel.unbind('seller_alert', handleDashboardUpdate);
      pusher.unsubscribe(room);
    };
  }, [user?.company_id]);

  const handleUpdateProduct = async (id, data) => {
    setSaving(true);
    try {
      await axios.put(`/api/seller/products/${id}`, { ...data, user_id: user.id });
      setProducts(products.map(p => p.id === id ? { ...p, ...data } : p));
      setEditingProduct(null);
    } catch (error) {
      alert('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`/api/seller/products/${id}?user_id=${user.id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/seller/orders/${orderId}/status`, { status: newStatus, user_id: user.id });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleReply = async (inquiryId) => {
    if (!replyMessage.trim() || !user) return;
    
    const msgText = replyMessage.trim();
    
    setReplyMessage('');
    setReplyingTo(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/inquiries/${inquiryId}/chat`, {
        message: msgText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Optionally re-fetch inquiries or chat here
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('user_id', user.id);

    try {
      const res = await axios.post('/api/seller/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult({
        success: true,
        message: res.data.message,
        successCount: res.data.success_count,
        errorCount: res.data.error_count,
        errors: res.data.errors
      });
      fetchDashboardData(); 
    } catch (error) {
      setUploadResult({
        success: false,
        message: error.response?.data?.error || 'Upload failed'
      });
    } finally {
      setUploading(false);
      setUploadFile(null);
    }
  };

  const handleMarkAlertRead = async (alertId) => {
    if (!user) return;
    try {
      await axios.post(`/api/seller/alerts/${alertId}/read`, { user_id: user.id });
      fetchDashboardData();
    } catch (error) {
      console.error('Error marking seller alert as read:', error);
    }
  };




  const menuItems = [
    { id: 'overview', name: 'Overview', icon: FiHome },
    { id: 'inventory', name: 'Inventory', icon: FiLayers },
    { id: 'bulk_upload', name: 'Bulk Upload', icon: FiUploadCloud },
    { id: 'orders', name: 'Orders', icon: FiShoppingCart },
    { id: 'inquiries', name: 'Inquiries', icon: FiMail },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Synchronizing Seller Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <FiTrendingUp size={20} />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">SellerPulse</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs text-slate-400 mb-1">Membership Tier</p>
              <h4 className="font-bold text-lg mb-2">PLATINUM</h4>
              <button className="text-xs font-bold text-indigo-400 flex items-center gap-1 hover:text-white transition-colors">
                UPGRADE NOW <FiChevronRight />
              </button>
            </div>
            <FiBox className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
            <p className="text-xs text-slate-500">Real-time business insights for {user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => fetchDashboardData()} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <FiRotateCw className={saving ? 'animate-spin' : ''} />
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">JD</div>
              <span className="text-xs font-semibold text-slate-700">John Doe</span>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* TAB: OVERVIEW (The Power BI Tab) */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <SellerRealtimeInsights
                data={liveInsights}
                loading={loading && !liveInsights}
                onMarkRead={handleMarkAlertRead}
              />

              {/* Pulse Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: `₹${stats?.summary?.revenue?.toLocaleString() || '0'}`, color: 'indigo', icon: FiDollarSign, trend: '+12%' },
                  { label: 'Active Orders', value: stats?.summary?.total_orders || '0', color: 'emerald', icon: FiShoppingCart, trend: '+5' },
                  { label: 'Unread Leads', value: stats?.summary?.total_inquiries || '0', color: 'purple', icon: FiMail, trend: 'NEW' },
                  { label: 'Inventory Items', value: stats?.summary?.total_products || '0', color: 'orange', icon: FiLayers, trend: 'Stable' },
                ].map((card, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="relative z-10">
                      <div className={`w-12 h-12 rounded-2xl bg-${card.color}-100 text-${card.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <card.icon size={24} />
                      </div>
                      <p className="text-slate-500 text-sm font-medium mb-1">{card.label}</p>
                      <h3 className="text-2xl font-black text-slate-800">{card.value}</h3>
                      <span className={`text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full bg-${card.color}-50 text-${card.color}-600 inline-block`}>
                        {card.trend}
                      </span>
                    </div>
                    <div className={`absolute -right-2 -top-2 w-24 h-24 rounded-full bg-${card.color}-50/50 -z-0 group-hover:scale-150 transition-transform duration-700`} />
                  </div>
                ))}
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Revenue Performance</h3>
                      <p className="text-xs text-slate-400">Monthly revenue tracking for the last 6 months</p>
                    </div>
                    <div className="flex gap-2">
                       <button className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">6 MONTHS</button>
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    <LineChart data={stats?.trends.monthly_revenue || []} color="#6366f1" />
                  </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Lead Sources</h3>
                  <p className="text-xs text-slate-400 mb-8">Inquiries distribution by category</p>
                  <div className="h-[250px] flex items-center justify-center">
                    <DonutChart data={stats?.distribution.category_inquiries || []} />
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Alerts */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <FiAlertCircle className="text-orange-500" />
                    <h3 className="text-lg font-bold text-slate-800">Operational Alerts</h3>
                  </div>
                  <div className="space-y-4">
                    {stats?.alerts.low_stock.length > 0 ? stats.alerts.low_stock.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-orange-50 border border-orange-100 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shadow-sm font-black">!</div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-orange-600">Stock level critically low: {item.stock} left</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-orange-600 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-orange-200" onClick={() => setActiveTab('inventory')}>RESTOCK</button>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400">
                        <FiCheck className="mx-auto mb-2 text-emerald-500" size={32} />
                        All systems operational. No inventory alerts.
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Enquiries</h3>
                   <div className="space-y-4">
                      {inquiries.slice(0, 4).map((enq, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold uppercase transition-transform group-hover:scale-110">
                              {enq.buyer_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{enq.buyer_name}</p>
                              <p className="text-[10px] text-slate-400">Interested in: <span className="text-indigo-600">{enq.product_name}</span></p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(enq.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                      <button onClick={() => setActiveTab('inquiries')} className="w-full py-3 mt-4 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">VIEW ALL LEADS</button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200">
                <div>
                   <h3 className="text-lg font-bold text-slate-800">Product Management</h3>
                   <p className="text-xs text-slate-400">Update pricing and stock levels instantly</p>
                </div>
                <button onClick={() => navigate('/post-product')} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-2 hover:scale-105 transition-transform active:scale-95">
                  <FiPlus /> ADD PRODUCT
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Product Info</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Category</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Price</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Stock</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden">
                              <img src={product.image_url || '/placeholder.png'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{product.name}</p>
                              <div className="flex gap-2 mt-1">
                                {!product.approved && <span className="bg-amber-50 text-amber-600 text-[8px] font-black uppercase px-2 py-0.5 rounded">PENDING</span>}
                                {product.is_priority && <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase px-2 py-0.5 rounded">PRIORITY</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{product.category_name}</span>
                        </td>
                        <td className="px-8 text-center">
                          {editingProduct === product.id ? (
                            <input 
                              type="number" 
                              className="w-24 px-3 py-2 rounded-xl bg-white border border-indigo-300 text-sm font-bold text-indigo-700 outline-none"
                              defaultValue={product.price}
                              onBlur={(e) => handleUpdateProduct(product.id, { price: e.target.value })}
                            />
                          ) : (
                            <p className="font-bold text-slate-800">₹{product.price?.toLocaleString()}</p>
                          )}
                        </td>
                        <td className="px-8 text-center">
                           {editingProduct === product.id ? (
                            <input 
                              type="number" 
                              className="w-20 px-3 py-2 rounded-xl bg-white border border-indigo-300 text-sm font-bold text-indigo-700 outline-none"
                              defaultValue={product.stock_quantity}
                              onBlur={(e) => handleUpdateProduct(product.id, { stock_quantity: e.target.value })}
                            />
                          ) : (
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black ${product.stock_quantity < 10 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {product.stock_quantity} UNITS
                            </span>
                          )}
                        </td>
                        <td className="px-8 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingProduct(product.id === editingProduct ? null : product.id)} className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                              <FiEdit size={16} />
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: BULK UPLOAD */}
          {activeTab === 'bulk_upload' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Smart Catalog Uploader</h3>
                  <p className="text-slate-500 mb-8">Upload hundreds of products instantly via professional Excel templates.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm mb-4">
                        <FiDownload size={24} />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">Step 1: Get Template</h4>
                      <p className="text-xs text-slate-500 mb-6">Download our refined Excel template with pre-styled headers and categories.</p>
                      <button 
                        onClick={handleDownloadTemplate}
                        className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
                      >
                        <FiFileText /> DOWNLOAD EXCEL
                      </button>
                    </div>

                    <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm mb-4">
                        <FiCheckCircle size={24} />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">Step 2: Upload Data</h4>
                      <p className="text-xs text-slate-500 mb-6">Fill the template and drop it here. Our AI validates every row for you.</p>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">EXCEL (.XLSX) ONLY</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div 
                      className={`border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center transition-all ${
                        uploadFile ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="catalog-upload" 
                        className="hidden" 
                        accept=".xlsx"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                      />
                      <label htmlFor="catalog-upload" className="cursor-pointer flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 mb-4 shadow-sm group-hover:text-indigo-500 transition-colors">
                          <FiUploadCloud size={40} className={uploading ? 'animate-spin' : ''} />
                        </div>
                        <p className="font-bold text-slate-800">
                          {uploadFile ? uploadFile.name : 'Click to select or drag Excel file here'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Supports professional .xlsx files up to 10MB</p>
                      </label>
                    </div>

                    {uploadFile && (
                      <button 
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-200 hover:scale-[1.01] transition-transform flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            VALIDATING CATALOG...
                          </>
                        ) : (
                          <>
                            <FiCheck /> INITIALIZE BULK IMPORT
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {uploadResult && (
                    <div className={`mt-8 p-6 rounded-3xl border ${uploadResult.success ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} animate-in fade-in duration-300`}>
                      <div className="flex items-center gap-3 mb-4">
                        {uploadResult.success ? <FiCheckCircle className="text-emerald-600" size={24} /> : <FiAlertCircle className="text-rose-600" size={24} />}
                        <div className="flex-1">
                          <h4 className={`font-black uppercase tracking-tight text-sm ${uploadResult.success ? 'text-emerald-800' : 'text-rose-800'}`}>
                            {uploadResult.message}
                          </h4>
                          {uploadResult.success && (
                            <p className="text-xs text-emerald-600 font-bold">
                              Processed: {uploadResult.successCount} Successful, {uploadResult.errorCount} Failed
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {uploadResult.errorCount > 0 && (
                        <div className="space-y-2 mt-4">
                          <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Error Log ({uploadResult.errorCount})</p>
                          <div className="bg-white/50 p-4 rounded-2xl border border-rose-100 max-h-40 overflow-y-auto">
                            {uploadResult.errors.map((err, idx) => (
                              <p key={idx} className="text-[10px] text-rose-600 font-medium py-1 border-b border-rose-50 last:border-0">• {err}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {uploadResult.success && (
                        <button 
                          onClick={() => setActiveTab('inventory')}
                          className="mt-6 w-full py-3 bg-indigo-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                        >
                          VIEW INVENTORY
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="absolute top-0 right-0 p-10 opacity-5 -z-0">
                  <FiPackage size={200} className="rotate-12" />
                </div>
              </div>

              {/* Tips Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-8 rounded-[40px] text-white">
                  <h4 className="font-bold mb-4 flex items-center gap-2"><FiCheckCircle className="text-emerald-400" /> Best Practices</h4>
                  <ul className="space-y-3 text-xs text-slate-400">
                    <li>• Ensure columns match the template exactly.</li>
                    <li>• Category names must exist in the marketplace.</li>
                    <li>• Use simple numeric values for price and stock.</li>
                    <li>• Avoid special characters in product names.</li>
                  </ul>
                </div>
                <div className="bg-indigo-600 p-8 rounded-[40px] text-white">
                  <h4 className="font-bold mb-4 flex items-center gap-2"><FiBox /> Auto-Mapping</h4>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    Our system automatically assigns professional category-based images to your products if you don't provide a URL. You can always update these individually in the Inventory tab.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INQUIRIES */}
          {activeTab === 'inquiries' && (
             <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-500">
                 {inquiries.length === 0 ? (
                    <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200">
                        <FiMail size={64} className="mx-auto mb-4 text-slate-200" />
                        <h3 className="text-xl font-bold text-slate-800">No Inquiries Yet</h3>
                        <p className="text-slate-400">When buyers contact you, their messages will appear here.</p>
                    </div>
                 ) : (
                   inquiries.map((enq) => (
                    <div key={enq.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="p-8">
                             <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl uppercase">
                                     {enq.buyer_name?.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-black text-slate-800">{enq.buyer_name}</h4>
                                    <p className="text-xs text-slate-400">{enq.buyer_email} • {enq.buyer_phone}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Inquiry Date</p>
                                   <p className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{new Date(enq.created_at).toLocaleDateString()}</p>
                                   <p className={`mt-2 text-[10px] font-black uppercase tracking-widest ${
                                     enq.lead_temperature === 'hot'
                                       ? 'text-rose-500'
                                       : enq.lead_temperature === 'warm'
                                         ? 'text-amber-500'
                                         : 'text-slate-400'
                                   }`}>
                                     {enq.lead_temperature} lead | score {enq.lead_score}
                                   </p>
                                </div>
                             </div>

                             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 relative">
                                <p className="text-indigo-600 text-[10px] font-black uppercase mb-2">Message regarding: {enq.product_name}</p>
                                <p className="text-slate-800 text-sm leading-relaxed italic">"{enq.message}"</p>
                                {enq.quantity && <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-100 text-[10px] font-bold">Qty: {enq.quantity}</div>}
                             </div>

                             {/* Replies History */}
                             {enq.replies?.length > 0 && (
                                <div className="space-y-4 mb-8">
                                   {enq.replies.map((reply, idx) => (
                                     <div key={idx} className="flex gap-4 pl-12">
                                        <div className="flex-1 bg-indigo-600 text-white p-4 rounded-3xl rounded-tl-none text-sm relative">
                                           <p>{reply.message}</p>
                                           <span className="absolute -top-2 left-0 text-[10px] font-bold text-indigo-400">{reply.seller_name} reply</span>
                                           <span className="block text-right text-[8px] text-white/60 mt-2">{new Date(reply.created_at).toLocaleTimeString()}</span>
                                        </div>
                                     </div>
                                   ))}
                                </div>
                              )}
                              {/* Quick Reply Form */}
                             {replyingTo === enq.id ? (
                               <div className="animate-in fade-in duration-300">
                                   <textarea 
                                      className="w-full bg-slate-50 border border-indigo-100 rounded-3xl p-6 text-slate-800 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                                      placeholder="Compose your reply..."
                                      rows="4"
                                      autoFocus
                                      value={replyMessage}
                                      onChange={(e) => setReplyMessage(e.target.value)}
                                   />
                                   <div className="flex gap-4 mt-6">
                                      <button 
                                        onClick={() => handleReply(enq.id)}
                                        disabled={saving || !replyMessage.trim()}
                                        className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                                      >
                                        <FiSend /> {saving ? 'SENDING...' : 'SEND MESSAGE'}
                                      </button>
                                      <button onClick={() => { setReplyingTo(null); setReplyMessage(''); }} className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">CANCEL</button>
                                   </div>
                               </div>
                             ) : (
                               <div className="flex gap-4">
                                 <button 
                                   onClick={() => setNegotiatingWith(enq.id)} 
                                   className="flex-1 py-5 bg-indigo-600 text-white font-bold rounded-[32px] hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                 >
                                   <FiMessageSquare /> NEGOTIATE
                                 </button>
                                 <button 
                                   onClick={() => setReplyingTo(enq.id)} 
                                   className="px-8 py-5 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-[32px] hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                                 >
                                   REPLY
                                 </button>
                               </div>
                             )}

                             {/* Negotiation Modal/Overlay */}
                             {negotiatingWith === enq.id && (
                               <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                                 <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                                   <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                     <h3 className="text-xl font-black text-slate-800">Negotiating with {enq.buyer_name}</h3>
                                     <button onClick={() => setNegotiatingWith(null)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                       <FiX />
                                     </button>
                                   </div>
                                   <div className="p-6">
                                     <NegotiationChat inquiryId={enq.id} currentUser={user} />
                                   </div>
                                 </div>
                               </div>
                             )}
                        </div>
                    </div>
                   ))
                 )}
             </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-800">Fulfillment Pipeline</h3>
                  <div className="flex gap-2">
                     <span className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100">ALL ORDERS</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-[32px] border border-slate-200 p-8 flex flex-col lg:flex-row gap-8 items-center shadow-sm hover:shadow-xl transition-all">
                       <div className="w-24 h-24 rounded-[32px] bg-slate-100 flex items-center justify-center text-slate-400 group overflow-hidden border border-slate-100">
                          <img src={order.product?.image_url || '/placeholder.png'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                       </div>
                       
                       <div className="flex-1 text-center lg:text-left">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-3">
                             <h4 className="text-lg font-black text-slate-800">{order.product_name}</h4>
                             <span className={`lg:ml-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                order.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                                'bg-slate-50 text-slate-400 border border-slate-100'
                             }`}>
                                {order.status}
                             </span>
                          </div>
                          <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
                             <div className="flex items-center gap-1"><FiUsers /> {order.buyer_name}</div>
                             <div className="flex items-center gap-1 font-bold text-slate-800">QTY: {order.quantity}</div>
                             <div className="flex items-center gap-1 font-bold text-emerald-600">₹{order.total_amount?.toLocaleString()}</div>
                          </div>
                       </div>

                       <div className="flex gap-3 w-full lg:w-auto">
                          {order.status === 'pending' && (
                            <>
                               <button 
                                  onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                  className="flex-1 lg:flex-none px-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:scale-105 transition-transform flex items-center justify-center gap-2"
                               >
                                  <FiCheck /> COMPLETE
                               </button>
                               <button 
                                  onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                  className="flex-1 lg:flex-none px-6 py-4 bg-white border-2 border-slate-200 text-slate-400 font-bold rounded-2xl hover:border-rose-500 hover:text-rose-500 transition-all flex items-center justify-center gap-2"
                               >
                                  <FiX /> CANCEL
                               </button>
                            </>
                          )}
                          {order.status === 'completed' && (
                            <div className="px-8 py-4 bg-emerald-50 text-emerald-600 font-black text-xs rounded-2xl border border-emerald-100 flex items-center gap-2">
                               <FiCheckCircle size={20} /> FULFILLED
                            </div>
                          )}
                          {order.status === 'cancelled' && (
                            <div className="px-8 py-4 bg-rose-50 text-rose-600 font-black text-xs rounded-2xl border border-rose-100 flex items-center gap-2">
                               <FiXCircle size={20} /> CANCELLED
                            </div>
                          )}
                          <button className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-colors">
                             <FiMaximize2 />
                          </button>
                       </div>
                    </div>
                  ))}

                  {orders.length === 0 && (
                     <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                        <FiShoppingCart size={48} className="mx-auto mb-4 text-slate-200" />
                        <h4 className="text-xl font-bold text-slate-800">Awaiting Orders</h4>
                        <p className="text-slate-400">Your sales pipeline is empty. Boost your items to reach more buyers!</p>
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* CSS Animations */}
      <style>{`
        @keyframes draw-line {
          from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        .animate-draw-line {
          stroke-dasharray: 1000;
          animation: draw-line 2.5s ease-out forwards;
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}

export default SellerDashboard;
