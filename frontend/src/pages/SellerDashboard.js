import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiMail, FiShoppingCart, FiEdit, FiCheck, FiX, FiClock, FiDollarSign } from 'react-icons/fi';

function SellerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' or 'orders'

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (!parsedUser.has_company) {
      navigate('/register-company');
      return;
    }

    if (!parsedUser.company_verified) {
      navigate('/post-product');
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const currentUser = user || JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.id) {
        setLoading(false);
        return;
      }

      const [inquiriesRes, ordersRes] = await Promise.all([
        axios.get(`/api/seller/inquiries?user_id=${currentUser.id}`),
        axios.get(`/api/seller/orders?user_id=${currentUser.id}`)
      ]);
      
      setInquiries(Array.isArray(inquiriesRes.data) ? inquiriesRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (error) {
      console.error('Error fetching seller data:', error);
      setInquiries([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/seller/orders/${orderId}/status`, { status: newStatus });
      alert('Order status updated successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-50 text-dark-muted border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted animate-pulse">Loading seller dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-dark-text">Seller Dashboard</h1>
          <p className="text-dark-muted">Manage your products, inquiries, and orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                <FiMail className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{inquiries.length}</h3>
            <p className="text-dark-muted">Total Inquiries</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center">
                <FiShoppingCart className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{orders.length}</h3>
            <p className="text-dark-muted">Total Orders</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center">
                <FiDollarSign className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">
              ₹{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-dark-muted">Total Revenue</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'inquiries'
                  ? 'text-accent-purple border-b-2 border-accent-purple'
                  : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiMail className="inline mr-2" />
              Inquiries ({inquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'orders'
                  ? 'text-accent-purple border-b-2 border-accent-purple'
                  : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiShoppingCart className="inline mr-2" />
              Orders ({orders.length})
            </button>
          </div>

          {/* Inquiries Tab */}
          {activeTab === 'inquiries' && (
            <div className="space-y-4">
              {inquiries.length === 0 ? (
                <p className="text-dark-muted text-center py-8">No inquiries yet</p>
              ) : (
                inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="glass-effect rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-dark-text mb-1">{inquiry.product_name}</h3>
                        <p className="text-sm text-dark-muted mb-2">{inquiry.message}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-dark-muted">
                          <span><strong>Buyer:</strong> {inquiry.buyer_name}</span>
                          <span><strong>Email:</strong> {inquiry.buyer_email}</span>
                          <span><strong>Phone:</strong> {inquiry.buyer_phone}</span>
                          {inquiry.quantity && <span><strong>Quantity:</strong> {inquiry.quantity}</span>}
                        </div>
                      </div>
                      <div className="text-right text-xs text-dark-muted">
                        {inquiry.created_at && new Date(inquiry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-dark-muted text-center py-8">No orders yet</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="glass-effect rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-dark-text mb-1">{order.product_name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-dark-muted mb-2">
                          <span><strong>Buyer:</strong> {order.buyer_name}</span>
                          <span><strong>Email:</strong> {order.buyer_email}</span>
                          <span><strong>Quantity:</strong> {order.quantity}</span>
                          <span><strong>Unit Price:</strong> ₹{order.unit_price?.toLocaleString('en-IN')}</span>
                          <span className="text-accent-orange font-bold">
                            <strong>Total:</strong> ₹{order.total_amount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <span className="text-xs text-dark-muted">
                            {order.created_at && new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500 hover:bg-green-500/30 transition-colors flex items-center gap-2 text-sm"
                            >
                              <FiCheck size={16} />
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500 hover:bg-red-500/30 transition-colors flex items-center gap-2 text-sm"
                            >
                              <FiX size={16} />
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'completed' && (
                          <span className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500 text-sm text-center">
                            Completed
                          </span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500 text-sm text-center">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Post Product Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/post-product')}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
          >
            <FiPackage />
            Post New Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;

