import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiUsers, FiFileText, FiTrendingUp, FiShield, FiSettings, FiDollarSign, FiShoppingCart, FiBarChart2, FiPieChart } from 'react-icons/fi';

function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCompanies, setPendingCompanies] = useState([]);

  useEffect(() => {
    // Check if user is admin (for demo, check if logged in)
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const adminAccess = localStorage.getItem('admin_access');
    
    if (!token || !user) {
      navigate('/admin/login');
      return;
    }

    // Check if accessed through admin login
    if (!adminAccess) {
      navigate('/admin/login');
      return;
    }

    // For demo purposes, any logged-in user can access admin
    // In production, check user role from backend
    setIsAdmin(true);
    fetchAdminData();
    fetchAnalytics();
    fetchPendingCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const fetchAdminData = async () => {
    try {
      const [statsRes, productsRes, suppliersRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/products?limit=10'),
        axios.get('/api/suppliers')
      ]);
      
      // Ensure we have arrays
      const recentProducts = Array.isArray(productsRes.data) ? productsRes.data.slice(0, 5) : [];
      const suppliersList = Array.isArray(suppliersRes.data) ? suppliersRes.data.slice(0, 5) : [];
      
      setStats({
        ...statsRes.data,
        recentProducts: recentProducts,
        suppliersList: suppliersList  // Use different name to avoid conflict with stats.suppliers (count)
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setStats({
        products: 0,
        suppliers: 0,
        categories: 0,
        recentProducts: [],
        suppliersList: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    }
  };

  const fetchPendingCompanies = async () => {
    try {
      const response = await axios.get('/api/companies/pending');
      // Ensure we have an array
      if (Array.isArray(response.data)) {
        setPendingCompanies(response.data);
      } else {
        setPendingCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching pending companies:', error);
      setPendingCompanies([]);
    }
  };

  const handleVerifyCompany = async (companyId) => {
    try {
      await axios.post(`/api/companies/verify/${companyId}`);
      alert('Company verified successfully!');
      fetchPendingCompanies();
      // Refresh admin data
      fetchAdminData();
    } catch (error) {
      console.error('Error verifying company:', error);
      alert('Failed to verify company. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="glass-effect rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-dark-muted">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-dark-text">Admin Portal</h1>
          <p className="text-dark-muted">Manage your marketplace</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                <FiPackage className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{stats?.products || 0}</h3>
            <p className="text-dark-muted">Total Products</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center">
                <FiUsers className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{stats?.suppliers || 0}</h3>
            <p className="text-dark-muted">Total Suppliers</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center">
                <FiFileText className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{stats?.categories || 0}</h3>
            <p className="text-dark-muted">Categories</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-orange to-yellow-500 flex items-center justify-center">
                <FiTrendingUp className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{stats?.users || 0}</h3>
            <p className="text-dark-muted">Registered Users</p>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <FiShoppingCart className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-dark-text mb-1">{analytics.total_orders || 0}</h3>
                <p className="text-dark-muted">Total Orders</p>
                <p className="text-sm text-accent-green mt-2">+{analytics.recent_orders_30d || 0} in last 30 days</p>
              </div>

              <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <FiDollarSign className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-dark-text mb-1">₹{(analytics.total_revenue || 0).toLocaleString('en-IN')}</h3>
                <p className="text-dark-muted">Total Revenue</p>
                <p className="text-sm text-accent-orange mt-2">From completed orders</p>
              </div>

              <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <FiBarChart2 className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-dark-text mb-1">
                  ₹{analytics.total_orders > 0 ? ((analytics.total_revenue || 0) / analytics.total_orders).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
                </h3>
                <p className="text-dark-muted">Average Order Value</p>
                <p className="text-sm text-accent-blue mt-2">Per order</p>
              </div>
            </div>

            {/* Revenue by Month Chart */}
            <div className="glass-effect rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                <FiTrendingUp className="text-accent-purple" />
                Revenue Trend (Last 6 Months)
              </h2>
              {analytics.revenue_by_month && analytics.revenue_by_month.length > 0 ? (
                <div className="space-y-4">
                  {analytics.revenue_by_month.map((item, idx) => {
                    const maxRevenue = Math.max(...analytics.revenue_by_month.map(r => r.revenue));
                    const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-dark-muted font-medium">{item.month}</div>
                        <div className="flex-1 bg-gray-50 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-purple to-accent-pink rounded-full flex items-center justify-end pr-3 transition-all"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-xs font-semibold">
                              ₹{item.revenue.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-dark-muted text-center py-8">No revenue data available</p>
              )}
            </div>

            {/* Top Selling Companies */}
            <div className="glass-effect rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                <FiUsers className="text-accent-blue" />
                Top Selling Companies
              </h2>
              {analytics.top_companies && analytics.top_companies.length > 0 ? (
                <div className="space-y-3">
                  {analytics.top_companies.map((company, idx) => (
                    <div key={company.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-dark-text">{company.name}</h3>
                          <p className="text-sm text-dark-muted">{company.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent-orange text-lg">₹{company.revenue.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-dark-muted">Total Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-muted text-center py-8">No company data available</p>
              )}
            </div>

            {/* Category Analysis */}
            <div className="glass-effect rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                <FiPieChart className="text-accent-green" />
                Category Performance
              </h2>
              {analytics.category_analysis && analytics.category_analysis.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.category_analysis.map((category, idx) => (
                    <div key={category.id || idx} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-dark-text mb-2">{category.name}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-dark-muted">Orders: {category.orders}</span>
                        <span className="text-sm font-bold text-accent-orange">₹{category.revenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-dark-bg rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-accent-green to-accent-blue h-2 rounded-full"
                          style={{ width: `${(category.revenue / Math.max(...analytics.category_analysis.map(c => c.revenue))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-muted text-center py-8">No category data available</p>
              )}
            </div>

            {/* Revenue Forecast */}
            {analytics.forecast && analytics.forecast.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiTrendingUp className="text-yellow-500" />
                  Revenue Forecast (Next 3 Months)
                </h2>
                <div className="space-y-4">
                  {analytics.forecast.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24 text-sm text-dark-muted font-medium">{item.month}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-dark-text font-semibold">Forecasted Revenue</span>
                          <span className="text-accent-orange font-bold">₹{item.forecasted_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="w-full bg-dark-bg rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                            style={{ width: `${((idx + 1) / analytics.forecast.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders by Status */}
            {analytics.orders_by_status && Object.keys(analytics.orders_by_status).length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiBarChart2 className="text-accent-purple" />
                  Orders by Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(analytics.orders_by_status).map(([status, count]) => (
                    <div key={status} className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-3xl font-bold text-dark-text mb-2">{count}</p>
                      <p className="text-sm text-dark-muted capitalize">{status} Orders</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Pending Company Verifications */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark-text">Pending Company Verifications</h2>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded">
              {Array.isArray(pendingCompanies) ? pendingCompanies.length : 0} Pending
            </span>
          </div>
          {!Array.isArray(pendingCompanies) || pendingCompanies.length === 0 ? (
            <p className="text-dark-muted text-center py-8">No pending company verifications</p>
          ) : (
            <div className="space-y-3">
              {pendingCompanies.map((company) => {
                if (!company || typeof company !== 'object') return null;
                return (
                  <div key={company?.id || Math.random()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-text mb-1">{company?.name || 'Unknown Company'}</h3>
                      <p className="text-sm text-dark-muted mb-2">{company?.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-dark-muted">
                        <span>📍 {company?.location || 'N/A'}</span>
                        {company?.website && <span>🌐 {company.website}</span>}
                        {company?.phone && <span>📞 {company.phone}</span>}
                      </div>
                      <p className="text-xs text-dark-muted mt-2">
                        Registered by: {company?.user_name || 'Unknown'} ({company?.user_email || 'N/A'})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => company?.id && handleVerifyCompany(company.id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm hover:opacity-90 transition-opacity"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Products */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark-text">Recent Products</h2>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm hover:opacity-90 transition-opacity">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {stats?.recentProducts && Array.isArray(stats.recentProducts) && stats.recentProducts.length > 0 ? (
              stats.recentProducts.map((product) => (
                <div key={product?.id || Math.random()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-dark-text">{product?.name || 'Unknown Product'}</h3>
                    <p className="text-sm text-dark-muted">{product?.company_name || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-accent-orange">₹{product?.price?.toLocaleString() || 'N/A'}</p>
                    <button className="text-xs text-accent-blue hover:text-accent-pink mt-1">Edit</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-dark-muted text-center py-8">No recent products</p>
            )}
          </div>
        </div>

        {/* Recent Suppliers */}
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark-text">Recent Suppliers</h2>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm hover:opacity-90 transition-opacity">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {stats?.suppliersList && Array.isArray(stats.suppliersList) && stats.suppliersList.length > 0 ? (
              stats.suppliersList.map((supplier) => (
                <div key={supplier?.id || Math.random()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                      <FiUsers className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-text">{supplier?.name || 'Unknown'}</h3>
                      <p className="text-sm text-dark-muted">{supplier?.location || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {supplier?.verified && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Verified</span>
                    )}
                    <button className="text-xs text-accent-blue hover:text-accent-pink">Manage</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-dark-muted text-center py-8">No suppliers found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;

