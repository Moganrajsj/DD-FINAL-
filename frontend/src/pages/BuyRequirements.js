import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiPlus, FiX } from 'react-icons/fi';

function BuyRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    quantity: '',
    location: '',
    budget: ''
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
      setFormData({ product_name: '', description: '', quantity: '', location: '', budget: '' });
      fetchRequirements();
      alert('Buy requirement posted successfully!');
    } catch (error) {
      console.error('Error posting requirement:', error);
      alert('Failed to post requirement');
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-dark-text animate-slide-down">Buy Requirements</h1>
            <p className="text-dark-muted font-semibold animate-slide-down" style={{ animationDelay: '0.1s' }}>Post your buying requirements and get quotes from verified suppliers</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {showForm ? (
              <>
                <FiX />
                Cancel
              </>
            ) : (
              <>
                <FiPlus />
                Post Buy Requirement
              </>
            )}
          </button>
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
                <label className="block mb-2 font-semibold text-dark-text">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your requirements in detail..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none resize-y"
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
                  <label className="block mb-2 font-semibold text-dark-text">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Mumbai, India"
                    className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-dark-text">Budget</label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  placeholder="e.g., ₹50,000 - ₹1,00,000"
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
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
                    {req.budget && (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-dark-text">Budget:</span> {req.budget}
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




