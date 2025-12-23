import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiMail, FiUser, FiArrowLeft, FiPhone, FiLock, FiShoppingCart, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    quantity: ''
  });
  const [inquirySent, setInquirySent] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [cartAddress, setCartAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${id}`);
        setProduct(res.data);
        
        // Get images
        if (res.data.images && res.data.images.length > 0) {
          setImages(res.data.images);
        } else if (res.data.image_url) {
          setImages([res.data.image_url]);
        }
        
        // Get reviews
        const reviewsRes = await axios.get(`/api/products/${id}/reviews`);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error('Error fetching product', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    checkUserSubscription();
    
    // Pre-fill user name if logged in
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setCartAddress(prev => ({ ...prev, name: userData.name || '' }));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [id]);

  const checkUserSubscription = async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        const response = await axios.get(`/api/subscriptions/check/${userData.id}`);
        setHasSubscription(response.data.has_subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
  };

  const handleViewPhone = async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }

    if (!hasSubscription) {
      setShowSubscriptionModal(true);
      return;
    }

    setCheckingSubscription(true);
    try {
      const userData = JSON.parse(user);
      const response = await axios.get(`/api/products/${id}/phone?user_id=${userData.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhoneNumber(response.data.phone);
    } catch (error) {
      if (error.response?.status === 403) {
        setShowSubscriptionModal(true);
      } else {
        alert('Failed to fetch phone number. Please try again.');
      }
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubscribe = async (planType = 'basic') => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      await axios.post('/api/subscriptions', {
        user_id: userData.id,
        plan_type: planType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasSubscription(true);
      setShowSubscriptionModal(false);
      alert('Subscription activated! You can now view phone numbers.');
      handleViewPhone();
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription. Please try again.');
    }
  };

  const handleSendInquiry = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/inquiries`,
        {
          product_id: id,
          ...inquiryData
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInquirySent(true);
      setShowInquiry(false);
      setTimeout(() => {
        setInquirySent(false);
        setInquiryData({ name: '', email: '', phone: '', message: '', quantity: '' });
      }, 5000);
    } catch (error) {
      console.error('Error sending inquiry:', error);
      alert('Failed to send inquiry. Please try again.');
    }
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/login');
      return;
    }
    setShowCartModal(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!product) return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);

    try {
      setOrderLoading(true);
      const response = await axios.post('/api/orders', {
        user_id: user.id,
        buyer_name: user.name,
        buyer_email: user.email,
        product_id: product.id,
        quantity: Number(cartQuantity) || 1,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Navigate to payment page with order data
      navigate('/payment', {
        state: {
          orderData: {
            ...response.data,
            shipping: { ...cartAddress },
          }
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.error || 'Failed to create order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted">Product not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-dark-muted hover:text-accent-purple mb-6 transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Products</span>
        </Link>

        <div className="glass-effect rounded-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                {images.length > 0 ? (
                  <>
                    <img 
                      src={images[selectedImageIndex]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        const encodedName = encodeURIComponent(product.name.substring(0, 30));
                        e.target.src = `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodedName}`;
                      }}
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                        >
                          <FiChevronLeft />
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                        >
                          <FiChevronRight />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FiPackage className="text-6xl" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === idx ? 'border-accent-purple' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6 animate-slide-right">
              <div>
                <h1 className="text-3xl font-bold mb-3 text-gray-800 animate-fade-in">{product.name}</h1>
                {/* Rating Display */}
                {reviews && reviews.average_rating > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`${i < Math.round(reviews.average_rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-700 font-semibold">{reviews.average_rating}</span>
                    <span className="text-gray-500 text-sm">({reviews.total_reviews} reviews)</span>
                  </div>
                )}
                <p className="text-3xl font-bold text-accent-orange mb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  ₹{product.price?.toLocaleString() || 'Price on Request'}
                </p>
                <p className="text-gray-600 font-semibold animate-fade-in" style={{ animationDelay: '0.2s' }}>{product.location}</p>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-dark-text font-medium leading-relaxed">{product.description}</p>
              </div>

              <div className="glass-effect rounded-lg p-4 space-y-2">
                <p className="text-sm text-dark-muted">
                  <span className="font-semibold text-dark-text">Category:</span> {product.category_name || 'N/A'}
                </p>
                <p className="text-sm text-dark-muted">
                  <span className="font-semibold text-dark-text">Supplier:</span> {product.company_name}
                </p>
                {product.company_description && (
                  <p className="text-sm text-dark-muted">
                    <span className="font-semibold text-dark-text">About Supplier:</span> {product.company_description}
                  </p>
                )}
                {phoneNumber && (
                  <p className="text-sm">
                    <span className="font-semibold text-dark-text">Phone:</span> 
                    <span className="text-accent-green ml-2 font-mono">{phoneNumber}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={handleBuyNow}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-orange to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <FiShoppingCart />
                  Buy Now
                </button>
                <button 
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    if (token) {
                      setShowInquiry(true);
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <FiMail />
                  Send Inquiry
                </button>
                <Link 
                  to={`/suppliers/${product.company_id}`}
                  className="px-6 py-3 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors flex items-center gap-2"
                >
                  <FiUser />
                  View Supplier
                </Link>
                <button
                  onClick={handleViewPhone}
                  disabled={checkingSubscription}
                  className="px-6 py-3 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {checkingSubscription ? (
                    <>Loading...</>
                  ) : phoneNumber ? (
                    <>
                      <FiPhone />
                      {phoneNumber}
                    </>
                  ) : (
                    <>
                      <FiPhone />
                      View Phone Number
                    </>
                  )}
                  {!hasSubscription && !phoneNumber && (
                    <FiLock className="text-xs" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showSubscriptionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect rounded-xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-4 text-dark-text">Subscription Required</h3>
              <p className="text-dark-muted mb-6">
                To view supplier phone numbers, you need an active subscription. Choose a plan below:
              </p>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleSubscribe('basic')}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Subscribe - Basic Plan (Free Trial)
                </button>
              </div>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="w-full px-6 py-3 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showInquiry && !inquirySent && (
          <div className="glass-effect rounded-xl p-8 mt-8">
            <h3 className="text-2xl font-bold mb-6 text-dark-text">Send Inquiry to Supplier</h3>
            <form onSubmit={handleSendInquiry} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-semibold text-dark-text">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryData.name}
                    onChange={(e) => setInquiryData({...inquiryData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text focus:border-accent-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-dark-text">Email *</label>
                  <input
                    type="email"
                    required
                    value={inquiryData.email}
                    onChange={(e) => setInquiryData({...inquiryData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text focus:border-accent-purple focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-semibold text-dark-text">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={inquiryData.phone}
                    onChange={(e) => setInquiryData({...inquiryData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text focus:border-accent-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-dark-text">Quantity Required</label>
                  <input
                    type="text"
                    value={inquiryData.quantity}
                    onChange={(e) => setInquiryData({...inquiryData, quantity: e.target.value})}
                    placeholder="e.g., 100 units"
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-dark-text">Message *</label>
                <textarea
                  required
                  value={inquiryData.message}
                  onChange={(e) => setInquiryData({...inquiryData, message: e.target.value})}
                  placeholder="Tell the supplier about your requirements..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Send Inquiry
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowInquiry(false)}
                  className="px-6 py-3 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {inquirySent && (
          <div className="glass-effect rounded-xl p-6 mt-8 bg-green-500/20 border border-green-500">
            <p className="text-green-400">Your inquiry has been sent successfully! The supplier will contact you soon.</p>
          </div>
        )}

        {showCartModal && product && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-effect rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4 text-dark-text flex items-center gap-2">
                <FiShoppingCart />
                Review & Buy Now
              </h3>

              <form onSubmit={handlePlaceOrder} className="space-y-5">
                <div className="glass-effect rounded-lg p-4">
                  <h4 className="font-semibold text-dark-text mb-1">{product.name}</h4>
                  <p className="text-sm text-dark-muted mb-2 line-clamp-2">{product.description}</p>
                  <p className="text-sm text-dark-muted mb-1">
                    Supplier: <span className="font-semibold">{product.company_name}</span>
                  </p>
                  <p className="text-sm text-dark-muted mb-1">
                    Location: <span className="font-semibold">{product.location}</span>
                  </p>
                  <p className="text-accent-orange font-bold text-lg">
                    Unit Price: ₹{product.price?.toLocaleString('en-IN') || 'Price on Request'}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-2 font-semibold text-dark-text">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={cartQuantity}
                      onChange={(e) => setCartQuantity(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text focus:border-accent-purple focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-dark-text">Estimated Total</label>
                    <div className="px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-accent-orange font-bold">
                      ₹{((product.price || 0) * (Number(cartQuantity) || 1)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-dark-text">Shipping Address</h4>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={cartAddress.name}
                    onChange={(e) => setCartAddress({ ...cartAddress, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                    required
                  />
                  <textarea
                    placeholder="Address"
                    value={cartAddress.address}
                    onChange={(e) => setCartAddress({ ...cartAddress, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                    rows={3}
                    required
                  />
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={cartAddress.city}
                      onChange={(e) => setCartAddress({ ...cartAddress, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={cartAddress.state}
                      onChange={(e) => setCartAddress({ ...cartAddress, state: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={cartAddress.pincode}
                      onChange={(e) => setCartAddress({ ...cartAddress, pincode: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={orderLoading}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {orderLoading ? 'Placing Order...' : 'Proceed to Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCartModal(false)}
                    className="px-6 py-3 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {reviews && (
          <div className="glass-effect rounded-xl p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Reviews</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`text-2xl ${i < Math.round(reviews.average_rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-700 font-bold text-xl">{reviews.average_rating}</span>
                  <span className="text-gray-500">({reviews.total_reviews} reviews)</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    setShowReviewForm(!showReviewForm);
                  } else {
                    navigate('/login');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Write a Review
              </button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="glass-effect rounded-lg p-6 mb-6 border-2 border-accent-purple/20">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Write Your Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setReviewData({ ...reviewData, rating })}
                          className={`p-2 rounded-lg ${
                            reviewData.rating >= rating
                              ? 'bg-yellow-400 text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <FiStar className="text-xl" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Review Title (optional)"
                    value={reviewData.title}
                    onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                  <textarea
                    placeholder="Write your review..."
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem('token');
                        const userStr = localStorage.getItem('user');
                        if (!token || !userStr) {
                          navigate('/login');
                          return;
                        }
                        try {
                          const user = JSON.parse(userStr);
                          await axios.post(`/api/products/${id}/reviews`, {
                            user_id: user.id,
                            rating: reviewData.rating,
                            title: reviewData.title,
                            comment: reviewData.comment
                          });
                          alert('Review submitted successfully!');
                          setShowReviewForm(false);
                          setReviewData({ rating: 5, title: '', comment: '' });
                          // Refresh reviews
                          const reviewsRes = await axios.get(`/api/products/${id}/reviews`);
                          setReviews(reviewsRes.data);
                        } catch (error) {
                          alert(error.response?.data?.error || 'Failed to submit review');
                        }
                      }}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewData({ rating: 5, title: '', comment: '' });
                      }}
                      className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.reviews.map((review) => (
                  <div key={review.id} className="glass-effect rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-bold">
                        {review.user_avatar ? (
                          <img src={review.user_avatar} alt={review.user_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span>{review.user_name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800">{review.user_name}</h4>
                            {review.is_verified_purchase && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Verified Purchase</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={`${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.title && (
                          <h5 className="font-semibold text-gray-800 mb-1">{review.title}</h5>
                        )}
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                        <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
