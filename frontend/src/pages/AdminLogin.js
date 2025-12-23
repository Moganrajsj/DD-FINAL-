import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiShield, FiArrowLeft } from 'react-icons/fi';

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('admin_access', 'true'); // Mark as admin access
      // Redirect to admin portal
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass-effect rounded-xl p-8 max-w-md w-full border border-dark-border">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center mx-auto mb-4">
            <FiShield size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">Admin Portal</h2>
          <p className="text-dark-muted">Access the admin dashboard</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-semibold text-dark-text">Admin Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none transition-colors"
                placeholder="Enter admin email"
              />
            </div>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-semibold text-dark-text">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none transition-colors"
                placeholder="Enter admin password"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiShield size={20} />
            {loading ? 'Accessing...' : 'Access Admin Portal'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-dark-muted hover:text-accent-blue transition-colors"
          >
            <FiArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;




