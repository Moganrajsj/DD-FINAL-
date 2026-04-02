import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiSearch, FiFilter, FiPhone, FiLock, FiMail, FiUser, FiLayers, FiShoppingCart, FiDownload, FiHeart, FiMapPin, FiShield, FiStar, FiDollarSign, FiTrendingUp, FiTrendingDown, FiCheckCircle } from 'react-icons/fi';
import { generatePDF } from '../utils/pdfGenerator';

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
    location: searchParams.get('location') || '',
    verifiedSupplier: '',
    bestSeller: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [aiSearchMode, setAiSearchMode] = useState(false);
  
  // Currency conversion state
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem('preferred_currency') || 'INR';
  });
  const [currencyRates, setCurrencyRates] = useState({});
  const [currencyLoading, setCurrencyLoading] = useState(false);
  
  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    checkUserSubscription();
    fetchWishlist();
    fetchCurrencyRates();
  }, [filters]);

  useEffect(() => {
    fetchCurrencyRates();
    localStorage.setItem('preferred_currency', selectedCurrency);
  }, [selectedCurrency]);

  const fetchWishlist = async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        const response = await axios.get(`/api/wishlist?user_id=${userData.id}`);
        setWishlist(response.data.map(item => item.id));
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      }
    }
  };

  const handleToggleWishlist = async (e, productId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }

    setWishlistLoading(prev => ({ ...prev, [productId]: true }));
    try {
      const userData = JSON.parse(user);
      const isInWishlist = wishlist.includes(productId);
      
      if (isInWishlist) {
        await axios.delete(`/api/wishlist?user_id=${userData.id}&product_id=${productId}`);
        setWishlist(prev => prev.filter(id => id !== productId));
      } else {
        await axios.post('/api/wishlist', {
          user_id: userData.id,
          product_id: productId
        });
        setWishlist(prev => [...prev, productId]);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
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

  const fetchCurrencyRates = async () => {
    if (selectedCurrency === 'INR') {
      setCurrencyRates({ INR: 1 });
      return;
    }
    
    setCurrencyLoading(true);
    try {
      const response = await axios.get('/api/currency/rates');
      setCurrencyRates(response.data.rates || {});
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      setCurrencyRates({ INR: 1 });
    } finally {
      setCurrencyLoading(false);
    }
  };

  const convertPrice = (priceInINR) => {
    if (!priceInINR || priceInINR === 0) return null;
    if (selectedCurrency === 'INR') return priceInINR;
    
    const targetRate = currencyRates[selectedCurrency];
    if (!targetRate) return priceInINR;
    
    // Convert from INR to target currency
    // Rates are relative to INR (base currency)
    const convertedPrice = priceInINR * targetRate;
    return convertedPrice;
  };

  const getCurrencySymbol = () => {
    const currency = currencies.find(c => c.code === selectedCurrency);
    return currency ? currency.symbol : '₹';
  };

  const formatPrice = (price) => {
    if (!price) return null;
    const converted = convertPrice(price);
    if (converted === null) return null;
    return `${getCurrencySymbol()}${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      if (filters.verifiedSupplier) params.append('verified_supplier', filters.verifiedSupplier);
      if (filters.bestSeller) params.append('best_seller', filters.bestSeller);
      if (filters.sortBy) params.append('sort_by', filters.sortBy);
      if (filters.sortOrder) params.append('sort_order', filters.sortOrder);

      // Use advanced search endpoint if we have advanced filters
      const endpoint = (filters.minRating || filters.location || filters.sortBy) 
        ? '/api/products/search' 
        : '/api/products';
      
      // Request all products (up to 1000) instead of the default 20
      params.append('per_page', '1000');
      
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

  const toggleProductSelection = (e, productId) => {
    e.stopPropagation();
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleProductSelect = (productId) => {
    navigate(`/products/${productId}`, { replace: true });
  };

  const handleAddToCompare = (e, product) => {
    e.stopPropagation();
    e.preventDefault();
    const currentList = JSON.parse(localStorage.getItem('compareList') || '[]');
    if (currentList.find(p => p.id === product.id)) {
      // Already in list, maybe remove it or just do nothing
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
      navigate('/subscription-plans');
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
        navigate('/subscription-plans');
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
        product_name: orderData.product_name || (cartProduct ? cartProduct.name : ''),
        company_name: fullOrderData.company_name || orderData.company_name || (cartProduct ? cartProduct.company_name : ''),
        shipping: orderData.shipping
      };

      // Generate company address string
      const companyAddress = fullOrderData.company_location || orderData.company_location || 'Address not provided';

      // Generate PDF
      generatePDF(pdfData, type, companyAddress);
    } catch (error) {
      console.error('Error fetching order details:', error);
      // Fallback: generate PDF with available data
      const pdfData = {
        ...orderData,
        product_name: orderData.product_name || (cartProduct ? cartProduct.name : ''),
        company_name: orderData.company_name || (cartProduct ? cartProduct.company_name : ''),
        shipping: orderData.shipping
      };
      const companyAddress = orderData.company_location || 'Address not provided';
      generatePDF(pdfData, type, companyAddress);
    }
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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Products Promotional Hero Banner - Designed by Stitch */}
      <section className="w-full h-[400px] md:h-[500px] relative overflow-hidden bg-[#060e20] flex items-center text-left mb-10 border-b border-white/5 shadow-2xl">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 bg-[#060e20]">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-SY5-Z8mY9HeqI2t0dQ2gqoVEvUyDyGWsVzvvofU5dNNljEUcPt0lJNeUSFlkcA95grLZ7PCL7Hy-sACy9yg2a5drFpfwYj_UiF_QJF8kXLHddBqc9vs-pidvbR9SSoXx3uAp2dnY1-qQR_nNfs0g-K40HgyO1VIAE0MjVITLfEnqbThN6bPIeHqoY7hlvawr5Zl40T8xuoP877G4ejTZ8Lwjrrh4yqU0RcFdQLYlmsnha6Ts_xcJHAUHLQeLkDA7_pmU8aZXqFk" 
            alt="Global Logistics Hub" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060e20] via-[#060e20]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#060e20] to-transparent opacity-60"></div>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col justify-center h-full px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-[#81ecff] animate-pulse shadow-[0_0_8px_#81ecff]"></div>
            <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-[#81ecff] font-bold">Active Operational Grid</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white mb-4 drop-shadow-2xl animate-slide-up">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#81ecff] to-[#00d4ec]" style={{ textShadow: '0 0 30px rgba(129, 236, 255, 0.4)' }}>
              Global Sourcing Hub
            </span>
          </h1>

          <p className="text-[#a3aac4] text-lg md:text-xl max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Orchestrate your supply chain with precision. High-density marketplace intelligence for the elite operator.
          </p>

          {/* Decorative Nexus Node (Stitch Design) */}
          <div className="absolute right-0 bottom-8 hidden lg:flex flex-col items-end opacity-40">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-widest text-[#a3aac4] uppercase">System Optimal</span>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#81ecff] to-transparent opacity-30"></div>
              <div className="w-3 h-3 rounded-full border border-[#81ecff]/50 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#81ecff]"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-6 flex justify-between items-end flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 text-dark-text animate-slide-down">Product Catalog</h1>
              <p className="text-dark-muted font-semibold animate-slide-down" style={{ animationDelay: '0.1s' }}>
                Discover high-quality products from verified global suppliers
              </p>
            </div>
            
            {/* Bulk Actions (Dynamic) */}
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-4 bg-[#060e20] text-white p-4 rounded-xl shadow-2xl animate-bounce-subtle border border-[#81ecff]/20">
                <div className="flex flex-col">
                  <span className="text-xs text-[#81ecff] font-bold uppercase tracking-widest">Bulk Sourcing</span>
                  <span className="text-lg font-bold">{selectedProducts.size} Items Selected</span>
                </div>
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="bg-gradient-to-r from-[#00d4ec] to-[#81ecff] text-[#060e20] px-6 py-2 rounded-lg font-extrabold hover:scale-105 transition-all text-sm uppercase tracking-tighter"
                >
                  Send Multi-Supplier RFQ
                </button>
                <button 
                  onClick={() => setSelectedProducts(new Set())}
                  className="text-white/60 hover:text-white text-xs border-b border-white/20"
                >
                  Reset
                </button>
              </div>
            )}

            {/* View Mode & Currency Selector */}
            <div className="flex gap-3 items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm">
                <FiDollarSign className="text-accent-purple" size={18} />
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="bg-transparent border-none text-dark-text font-semibold focus:outline-none cursor-pointer"
                  disabled={currencyLoading}
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md transition-all font-semibold ${viewMode === 'list' ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-md' : 'text-dark-muted hover:text-dark-text'}`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-md transition-all font-semibold ${viewMode === 'grid' ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-md' : 'text-dark-muted hover:text-dark-text'}`}
                >
                  Grid View
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar with AI Mode Toggle */}
          <div className="glass-effect rounded-xl p-4 animate-slide-down mb-8 flex flex-col md:flex-row gap-4 items-center" style={{ animationDelay: '0.2s' }}>
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
              <input
                type="text"
                placeholder={aiSearchMode ? "Describe what you need (e.g., eco-friendly packaging for export)..." : "Search products by name, description..."}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-lg bg-white border ${aiSearchMode ? 'border-accent-purple shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-dark-border'} text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none transition-all`}
              />
            </div>
            <button
              onClick={() => setAiSearchMode(!aiSearchMode)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${
                aiSearchMode 
                ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-lg scale-105' 
                : 'bg-white border border-gray-200 text-dark-text hover:border-accent-purple'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${aiSearchMode ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
              {aiSearchMode ? 'AI Smart Mode Active' : 'Enable AI Smart Search'}
            </button>
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

                <div>
                  <label className="block mb-2 font-semibold text-dark-text text-sm">Location</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" />
                    <input
                      type="text"
                      placeholder="Enter location..."
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-card border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-dark-text text-sm">Supplier Type</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.verifiedSupplier === 'true'}
                        onChange={(e) => handleFilterChange('verifiedSupplier', e.target.checked ? 'true' : '')}
                        className="w-4 h-4 text-accent-purple rounded focus:ring-accent-purple"
                      />
                      <FiShield className="text-green-500" size={16} />
                      <span className="text-sm text-dark-text">Verified Suppliers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.bestSeller === 'true'}
                        onChange={(e) => handleFilterChange('bestSeller', e.target.checked ? 'true' : '')}
                        className="w-4 h-4 text-accent-purple rounded focus:ring-accent-purple"
                      />
                      <FiStar className="text-yellow-500" size={16} />
                      <span className="text-sm text-dark-text">Best Sellers</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-dark-text text-sm">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-dark-card border border-gray-200 text-dark-text focus:border-accent-purple focus:outline-none mb-2"
                  >
                    <option value="created_at">Newest First</option>
                    <option value="price">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Rating: High to Low</option>
                  </select>
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
                          <div className="w-28 h-28 md:w-32 md:h-32 bg-dark-card rounded-lg overflow-hidden flex-shrink-0 relative group-hover:shadow-lg transition-all">
                            {/* Multi-select Checkbox overlay */}
                            <div 
                              onClick={(e) => toggleProductSelection(e, product.id)}
                              className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${
                                selectedProducts.has(product.id)
                                ? 'bg-accent-purple border-accent-purple scale-110 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                                : 'bg-black/20 border-white/40 hover:border-white'
                              }`}
                            >
                              {selectedProducts.has(product.id) && <FiCheckCircle className="text-white" size={14} />}
                            </div>

                            {/* Trust Badges Overlay */}
                            <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end z-10">
                              {product.verified && (
                                <div className="bg-white/90 backdrop-blur-sm text-accent-purple px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm border border-accent-purple/20 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">verified</span>
                                  Verified
                                </div>
                              )}
                              {product.membership_tier === 'PLATINUM' && (
                                <div className="bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[10px]">workspace_premium</span>
                                  Gold
                                </div>
                              )}
                            </div>

                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className={`w-full h-full object-cover transition-transform duration-500 ${selectedProducts.has(product.id) ? 'scale-110 opacity-70' : ''}`}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/placeholder.png';
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
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="text-lg font-bold text-dark-text flex-1">
                                      {product.name}
                                      {product.is_priority && (
                                        <span className="ml-2 inline-block w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" title="Priority AI Match"></span>
                                      )}
                                    </h3>
                                  <div className="flex items-center gap-2">
                                    {product.membership_tier && product.membership_tier !== 'FREE' && (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        product.membership_tier === 'PLATINUM' ? 'bg-slate-900 text-white' : 'bg-yellow-500 text-white'
                                      }`}>
                                        {product.membership_tier}
                                      </span>
                                    )}
                                    <button
                                      onClick={(e) => handleToggleWishlist(e, product.id)}
                                      disabled={wishlistLoading[product.id]}
                                      className={`ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                        wishlist.includes(product.id)
                                          ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                          : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'
                                      }`}
                                      title={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                    >
                                      <FiHeart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm font-medium text-dark-muted line-clamp-2 mb-2">{product.description}</p>
                                <div className="flex items-center gap-4 text-sm mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-accent-orange font-bold">
                                      {formatPrice(product.price) || 'Price on Request'}
                                    </span>
                                    {product.price_trend !== 0 && (
                                      <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${product.price_trend > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                        {product.price_trend > 0 ? <FiTrendingUp size={10} /> : <FiTrendingDown size={10} />}
                                        {Math.abs(product.price_trend)}%
                                      </div>
                                    )}
                                  </div>
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
                                    onClick={(e) => handleAddToCompare(e, product)}
                                    className="px-4 py-1.5 rounded-lg glass-effect border border-gray-200 hover:border-accent-purple transition-colors flex items-center gap-2 text-sm"
                                  >
                                    <FiLayers />
                                    Compare
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
                                e.target.src = '/placeholder.png';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-dark-muted">
                              <FiPackage className="text-4xl" />
                            </div>
                          )}
                          
                          {/* Premium Badges Overlay */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                            {product.verified && (
                              <div className="bg-white/90 backdrop-blur-sm text-accent-purple px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-lg border border-accent-purple/20 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                Verified
                              </div>
                            )}
                            {product.membership_tier === 'PLATINUM' && (
                              <div className="bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">workspace_premium</span>
                                Gold Supplier
                              </div>
                            )}
                          </div>

                          {product.featured && (
                             <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-[10px] font-black uppercase tracking-tighter rounded shadow-lg">
                              Featured
                            </div>
                          )}

                          {/* Compare Button Overlay (Grid) */}
                          <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => handleAddToCompare(e, product)}
                              className="p-2 rounded-lg bg-white/90 backdrop-blur-sm text-accent-purple border border-accent-purple/20 shadow-lg hover:bg-accent-purple hover:text-white transition-all"
                              title="Add to Compare"
                            >
                              <FiLayers size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-bold text-dark-text line-clamp-2 group-hover:text-accent-purple transition-colors flex-1">
                              {product.name}
                              {product.is_priority && (
                                <span className="ml-2 inline-block w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" title="Priority AI Match"></span>
                              )}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleToggleWishlist(e, product.id);
                              }}
                              disabled={wishlistLoading[product.id]}
                              className={`ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                wishlist.includes(product.id)
                                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'
                              }`}
                              title={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                              <FiHeart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          <p className="text-sm font-medium text-dark-muted mb-3 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {product.price ? (
                                <p className="text-xl font-bold text-accent-orange">
                                  {formatPrice(product.price) || 'Price on Request'}
                                </p>
                              ) : (
                                <p className="text-xl font-bold text-accent-orange">Price on Request</p>
                              )}
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
