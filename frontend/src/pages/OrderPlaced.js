import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FiCheck, FiDownload, FiShoppingBag, FiArrowLeft, FiTruck } from 'react-icons/fi';
import { generatePDF } from '../utils/pdfGenerator';

function OrderPlaced() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData, setOrderData] = useState(location.state?.orderData || null);

  useEffect(() => {
    // If no order data, redirect back
    if (!orderData) {
      navigate('/products');
    }
  }, [orderData, navigate]);

  const downloadDocument = async (type) => {
    if (!orderData) return;

    try {
      // Fetch full order details including company address
      const response = await axios.get(`/api/orders/${orderData.id}`);
      const fullOrderData = response.data;

      // Prepare data for PDF
      const pdfData = {
        ...orderData,
        ...fullOrderData,
        payment_method: 'cod',
        payment_status: 'pending',
        shipping: orderData.shipping
      };

      // Generate company address string
      const companyAddress = fullOrderData.company_location || 'Address not provided';

      // Generate PDF
      generatePDF(pdfData, type, companyAddress);
    } catch (error) {
      console.error('Error fetching order details:', error);
      // Fallback: generate PDF with available data
      const companyAddress = orderData.company_location || 'Address not provided';
      generatePDF(orderData, type, companyAddress);
    }
  };

  if (!orderData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 text-dark-muted hover:text-accent-purple mb-6 transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Products</span>
        </button>

        <div className="glass-effect rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="text-white text-4xl" />
            </div>
            <h2 className="text-3xl font-bold text-dark-text mb-2">Order Placed Successfully!</h2>
            <p className="text-dark-muted">Your order has been confirmed and is being processed</p>
          </div>
          
          <div className="glass-effect rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-dark-text mb-4 flex items-center gap-2">
              <FiShoppingBag />
              Order Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-muted">Order ID:</span>
                <span className="text-dark-text font-semibold">#{orderData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted">Product:</span>
                <span className="text-dark-text">{orderData.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted">Supplier:</span>
                <span className="text-dark-text">{orderData.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted">Quantity:</span>
                <span className="text-dark-text">{orderData.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted">Unit Price:</span>
                <span className="text-dark-text">₹{orderData.unit_price?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-dark-border">
                <span className="text-dark-muted font-semibold">Total Amount:</span>
                <span className="text-accent-orange font-bold text-lg">
                  ₹{orderData.total_amount?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-dark-muted">Payment Method:</span>
                <span className="text-dark-text font-semibold flex items-center gap-1">
                  <FiTruck />
                  Cash on Delivery (COD)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted">Payment Status:</span>
                <span className="text-yellow-500 font-semibold">
                  Pending - Payment on Delivery
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-muted">Order Status:</span>
                <span className="text-green-500 font-semibold capitalize">
                  {orderData.status || 'Placed'}
                </span>
              </div>
            </div>
          </div>

          {/* COD Information */}
          <div className="glass-effect rounded-lg p-4 mb-6 bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
              <FiTruck />
              Cash on Delivery Information
            </h4>
            <p className="text-sm text-dark-muted text-left">
              Your order has been placed successfully. Payment will be collected when your order is delivered. 
              Please keep exact change ready for the delivery person.
            </p>
          </div>

          {/* Download Invoice/Bill Section */}
          <div className="glass-effect rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-dark-text mb-4">Download Invoice / Bill</h3>
            <p className="text-sm text-dark-muted mb-4">
              Download your order invoice/bill for your records. You can use this document for your accounting and records.
            </p>
            <button
              onClick={() => downloadDocument('invoice')}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <FiDownload />
              Download Invoice / Bill
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/order-history')}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderPlaced;

