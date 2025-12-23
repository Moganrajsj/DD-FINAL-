import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiFileText, FiShield, FiTrendingUp, FiPackage } from 'react-icons/fi';

function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('All Locations');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ products: 0, suppliers: 0, categories: 0, users: 11507060 });
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchStats();
    fetchCountries();
  }, []);

  useEffect(() => {
    if (country) {
      fetchStates();
    } else {
      setStates([]);
      setState('');
      setDistrict('');
      setDistricts([]);
      setLocation('All Locations');
    }
  }, [country]);

  useEffect(() => {
    if (state) {
      fetchDistricts();
    } else {
      setDistricts([]);
    }
  }, [state]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats');
      setStats(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await axios.get('/api/locations/countries');
      const list = response.data || [];
      setCountries(list);
      if (!country && list.length > 0) {
        setCountry(list[0]);
        setLocation(list[0]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchStates = async () => {
    if (!country) return;
    try {
      const response = await axios.get(`/api/locations/states?country=${encodeURIComponent(country)}`);
      setStates(response.data);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await axios.get(
        `/api/locations/districts?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`
      );
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSuggestions([]);
    }
  };

  // Live suggestions while typing
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await axios.get(
          `/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`,
          { signal: controller.signal }
        );
        if (Array.isArray(response.data)) {
          setSuggestions(response.data);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          console.error('Error fetching product suggestions:', error);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSelectSuggestion = (productId) => {
    setSuggestions([]);
    navigate(`/products/${productId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Search Section */}
      <div className="glass-effect border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex gap-2 min-w-[220px] w-full md:w-auto">
              <select 
                className="px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-dark-text text-sm flex-1"
                value={country}
                onChange={(e) => {
                  const value = e.target.value;
                  setCountry(value);
                  setState('');
                  setDistrict('');
                  setLocation(value || 'All Locations');
                }}
              >
                <option value="">All Countries</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select 
                className="px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-dark-text text-sm flex-1"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setDistrict('');
                  setLocation(e.target.value ? `${e.target.value}, ${country || ''}` : (country || 'All Locations'));
                }}
                disabled={!country}
              >
                <option value="">{country ? 'All States' : 'Select a country first'}</option>
                {states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {state && (
                <select 
                  className="px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-dark-text text-sm flex-1"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setLocation(e.target.value ? `${e.target.value}, ${state}, ${country || ''}` : `${state}, ${country || ''}`);
                  }}
                >
                  <option value="">All Districts</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex-1 max-w-3xl w-full">
              <form onSubmit={handleSearch} className="flex items-center gap-0 w-full">
                <input
                  type="text"
                  placeholder="Search products, suppliers, buyers worldwide"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-l-lg bg-white border border-gray-200 border-r-0 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-r-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  <FiSearch size={20} />
                </button>
              </form>

              {searchQuery.trim() && suggestions.length > 0 && (
                <div className="mt-1 w-full rounded-lg bg-white border border-gray-200 shadow-lg max-h-80 overflow-y-auto animate-fade-in">
                  {isSearching && (
                    <div className="px-4 py-2 text-xs text-dark-muted border-b border-gray-200">
                      Searching...
                    </div>
                  )}
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(product.id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col gap-1"
                    >
                      <span className="text-sm font-semibold text-dark-text">
                        {product.name}
                      </span>
                      <span className="text-xs text-dark-muted line-clamp-1">
                        {product.company_name || 'Supplier'} • {product.location || 'Global'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Categories */}
          <aside className="lg:col-span-1">
            <div className="glass-effect rounded-xl p-6 sticky top-24 animate-fade-in">
              <h3 className="text-xl font-bold mb-4 text-dark-text">Top Categories</h3>
              <ul className="space-y-2">
                {categories.slice(0, 15).map((category, idx) => (
                  <li key={category.id} className="animate-slide-left" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <Link
                      to={`/products?category=${category.id}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all hover-lift text-dark-text font-medium"
                    >
                      <FiPackage className="text-accent-purple" />
                      <span className="text-sm font-semibold">{category.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/products"
                className="block mt-4 text-sm font-semibold text-accent-blue hover:text-accent-pink transition-colors hover-lift"
              >
                View all Categories →
              </Link>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Hero Banner */}
            <div className="glass-effect rounded-xl p-8 bg-gradient-to-r from-accent-purple/20 to-accent-blue/20 border border-accent-purple/30 animate-fade-in hover-lift">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up">
                  <span className="bg-gradient-to-r from-accent-purple via-accent-pink to-accent-pink bg-clip-text text-transparent">
                    Smart platforms for smarter businesses.
                  </span>
                </h1>
                <p className="text-xl font-semibold text-dark-muted animate-slide-up" style={{ animationDelay: '0.1s' }}>AI-Powered B2B Marketplace</p>
              </div>
            </div>

            {/* Promotional Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-effect rounded-xl p-6 bg-gradient-to-br from-accent-orange to-yellow-500 border border-accent-orange/30">
                <h3 className="text-xl font-bold mb-2 text-dark-bg">Looking for a Product?</h3>
                <p className="text-sm text-dark-bg/80 mb-4">Post your buying requirement and get quotes from verified suppliers</p>
                <Link
                  to="/buy-requirements"
                  className="block w-full px-4 py-2 rounded-lg bg-dark-bg text-accent-orange font-semibold hover:opacity-90 transition-opacity text-center"
                >
                  Post Buy Requirement
                </Link>
              </div>

              <div className="glass-effect rounded-xl p-6 bg-gradient-to-br from-red-500 to-pink-500 border border-red-500/30">
                <h3 className="text-xl font-bold mb-2 text-white">Want to grow your business 10X Faster?</h3>
                <p className="text-sm text-white/90 mb-4">Join thousands of sellers on DealsDouble.ai</p>
                <Link
                  to="/register"
                  className="block w-full px-4 py-2 rounded-lg bg-white text-red-500 font-semibold hover:opacity-90 transition-opacity text-center"
                >
                  Sell on DealsDouble.ai
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-effect rounded-xl p-6 hover-lift hover-glow animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center mb-4 hover-scale">
                  <FiSearch size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-dark-text">AI-Powered Search</h3>
                <p className="text-dark-muted font-medium">
                  Find exactly what you need with semantic search that understands technical specifications.
                </p>
              </div>

              <div className="glass-effect rounded-xl p-6 hover-lift hover-glow animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center mb-4 hover-scale">
                  <FiFileText size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-dark-text">Instant RFQs</h3>
                <p className="text-dark-muted font-medium">
                  Generate detailed Requests for Quotation in seconds and get quotes fast.
                </p>
              </div>

              <div className="glass-effect rounded-xl p-6 hover-lift hover-glow animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center mb-4 hover-scale">
                  <FiShield size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-dark-text">Verified Suppliers</h3>
                <p className="text-dark-muted font-medium">
                  Every seller is vetted with strict KYC and performance checks. Trade with confidence.
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="glass-effect rounded-xl p-6 bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20">
              <h3 className="text-2xl font-bold mb-6 text-dark-text text-center">Platform Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-purple mb-1">{stats.products?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600 font-semibold">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-pink mb-1">{stats.suppliers?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600 font-semibold">Suppliers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-blue mb-1">{stats.categories?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600 font-semibold">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-green mb-1">{stats.users?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600 font-semibold">Users</div>
                </div>
              </div>
            </div>

            {/* Trending Categories */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-6 text-dark-text">Trending Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.id}`}
                    className="glass-effect rounded-lg p-4 text-center hover:glow-effect transition-all"
                  >
                    <FiPackage className="mx-auto mb-2 text-accent-purple text-2xl" />
                    <div className="text-sm font-semibold text-dark-text">{category.name}</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* How It Works Section */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-6 text-dark-text text-center">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">1</div>
                  <h4 className="text-lg font-bold text-dark-text mb-2">Search & Discover</h4>
                  <p className="text-sm text-gray-600">Browse thousands of products from verified suppliers worldwide</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">2</div>
                  <h4 className="text-lg font-bold text-dark-text mb-2">Connect & Negotiate</h4>
                  <p className="text-sm text-gray-600">Chat directly with suppliers and get instant quotes</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">3</div>
                  <h4 className="text-lg font-bold text-dark-text mb-2">Order & Grow</h4>
                  <p className="text-sm text-gray-600">Place orders securely and track them in real-time</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Home;
