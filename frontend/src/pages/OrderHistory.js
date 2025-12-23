import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiClock, FiCheck, FiX, FiTruck, FiSearch, FiFilter } from 'react-icons/fi';

function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchOrders(parsedUser.id);
  }, [navigate]);

  const fetchOrders = async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-500/20 text-green-600 border-green-500';
      case 'processing':
      case 'shipped':
        return 'bg-blue-500/20 text-blue-600 border-blue-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-600 border-red-500';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <FiCheck className="text-green-600" />;
      case 'processing':
      case 'shipped':
        return <FiTruck className="text-blue-600" />;
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'cancelled':
        return <FiX className="text-red-600" />;
      default:
        return <FiPackage />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      order.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 animate-pulse">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">Order History</h1>
          <p className="text-gray-600">View and track all your orders</p>
        </div>

        {/* Filters */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    filterStatus === status
                      ? 'bg-accent-purple text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="glass-effect rounded-xl p-12 text-center">
            <FiPackage className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="glass-effect rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FiPackage className="text-3xl text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{order.product_name}</h3>
                        <p className="text-gray-600 mb-2">Supplier: {order.company_name}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>Order ID: #{order.id}</span>
                          <span>Quantity: {order.quantity}</span>
                          <span className="text-accent-orange font-bold">
                            ₹{order.total_amount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {order.tracking_number && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">Tracking: </span>
                            <span className="font-semibold text-gray-800">{order.tracking_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Ordered on: {new Date(order.created_at).toLocaleDateString()}</span>
                      {order.updated_at && (
                        <span>Updated: {new Date(order.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold border flex items-center gap-2 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/orders/${order.id}/tracking`)}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <FiTruck />
                        Track Order
                      </button>
                      <button
                        onClick={() => navigate(`/products/${order.product_id}`)}
                        className="px-4 py-2 rounded-lg bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 transition-colors text-sm font-semibold"
                      >
                        View Product
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;

