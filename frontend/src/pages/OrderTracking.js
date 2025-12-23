import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiTruck, FiCheck, FiClock, FiX, FiArrowLeft } from 'react-icons/fi';

function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const [orderRes, trackingRes] = await Promise.all([
        axios.get(`/api/my-orders`).then(res => res.data.find(o => o.id === parseInt(id))),
        axios.get(`/api/orders/${id}/tracking`)
      ]);
      
      if (orderRes) {
        setOrder(orderRes);
      }
      setTracking(trackingRes.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 animate-pulse">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <button
            onClick={() => navigate('/order-history')}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/order-history')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-accent-purple mb-6 transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Orders</span>
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">Order Tracking</h1>
          <p className="text-gray-600">Order ID: #{order.id}</p>
        </div>

        {/* Order Summary */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Product</p>
              <p className="font-semibold text-gray-800">{order.product_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Supplier</p>
              <p className="font-semibold text-gray-800">{order.company_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-semibold text-gray-800">{order.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-semibold text-accent-orange">₹{order.total_amount?.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-semibold text-gray-800">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-2 w-fit ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
              </span>
            </div>
            {order.tracking_number && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Tracking Number</p>
                <p className="font-semibold text-gray-800 font-mono">{order.tracking_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Tracking History</h2>
          {tracking.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiPackage className="mx-auto text-4xl mb-2 text-gray-300" />
              <p>No tracking updates available</p>
            </div>
          ) : (
            <div className="relative">
              {tracking.map((item, index) => (
                <div key={item.id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      index === 0 ? 'bg-accent-purple border-accent-purple text-white' : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {getStatusIcon(item.status)}
                    </div>
                    {index < tracking.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-6 last:pb-0">
                    <div className={`px-4 py-3 rounded-lg border ${
                      index === 0 ? 'bg-accent-purple/10 border-accent-purple' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800">{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      {item.message && (
                        <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                      )}
                      {item.location && (
                        <p className="text-xs text-gray-500 mt-1">📍 {item.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderTracking;

