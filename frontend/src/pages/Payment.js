import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FiCreditCard, FiLock, FiCheck, FiArrowLeft, FiShoppingBag, FiDownload, FiTruck } from 'react-icons/fi';

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData, setOrderData] = useState(location.state?.orderData || null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [savedPaymentMethod, setSavedPaymentMethod] = useState(null);

  useEffect(() => {
    // If no order data, redirect back
    if (!orderData) {
      navigate('/products');
    }
  }, [orderData, navigate]);

  const handleCardInput = (e, field) => {
    let value = e.target.value;
    
    if (field === 'cardNumber') {
      // Format card number with spaces
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (value.length <= 19) { // 16 digits + 3 spaces
        setCardData({ ...cardData, cardNumber: value });
      }
    } else if (field === 'expiryDate') {
      // Format expiry date as MM/YY
      value = value.replace(/\D/g, '');
      if (value.length <= 4) {
        if (value.length >= 2) {
          value = value.substring(0, 2) + '/' + value.substring(2);
        }
        setCardData({ ...cardData, expiryDate: value });
      }
    } else if (field === 'cvv') {
      // CVV should be 3-4 digits
      value = value.replace(/\D/g, '');
      if (value.length <= 4) {
        setCardData({ ...cardData, cvv: value });
      }
    } else {
      setCardData({ ...cardData, [field]: value });
    }
  };

  const validateCard = () => {
    const cardNumber = cardData.cardNumber.replace(/\s/g, '');
    if (cardNumber.length !== 16) {
      alert('Please enter a valid 16-digit card number');
      return false;
    }
    if (!cardData.cardName.trim()) {
      alert('Please enter cardholder name');
      return false;
    }
    if (cardData.expiryDate.length !== 5) {
      alert('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (cardData.cvv.length < 3) {
      alert('Please enter a valid CVV');
      return false;
    }
    return true;
  };

  const downloadDocument = (type) => {
    if (!orderData) return;

    const isQuotation = type === 'quotation';
    const title = isQuotation ? 'Instant Quotation' : 'Order Invoice';

    const lines = [
      `DealsDouble.ai - ${title}`,
      '====================================',
      '',
      `Order ID: ${orderData.id}`,
      `Order Date: ${orderData.created_at || new Date().toISOString().split('T')[0]}`,
      '',
      `Buyer Name: ${orderData.buyer_name || ''}`,
      `Buyer Email: ${orderData.buyer_email || ''}`,
    ];

    if (orderData.shipping) {
      lines.push(
        '',
        'Shipping Address:',
        `${orderData.shipping.name || ''}`,
        `${orderData.shipping.address || ''}`,
        `${orderData.shipping.city || ''} ${orderData.shipping.state || ''} ${orderData.shipping.pincode || ''}`
      );
    }

    lines.push(
      '',
      'Product Details:',
      `Product: ${orderData.product_name || ''}`,
      `Supplier: ${orderData.company_name || ''}`,
      `Quantity: ${orderData.quantity}`,
      `Unit Price: ₹${(orderData.unit_price || 0).toLocaleString('en-IN')}`,
      `Total Amount: ₹${(orderData.total_amount || 0).toLocaleString('en-IN')}`,
      '',
      `Status: ${orderData.status || (isQuotation ? 'Pending Payment' : 'Completed')}`,
    );

    if (!isQuotation) {
      const method = savedPaymentMethod || paymentMethod || 'card';
      const methodName = method === 'card' ? 'Credit/Debit Card' : method === 'upi' ? 'UPI' : 'Cash on Delivery';
      const paymentStatus = method === 'cod' ? 'Pending (COD)' : 'Completed';
      lines.push(
        '',
        'Payment Details:',
        `Payment Method: ${methodName}`,
        `Payment Status: ${paymentStatus}`,
        `Payment Date: ${new Date().toISOString().split('T')[0]}`,
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isQuotation ? 'quotation' : 'invoice'}-${orderData.id || 'order'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (paymentMethod === 'card' && !validateCard()) {
      return;
    }

    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !orderData || !userStr) {
        alert('Please login to continue');
        navigate('/login');
        return;
      }

      // Handle Cash on Delivery
      if (paymentMethod === 'cod') {
        try {
          // Update order status for COD
          const updateResponse = await axios.put(`/api/orders/${orderData.id}`, {
            payment_method: 'cod',
            payment_status: 'pending',
            status: 'pending'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          setSavedPaymentMethod('cod');
          setOrderData(prev => ({ 
            ...prev, 
            status: 'pending',
            payment_status: 'pending',
            payment_method: 'cod'
          }));
          setPaymentSuccess(true);
          setProcessing(false);
          return;
        } catch (error) {
          console.error('COD order update error:', error);
          alert(error.response?.data?.error || 'Failed to place COD order. Please try again.');
          setProcessing(false);
          return;
        }
      }

      // Create Razorpay order for card/UPI
      const response = await axios.post('/api/payments/create-order', {
        amount: orderData.total_amount,
        currency: 'INR',
        order_id: orderData.id
      });

      if (!response.data.razorpay_order_id) {
        throw new Error('Failed to create payment order');
      }

      const options = {
        key: response.data.key_id,
        amount: response.data.amount,
        currency: response.data.currency,
        name: 'DealsDouble.AI',
        description: `Order #${orderData.id}`,
        order_id: response.data.razorpay_order_id,
        handler: async function (response) {
          // Verify payment
          try {
            const verifyResponse = await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderData.id
            });

            if (verifyResponse.data.message === 'Payment verified successfully') {
              setSavedPaymentMethod(paymentMethod);
              setOrderData(prev => ({ 
                ...prev, 
                status: 'processing',
                payment_status: 'paid',
                payment_method: paymentMethod
              }));
              setPaymentSuccess(true);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: orderData.buyer_name || '',
          email: orderData.buyer_email || '',
        },
        theme: {
          color: '#8B5CF6'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.error || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (!orderData) {
    return null;
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-effect rounded-xl p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="text-white text-4xl" />
              </div>
              <h2 className="text-3xl font-bold text-dark-text mb-2">Payment Successful!</h2>
              <p className="text-dark-muted">Your order has been confirmed</p>
            </div>
            
            <div className="glass-effect rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-dark-text mb-4">Order Details</h3>
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
                  <span className="text-dark-muted">Quantity:</span>
                  <span className="text-dark-text">{orderData.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Total Amount:</span>
                  <span className="text-accent-orange font-bold text-lg">
                    ₹{orderData.total_amount?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Payment Status:</span>
                  <span className={`font-semibold ${
                    orderData.payment_method === 'cod' 
                      ? 'text-yellow-500' 
                      : 'text-green-400'
                  }`}>
                    {orderData.payment_method === 'cod' ? 'Pending (COD)' : 'Completed'}
                  </span>
                </div>
                {orderData.payment_method === 'cod' && (
                  <div className="flex justify-between mt-2">
                    <span className="text-dark-muted">Payment Method:</span>
                    <span className="text-dark-text font-semibold">Cash on Delivery</span>
                  </div>
                )}
              </div>
            </div>

            {/* Download Invoice Section */}
            <div className="glass-effect rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-dark-text mb-4">Download Invoice</h3>
              <p className="text-sm text-dark-muted mb-4">
                Your payment has been processed successfully. Download your invoice for your records.
              </p>
              <button
                onClick={() => downloadDocument('invoice')}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <FiDownload />
                Download Invoice
              </button>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
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

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-dark-muted hover:text-accent-purple mb-6 transition-colors"
        >
          <FiArrowLeft />
          <span>Back</span>
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="glass-effect rounded-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-dark-text mb-4 flex items-center gap-2">
                <FiShoppingBag />
                Order Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-dark-muted mb-1">Product</p>
                  <p className="text-dark-text font-semibold">{orderData.product_name}</p>
                </div>
                <div>
                  <p className="text-dark-muted mb-1">Supplier</p>
                  <p className="text-dark-text">{orderData.company_name}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Quantity:</span>
                  <span className="text-dark-text font-semibold">{orderData.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Unit Price:</span>
                  <span className="text-dark-text">₹{orderData.unit_price?.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-3 border-t border-dark-border">
                  <div className="flex justify-between items-center">
                    <span className="text-dark-muted">Total:</span>
                    <span className="text-accent-orange font-bold text-xl">
                      ₹{orderData.total_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Download Quotation Button */}
              <div className="mt-4 pt-4 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => downloadDocument('quotation')}
                  className="w-full px-4 py-2 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FiDownload />
                  Download Quotation
                </button>
                <p className="text-xs text-dark-muted text-center mt-2">
                  Download quotation before payment
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-2">
            <div className="glass-effect rounded-xl p-8">
              <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                <FiLock />
                Payment Details
              </h2>

              <form onSubmit={handlePayment} className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <label className="block mb-3 font-semibold text-dark-text">Payment Method</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === 'card'
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-dark-border glass-effect hover:border-accent-purple/50'
                      }`}
                    >
                      <FiCreditCard className="text-2xl mx-auto mb-2 text-dark-text" />
                      <span className="text-dark-text font-semibold">Credit/Debit Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-dark-border glass-effect hover:border-accent-purple/50'
                      }`}
                    >
                      <div className="text-2xl mx-auto mb-2">💳</div>
                      <span className="text-dark-text font-semibold">UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-accent-purple bg-accent-purple/10'
                          : 'border-dark-border glass-effect hover:border-accent-purple/50'
                      }`}
                    >
                      <FiTruck className="text-2xl mx-auto mb-2 text-dark-text" />
                      <span className="text-dark-text font-semibold">Cash on Delivery</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 font-semibold text-dark-text">Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.cardNumber}
                        onChange={(e) => handleCardInput(e, 'cardNumber')}
                        className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-dark-text">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardData.cardName}
                        onChange={(e) => handleCardInput(e, 'cardName')}
                        className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold text-dark-text">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardData.expiryDate}
                          onChange={(e) => handleCardInput(e, 'expiryDate')}
                          className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-dark-text">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={(e) => handleCardInput(e, 'cvv')}
                          className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 font-semibold text-dark-text">UPI ID</label>
                      <input
                        type="text"
                        placeholder="yourname@upi"
                        className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                        required
                      />
                    </div>
                    <div className="glass-effect rounded-lg p-4">
                      <p className="text-sm text-dark-muted">
                        You will be redirected to your UPI app to complete the payment.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="space-y-4">
                    <div className="glass-effect rounded-lg p-4 bg-blue-50 border border-blue-200">
                      <p className="text-sm text-dark-text font-semibold mb-2">Cash on Delivery</p>
                      <p className="text-sm text-dark-muted">
                        Pay cash when your order is delivered. No online payment required.
                      </p>
                    </div>
                    <div className="glass-effect rounded-lg p-4">
                      <p className="text-sm text-dark-muted">
                        <strong>Note:</strong> Please keep exact change ready for the delivery person. 
                        Your order will be processed and shipped after confirmation.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-dark-border">
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {paymentMethod === 'cod' ? 'Placing Order...' : 'Processing Payment...'}
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'cod' ? (
                          <>
                            <FiTruck />
                            Place Order (Cash on Delivery)
                          </>
                        ) : (
                          <>
                            <FiLock />
                            Pay ₹{orderData.total_amount?.toLocaleString('en-IN')}
                          </>
                        )}
                      </>
                    )}
                  </button>
                  {paymentMethod !== 'cod' && (
                    <p className="text-xs text-dark-muted text-center mt-3">
                      Your payment information is secure and encrypted
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;

