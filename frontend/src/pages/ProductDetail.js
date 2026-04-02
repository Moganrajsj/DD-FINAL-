import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiMail, FiUser, FiArrowLeft, FiPhone, FiLock, FiShoppingCart, FiStar, FiChevronLeft, FiChevronRight, FiHeart, FiLayers } from 'react-icons/fi';
import CurrencyConverter from '../components/CurrencyConverter';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  const formatPrice = (price) => {
    if (!price) return '₹0.00';
    return `₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

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
        
        // Check wishlist status
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
          try {
            const userData = JSON.parse(user);
            const wishlistRes = await axios.get(`/api/wishlist/check?user_id=${userData.id}&product_id=${id}`);
            setInWishlist(wishlistRes.data.in_wishlist);
          } catch (error) {
            console.error('Error checking wishlist:', error);
          }
        }
        
        // Get AI Matches
        setMatchesLoading(true);
        try {
          const matchesRes = await axios.get(`/api/ai/match-product/${id}`);
          setMatches(matchesRes.data);
        } catch (error) {
          console.error('Error fetching matches:', error);
        } finally {
          setMatchesLoading(false);
        }
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

  const handleAddToCompare = () => {
    if (!product) return;
    const currentList = JSON.parse(localStorage.getItem('compareList') || '[]');
    if (currentList.find(p => p.id === product.id)) {
      return;
    }
    if (currentList.length >= 4) {
      alert('You can compare up to 4 products at a time.');
      return;
    }
    
    const updated = [...currentList, {
      id: product.id,
      name: product.name,
      image_url: product.image_url,
      price: product.price,
      company_name: product.company_name,
      location: product.location,
      is_verified: product.verified,
      stock_quantity: product.stock_quantity
    }];
    
    localStorage.setItem('compareList', JSON.stringify(updated));
    window.dispatchEvent(new Event('compareUpdate'));
  };

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
      navigate('/subscription-plans');
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
        navigate('/subscription-plans');
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

  const handleToggleWishlist = async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }

    setWishlistLoading(true);
    try {
      const userData = JSON.parse(user);
      
      if (inWishlist) {
        await axios.delete(`/api/wishlist?user_id=${userData.id}&product_id=${id}`);
        setInWishlist(false);
      } else {
        await axios.post('/api/wishlist', {
          user_id: userData.id,
          product_id: id
        });
        setInWishlist(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setWishlistLoading(false);
    }
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
                        e.target.src = '/placeholder.png';
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {product.membership_tier && product.membership_tier !== 'FREE' && (
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                          product.membership_tier === 'PLATINUM' 
                            ? 'bg-slate-900 text-slate-100' 
                            : 'bg-yellow-500 text-white'
                        }`}>
                          {product.membership_tier} MEMBER
                        </span>
                      )}
                      {product.is_priority && (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-600 text-white">
                          PRIORITY
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 animate-fade-in">{product.name}</h1>
                  </div>
                  <button
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading}
                    className={`ml-4 p-3 rounded-lg transition-colors flex-shrink-0 ${
                      inWishlist
                        ? 'text-red-500 bg-red-50 hover:bg-red-100'
                        : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'
                    }`}
                    title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <FiHeart size={24} fill={inWishlist ? 'currentColor' : 'none'} />
                  </button>
                </div>
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
                <div className="mb-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  {product.price ? (
                    <CurrencyConverter amount={product.price} />
                  ) : (
                    <p className="text-3xl font-bold text-accent-orange">Price on Request</p>
                  )}
                </div>
                <p className="text-gray-600 font-semibold animate-fade-in" style={{ animationDelay: '0.2s' }}>{product.location}</p>
              </div>
              {/* Bulk Pricing Calculator */}
              {product.price && (
                <div className="glass-effect rounded-xl p-6 border-2 border-[#81ecff]/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-dark-text uppercase tracking-widest text-xs">Bulk Volume Calculator</h3>
                    <span className="bg-[#81ecff]/10 text-[#00d4ec] px-2 py-1 rounded text-[10px] font-bold">SAVINGS ACTIVE</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setCartQuantity(prev => Math.max(product.min_order_quantity || 1, prev - 1))}
                          className="w-10 h-10 rounded-full border-2 border-accent-purple/20 flex items-center justify-center hover:bg-accent-purple hover:text-white transition-all font-black text-xl shadow-sm focus:outline-none"
                        >
                          -
                        </button>
                        <div className="flex flex-col items-center">
                          <span className="text-dark-text font-black text-2xl min-w-[80px] text-center">{cartQuantity}</span>
                          <span className="text-[10px] text-dark-muted uppercase font-bold tracking-tighter">Units</span>
                        </div>
                        <button 
                          onClick={() => setCartQuantity(prev => Math.min(10000, prev + 1))}
                          className="w-10 h-10 rounded-full border-2 border-accent-purple/20 flex items-center justify-center hover:bg-accent-purple hover:text-white transition-all font-black text-xl shadow-sm focus:outline-none"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-accent-purple uppercase font-black tracking-widest mb-1">Bulk Step</p>
                        <div className="flex gap-2">
                          {[10, 50, 100].map(step => (
                            <button 
                              key={step}
                              onClick={() => setCartQuantity(prev => Math.min(10000, prev + step))}
                              className="px-2 py-1 bg-accent-purple/10 text-accent-purple text-[10px] font-black rounded hover:bg-accent-purple hover:text-white transition-all"
                            >
                              +{step}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <input 
                      type="range" 
                      min={product.min_order_quantity || 1} 
                      max={10000} 
                      step={1}
                      value={cartQuantity} 
                      onChange={(e) => setCartQuantity(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-purple mb-6"
                    />
                    
                    <div className="flex justify-between items-center pt-4 border-t border-dark-border/10 bg-accent-purple/[0.02] -mx-6 px-6 py-4 rounded-b-xl">
                      <div>
                        <p className="text-[10px] text-dark-muted uppercase font-black tracking-tighter">Estimated Total</p>
                        <p className="text-3xl font-black text-accent-purple">
                          {formatPrice(product.price * cartQuantity)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-green-600 uppercase font-black tracking-tighter">Volume Savings</p>
                        <p className="text-xl font-black text-green-600">
                          {cartQuantity > 1000 ? '15% OFF' : cartQuantity > 500 ? '10% OFF' : cartQuantity > 100 ? '5% OFF' : 'Standard Rate'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                <p className="text-dark-text font-medium leading-relaxed">{product.description}</p>
              </div>

              {product.ai_description && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-slate-800 font-bold mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    AI-POWERED ANALYSIS
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed italic">
                    "{product.ai_description}"
                  </p>
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <FiPackage size={48} />
                  </div>
                </div>
              )}

              <div className="glass-effect rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-dark-muted">
                    <span className="font-semibold text-dark-text">Category:</span> {product.category_name || 'N/A'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-green-600 uppercase">Supplier Online</span>
                  </div>
                </div>
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
                  onClick={handleAddToCompare}
                  className="px-6 py-3 rounded-lg glass-effect border border-gray-200 text-dark-text font-semibold hover:border-accent-purple transition-all flex items-center gap-2"
                >
                  <FiLayers />
                  Compare
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
                <button 
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    if (!token) {
                      navigate('/login');
                      return;
                    }
                    if (!hasSubscription) {
                      // Push to subscription as requested
                      navigate('/subscription-plans');
                    } else {
                      const message = encodeURIComponent(`Hi, I'm interested in ${product.name} from DealsDouble.ai. Please provide more details. URL: ${window.location.href}`);
                      window.open(`https://wa.me/${product.company_phone || '911234567890'}?text=${message}`, '_blank');
                    }
                  }}
                  className="px-6 py-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition-all flex items-center gap-2 shadow-lg shadow-green-200 relative overflow-hidden group"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.551 4.197 1.597 6.03l-1.697 6.195 6.338-1.662c1.776.969 3.791 1.482 5.811 1.484h.005c6.635 0 12.05-5.415 12.05-12.052 0-3.213-1.251-6.234-3.524-8.507z"/></svg>
                    WhatsApp
                  </div>
                  {!hasSubscription && (
                    <div className="absolute top-1 right-1 flex items-center justify-center bg-white/20 rounded-full p-0.5">
                      <FiLock className="text-white text-[10px]" />
                    </div>
                  )}
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

        {/* AI Recommendations Section */}
        {matches && matches.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <FiPackage />
                </div>
                Smart Sourcing Matches
              </h2>
              <span className="text-xs font-bold text-blue-500 tracking-widest uppercase bg-blue-50 px-3 py-1 rounded-full">
                AI MATCHED
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {matches.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/products/${item.id}`}
                  className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-xl hover:border-blue-200 transition-all group"
                >
                  <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3">
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      onError={(e) => { e.target.src = '/placeholder.png' }}
                    />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-blue-600 font-bold mb-1">
                    {item.price ? `₹${item.price.toLocaleString('en-IN')}` : 'Request Price'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 truncate">{item.location}</span>
                    {item.membership_tier !== 'FREE' && (
                      <span className="w-2 h-2 rounded-full bg-yellow-400" title={item.membership_tier}></span>
                    )}
                  </div>
                </Link>
              ))}
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
