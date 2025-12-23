import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiSearch, FiFilter, FiPhone, FiLock, FiMail, FiUser, FiShoppingCart, FiDownload } from 'react-icons/fi';

function Products() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [phoneNumbers, setPhoneNumbers] = useState({}); // Store phone numbers by product ID
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingPhones, setCheckingPhones] = useState({}); // Track which products are loading phone
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState(null);
  const [inquiryData, setInquiryData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    quantity: ''
  });
  const [inquirySent, setInquirySent] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartProduct, setCartProduct] = useState(null);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [cartAddress, setCartAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [orderData, setOrderData] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    location: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    checkUserSubscription();
  }, [filters]);

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

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      if (filters.minRating) params.append('min_rating', filters.minRating);
      if (filters.location) params.append('location', filters.location);
      if (filters.sortBy) params.append('sort_by', filters.sortBy);
      if (filters.sortOrder) params.append('sort_order', filters.sortOrder);

      // Use advanced search endpoint if we have advanced filters
      const endpoint = (filters.minRating || filters.location || filters.sortBy) 
        ? '/api/products/search' 
        : '/api/products';
      
      const response = await axios.get(`${endpoint}?${params.toString()}`);
      setProducts(response.data.products || response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: ''
    });
    navigate('/products', { replace: true });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleProductSelect = (productId) => {
    navigate(`/products/${productId}`, { replace: true });
  };

  const handleBuyNow = (e, product) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);
    setCartProduct(product);
    setCartQuantity(1);
    setOrderData(null);
    setCartAddress(prev => ({
      ...prev,
      name: user.name || '',
    }));
    setShowCartModal(true);
  };

  const handleViewPhone = async (e, productId) => {
    e.stopPropagation(); // Prevent card click navigation
    
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

    setCheckingPhones(prev => ({ ...prev, [productId]: true }));
    try {
      const userData = JSON.parse(user);
      const response = await axios.get(`/api/products/${productId}/phone?user_id=${userData.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPhoneNumbers(prev => ({ ...prev, [productId]: response.data.phone }));
    } catch (error) {
      if (error.response?.status === 403) {
        setShowSubscriptionModal(true);
      } else {
        alert('Failed to fetch phone number. Please try again.');
      }
    } finally {
      setCheckingPhones(prev => ({ ...prev, [productId]: false }));
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
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription. Please try again.');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cartProduct) return;

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
        product_id: cartProduct.id,
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

  const downloadDocument = (type) => {
    if (!orderData || !cartProduct) return;

    const isQuotation = type === 'quotation';
    const title = isQuotation ? 'Instant Quotation' : 'Order Invoice';

    const lines = [
      `DealsDouble.ai - ${title}`,
      '====================================',
      '',
      `Order ID: ${orderData.id}`,
      `Order Date: ${orderData.created_at || ''}`,
      '',
      `Buyer Name: ${orderData.buyer_name}`,
      `Buyer Email: ${orderData.buyer_email}`,
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
      `Product: ${orderData.product_name || cartProduct.name}`,
      `Supplier: ${orderData.company_name || cartProduct.company_name || ''}`,
      `Quantity: ${orderData.quantity}`,
      `Unit Price: ₹${(orderData.unit_price || cartProduct.price || 0).toLocaleString('en-IN')}`,
      `Total Amount: ₹${(orderData.total_amount || 0).toLocaleString('en-IN')}`,
      '',
      `Status: ${orderData.status}`,
    );

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

  const handleSendInquiry = async (e, productId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setSelectedProductForInquiry(productId);
    setShowInquiryModal(true);
  };

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    if (!selectedProductForInquiry) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/inquiries`,
        {
          product_id: selectedProductForInquiry,
          ...inquiryData
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInquirySent(true);
      setShowInquiryModal(false);
      setTimeout(() => {
        setInquirySent(false);
        setInquiryData({ name: '', email: '', phone: '', message: '', quantity: '' });
        setSelectedProductForInquiry(null);
      }, 5000);
    } catch (error) {
      console.error('Error sending inquiry:', error);
      alert('Failed to send inquiry. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-dark-text animate-slide-down">Products</h1>
            <p className="text-dark-muted font-semibold animate-slide-down" style={{ animationDelay: '0.1s' }}>Find the products you need from verified suppliers</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-accent-purple text-white' : 'glass-effect border border-gray-200 text-dark-text'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-accent-purple text-white' : 'glass-effect border border-gray-200 text-dark-text'}`}
            >
              Grid
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="glass-effect rounded-xl p-6 sticky top-24 animate-slide-left">
              <div className="flex items-center gap-2 mb-6">
                <FiFilter className="text-accent-purple" />
                <h3 className="text-xl font-bold text-dark-text">Filters</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block mb-2 font-semibold text-dark-text text-sm">Search</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-dark-text text-sm">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-dark-card border border-gray-200 text-dark-text focus:border-accent-purple focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-dark-text text-sm">Price Range</label>
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none mb-2"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full px-4 py-2 rounded-lg glass-effect border border-gray-200 text-sm text-dark-text hover:border-accent-purple transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Products List/Grid */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20 text-dark-muted">
                <div className="animate-pulse">Loading products...</div>
              </div>
            ) : products.length === 0 ? (
              <div className="glass-effect rounded-xl p-12 text-center">
                <FiPackage className="mx-auto text-6xl text-dark-muted mb-4" />
                <p className="text-dark-muted text-lg mb-4">
                  No products found for your current search or filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Clear filters and view all products
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-dark-muted">
                  Showing {products.length} product{products.length !== 1 ? 's' : ''}
                </div>
                
                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {products.map((product, idx) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelect(product.id)}
                        className="glass-effect rounded-xl p-4 cursor-pointer hover-lift border border-gray-200 animate-fade-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-28 h-28 md:w-32 md:h-32 bg-dark-card rounded-lg overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  // Fallback to placeholder with product name
                                  const encodedName = encodeURIComponent(product.name.substring(0, 30));
                                  e.target.src = `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodedName}`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-dark-muted">
                                <FiPackage className="text-2xl" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-dark-text mb-1">{product.name}</h3>
                                <p className="text-sm font-medium text-dark-muted line-clamp-2 mb-2">{product.description}</p>
                                <div className="flex items-center gap-4 text-sm mb-2">
                                  <span className="text-accent-orange font-bold">
                                    ₹{product.price?.toLocaleString() || 'Price on Request'}
                                  </span>
                                  <span className="text-dark-muted">{product.company_name}</span>
                                  <span className="text-dark-muted">{product.location}</span>
                                </div>
                                {phoneNumbers[product.id] && (
                                  <div className="text-sm mb-2">
                                    <span className="text-dark-muted">Phone: </span>
                                    <span className="text-accent-green font-mono font-semibold">{phoneNumbers[product.id]}</span>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <button
                                    onClick={(e) => handleSendInquiry(e, product.id)}
                                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
                                  >
                                    <FiMail />
                                    Send Inquiry
                                  </button>
                                  <Link
                                    to={`/suppliers/${product.company_id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-4 py-1.5 rounded-lg glass-effect border border-gray-200 hover:border-accent-purple transition-colors flex items-center gap-2 text-sm"
                                  >
                                    <FiUser />
                                    View Supplier
                                  </Link>
                                  <button
                                    onClick={(e) => handleViewPhone(e, product.id)}
                                    disabled={checkingPhones[product.id]}
                                    className="px-4 py-1.5 rounded-lg glass-effect border border-gray-200 hover:border-accent-purple transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                                  >
                                    {checkingPhones[product.id] ? (
                                      <>Loading...</>
                                    ) : phoneNumbers[product.id] ? (
                                      <>
                                        <FiPhone />
                                        {phoneNumbers[product.id]}
                                      </>
                                    ) : (
                                      <>
                                        <FiPhone />
                                        View Phone
                                        {!hasSubscription && <FiLock className="text-xs" />}
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => handleBuyNow(e, product)}
                                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-accent-orange to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
                                  >
                                    <FiShoppingCart />
                                    Buy Now
                                  </button>
                                </div>
                              </div>
                              {product.featured && (
                                <span className="px-2 py-1 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-xs font-semibold rounded flex-shrink-0">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product, idx) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        className="glass-effect rounded-xl overflow-hidden hover-lift hover-glow transition-all group animate-scale-in"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="relative h-48 md:h-56 bg-dark-card overflow-hidden">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                // Fallback to placeholder with product name
                                const encodedName = encodeURIComponent(product.name.substring(0, 30));
                                e.target.src = `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodedName}`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-dark-muted">
                              <FiPackage className="text-4xl" />
                            </div>
                          )}
                          {product.featured && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-xs font-semibold rounded">
                              Featured
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-bold mb-2 text-dark-text line-clamp-2 group-hover:text-accent-purple transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm font-medium text-dark-muted mb-3 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xl font-bold text-accent-orange">
                                ₹{product.price?.toLocaleString() || 'Price on Request'}
                              </p>
                              <p className="text-xs text-dark-muted mt-1">{product.company_name}</p>
                            </div>
                          </div>
                          <p className="text-xs text-dark-muted mt-2">{product.location}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
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
              className="w-full px-6 py-3 rounded-lg glass-effect border border-gray-200 hover:border-accent-purple transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showInquiryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-effect rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-dark-text">Send Inquiry to Supplier</h3>
            <form onSubmit={handleSubmitInquiry} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-semibold text-dark-text">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryData.name}
                    onChange={(e) => setInquiryData({...inquiryData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text focus:border-accent-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-dark-text">Email *</label>
                  <input
                    type="email"
                    required
                    value={inquiryData.email}
                    onChange={(e) => setInquiryData({...inquiryData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text focus:border-accent-purple focus:outline-none"
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
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text focus:border-accent-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-dark-text">Quantity Required</label>
                  <input
                    type="text"
                    value={inquiryData.quantity}
                    onChange={(e) => setInquiryData({...inquiryData, quantity: e.target.value})}
                    placeholder="e.g., 100 units"
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
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
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
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
                  onClick={() => {
                    setShowInquiryModal(false);
                    setInquiryData({ name: '', email: '', phone: '', message: '', quantity: '' });
                    setSelectedProductForInquiry(null);
                  }}
                  className="px-6 py-3 rounded-lg glass-effect border border-gray-200 hover:border-accent-purple transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCartModal && cartProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-effect rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 text-dark-text flex items-center gap-2">
              <FiShoppingCart />
              {orderData ? 'Order Summary & Documents' : 'Review & Buy Now'}
            </h3>

            {!orderData ? (
              <form onSubmit={handlePlaceOrder} className="space-y-5">
                <div className="glass-effect rounded-lg p-4">
                  <h4 className="font-semibold text-dark-text mb-1">{cartProduct.name}</h4>
                  <p className="text-sm text-dark-muted mb-2 line-clamp-2">{cartProduct.description}</p>
                  <p className="text-sm text-dark-muted mb-1">
                    Supplier: <span className="font-semibold">{cartProduct.company_name}</span>
                  </p>
                  <p className="text-sm text-dark-muted mb-1">
                    Location: <span className="font-semibold">{cartProduct.location}</span>
                  </p>
                  <p className="text-accent-orange font-bold text-lg">
                    Unit Price: ₹{cartProduct.price?.toLocaleString('en-IN') || 'Price on Request'}
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
                      className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text focus:border-accent-purple focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold text-dark-text">Estimated Total</label>
                    <div className="px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-accent-orange font-bold">
                      ₹{((cartProduct.price || 0) * (Number(cartQuantity) || 1)).toLocaleString('en-IN')}
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
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                    required
                  />
                  <textarea
                    placeholder="Address"
                    value={cartAddress.address}
                    onChange={(e) => setCartAddress({ ...cartAddress, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                    rows={3}
                    required
                  />
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={cartAddress.city}
                      onChange={(e) => setCartAddress({ ...cartAddress, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={cartAddress.state}
                      onChange={(e) => setCartAddress({ ...cartAddress, state: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={cartAddress.pincode}
                      onChange={(e) => setCartAddress({ ...cartAddress, pincode: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
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
                    {orderLoading ? 'Placing Order...' : 'Generate Quotation & Place Order'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCartModal(false)}
                    className="px-6 py-3 rounded-lg glass-effect border border-gray-200 hover:border-accent-purple transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="glass-effect rounded-lg p-4">
                  <h4 className="font-semibold text-dark-text mb-2">Order Placed Successfully!</h4>
                  <p className="text-dark-muted text-sm mb-1">Order ID: {orderData.id}</p>
                  <p className="text-dark-muted text-sm mb-1">
                    Status: <span className="font-semibold capitalize">{orderData.status}</span>
                  </p>
                  <p className="text-dark-muted text-sm">
                    You can download an instant quotation or invoice summary for your records.
                  </p>
                </div>

                <div className="glass-effect rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-dark-text">Documents</h4>
                  <button
                    type="button"
                    onClick={() => downloadDocument('quotation')}
                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
                  >
                    <FiDownload />
                    Download Quotation
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDocument('invoice')}
                    className="w-full px-4 py-2 rounded-lg glass-effect border border-gray-200 hover:border-accent-purple transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiDownload />
                    Download Invoice / Bill
                  </button>
                </div>

                <p className="text-xs text-dark-muted">
                  To track your order status later, you can contact the supplier directly using the inquiry or phone
                  options, or share this Order ID with our support team.
                </p>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCartModal(false);
                      setOrderData(null);
                    }}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {inquirySent && (
        <div className="fixed top-4 right-4 glass-effect rounded-xl p-6 bg-green-500/20 border border-green-500 z-50">
          <p className="text-green-400">Your inquiry has been sent successfully! The supplier will contact you soon.</p>
        </div>
      )}
    </div>
  );
}

export default Products;
