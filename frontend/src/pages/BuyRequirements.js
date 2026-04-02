import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiPlus, FiX, FiSearch, FiZap, FiLoader } from 'react-icons/fi';

function BuyRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    quantity: '',
    location: '',
    budget: '',
    email: ''
  });

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      const response = await axios.get('/api/buy-requirements');
      setRequirements(response.data);
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSearch = async (e) => {
    e.preventDefault();
    if (!productSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingProducts(true);
    try {
      const response = await axios.get('/api/products', {
        params: { search: productSearchQuery }
      });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setSearchingProducts(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.product_name) {
      alert('Please enter a product name first to generate a description');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await axios.post('/api/ai/generate-description', {
        prompt: formData.description || `I need ${formData.product_name} for business use.`,
        entity_type: 'requirement',
        additional_info: {
          name: formData.product_name
        }
      });
      
      if (response.data.description) {
        setFormData({
          ...formData,
          description: response.data.description
        });
      }
    } catch (error) {
      console.error('Error generating AI description:', error);
      alert('Failed to generate description. Please try again or write manually.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to post a buy requirement');
        return;
      }
      await axios.post('/api/buy-requirements', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      setFormData({ product_name: '', description: '', quantity: '', location: '', budget: '', email: '' });
      fetchRequirements();
      alert('Buy requirement posted successfully!');
    } catch (error) {
      console.error('Error posting requirement:', error);
      alert('Failed to post requirement');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* NEW Top Hero Banner - Designed by Stitch */}
      <section className="w-full h-[400px] md:h-[500px] relative overflow-hidden bg-[#0e0e13] flex items-center justify-center mb-10 shadow-2xl border-b border-white/5">
        {/* Background Visuals */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e13] via-[#0e0e13]/80 to-transparent z-10"></div>
          <img 
            className="w-full h-full object-cover opacity-60" 
            alt="Digital Procurement Network" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlruGjZIBzTn_WNff4q4NGPwsyRIXnnsDii_C_lUA4z7lFJOYrJgaaGIsTzl9g1prjABPGFFKJXRmq_GWt9SvfPlDmNnEDAdNoeflbp5-RD0dAXMEMpLKPXzwEJzigpHobPbuNzK5IL6cu6-PkMJe0-LqxenypySIt9-Lmlf3bhW-QXQDtj0OouM_1UuJ89nU0ATXf1IIVAHwb4QwV167uHinhM-HawavwY4_QlwVmbXxaiPNdnuIxQxWjTFgDwZYodOTlBj9CTeA"
          />
          {/* Animated-like Data Overlay (CSS pattern) */}
          <div className="absolute inset-0 opacity-10 z-10" style={{ backgroundImage: 'radial-gradient(#ff9159 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>
        
        {/* Content Container */}
        <div className="relative z-20 h-full w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff9159]/10 border border-[#ff9159]/20 w-fit mb-4 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#ff9159] animate-pulse"></span>
            <span className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-[#ff9159]">Priority Sourcing Active</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-4 animate-slide-up drop-shadow-2xl">
            <span className="block bg-gradient-to-br from-[#ff9159] to-[#ff6b98] bg-clip-text text-transparent" style={{ textShadow: '0 0 20px rgba(255, 145, 89, 0.3)' }}>B2B Procurement</span>
            <span className="block text-[#f8f5fd]">Made Easy</span>
          </h1>
          
          <p className="text-[#acaab1] text-lg md:text-xl max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Navigate the complex global marketplace with our AI-driven requirement engine. Match with certified suppliers in real-time.
          </p>
        </div>
      </section>

      {/* Existing Buy Requirements Promotional Hero Section */}
      <div className="relative bg-dark-bg overflow-hidden border-b border-dark-border mb-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-orange/90 to-accent-pink/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 animate-slide-up flex items-center justify-center gap-4">
              <FiPackage className="text-yellow-400" />
              Source Exactly What You Need
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium animate-slide-up mb-10" style={{ animationDelay: '0.1s' }}>
              Can't find exactly what you're looking for? Post your buying requirement and let verified suppliers come to you with customized quotes.
            </p>

            {/* Primary CTA Button inside Hero */}
            <div className="animate-slide-up flex justify-center" style={{ animationDelay: '0.2s' }}>
              <button 
                onClick={() => setShowForm(!showForm)} 
                className={`px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-3 text-lg shadow-2xl hover:scale-105 ${
                  showForm 
                  ? 'bg-white text-accent-orange hover:bg-gray-100' 
                  : 'bg-gradient-to-r from-yellow-400 to-accent-orange text-dark-bg hover:shadow-yellow-500/20'
                }`}
              >
                {showForm ? (
                  <>
                    <FiX size={24} />
                    Cancel Posting Requirement
                  </>
                ) : (
                  <>
                    <FiPlus size={24} />
                    Post Buy Requirement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Content Header */}
        <div className="mb-8 animate-fade-in">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 text-dark-text animate-slide-down">Buy Requirements</h1>
            <p className="text-dark-muted font-semibold animate-slide-down" style={{ animationDelay: '0.1s' }}>Post your buying requirements and get quotes from verified suppliers</p>
          </div>
        </div>

        {/* Product Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleProductSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full px-4 py-4 pl-12 pr-32 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none text-lg"
              />
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-muted text-xl" />
              <button
                type="submit"
                disabled={searchingProducts}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {searchingProducts ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 glass-effect rounded-xl p-4">
              <h3 className="font-semibold text-dark-text mb-3">Search Results ({searchResults.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="glass-effect rounded-lg p-4 hover:shadow-lg transition-shadow border border-gray-200"
                  >
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <h4 className="font-semibold text-dark-text mb-2">{product.name}</h4>
                    <p className="text-sm text-dark-muted mb-2 line-clamp-2">{product.description}</p>
                    {product.price && (
                      <p className="text-accent-orange font-bold">₹{product.price.toLocaleString('en-IN')}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {productSearchQuery && searchResults.length === 0 && !searchingProducts && (
            <div className="mt-4 text-center text-dark-muted py-4">
              No products found matching "{productSearchQuery}"
            </div>
          )}
        </div>

        {showForm && (
          <div className="glass-effect rounded-xl p-8 mb-8 animate-scale-in hover-lift">
            <h3 className="text-2xl font-bold mb-6 text-dark-text flex items-center gap-2">
              <FiPackage />
              Post Your Buy Requirement
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 font-semibold text-dark-text">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  placeholder="What are you looking to buy?"
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-dark-text">Description *</label>
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={generatingAI || !formData.product_name}
                    className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20 hover:bg-accent-purple hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {generatingAI ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiZap className="group-hover:animate-pulse" />
                        Magic AI Generate
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your requirements in detail..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none resize-y"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-dark-text">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email for contact"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-accent-blue focus:border-transparent outline-none transition-all bg-white/50"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 font-semibold text-dark-text">Quantity</label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="e.g., 100 units"
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-dark-text">Customer Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City, State, Country (e.g., Mumbai, Maharashtra, India)"
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                  />
                  <p className="text-xs text-dark-muted mt-1">We’ll use this to match you with nearby suppliers.</p>
                </div>
              </div>
              <button 
                type="submit" 
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Post Requirement
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-dark-muted">
            <div className="animate-pulse">Loading requirements...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {requirements.length === 0 ? (
              <div className="glass-effect rounded-xl p-12 text-center animate-fade-in">
                <FiPackage className="mx-auto text-6xl text-dark-muted mb-4" />
                <p className="text-dark-muted text-lg font-semibold">No buy requirements posted yet. Be the first to post one!</p>
              </div>
            ) : (
              requirements.map((req, idx) => (
                <div key={req.id} className="glass-effect rounded-xl p-6 hover-lift transition-all border border-gray-200 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <h3 className="text-xl font-bold text-dark-text mb-3">{req.product_name}</h3>
                  <p className="text-dark-muted mb-4 leading-relaxed font-medium">{req.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-dark-muted">
                    {req.quantity && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-dark-text">Quantity:</span> {req.quantity}
                      </span>
                    )}
                    {req.location && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-dark-text">Location:</span> {req.location}
                      </span>
                    )}
                    <span className="ml-auto text-dark-muted">
                      Posted: {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyRequirements;




