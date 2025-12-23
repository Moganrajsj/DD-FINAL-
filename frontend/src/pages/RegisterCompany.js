import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiBriefcase, FiMapPin, FiGlobe, FiPhone, FiFileText } from 'react-icons/fi';

function RegisterCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    website: '',
    phone: '',
    gst_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await axios.post('/api/companies/register', {
        ...formData,
        user_id: user.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update user data with company info
      const updatedUser = { ...user, company_id: response.data.company_id, has_company: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-8">
        <div className="glass-effect rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-400 text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-dark-text mb-2">Company Registered!</h2>
          <p className="text-dark-muted mb-4">
            Your company has been registered successfully. Our admin team will verify your business and you'll be able to start selling soon.
          </p>
          <p className="text-sm text-dark-muted">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-dark-text">Register Your Company</h1>
          <p className="text-dark-muted">Add your business details to start selling on DealsDouble.ai</p>
        </div>

        <div className="glass-effect rounded-xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                <FiBriefcase className="text-accent-purple" />
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your company name"
                className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                <FiFileText className="text-accent-purple" />
                Description *
              </label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your business, products, and services..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                <FiMapPin className="text-accent-purple" />
                Location *
              </label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Mumbai, India"
                className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                  <FiGlobe className="text-accent-purple" />
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com"
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                  <FiPhone className="text-accent-purple" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-dark-text flex items-center gap-2">
                  <FiFileText className="text-accent-purple" />
                  GST Number *
                </label>
                <input
                  type="text"
                  name="gst_number"
                  required
                  value={formData.gst_number}
                  onChange={handleChange}
                  placeholder="Enter your GSTIN (e.g., 22AAAAA0000A1Z5)"
                  className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none uppercase tracking-wide"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Company'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterCompany;



