import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass-effect rounded-xl p-8 max-w-md w-full border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-2">Register</h2>
          <p className="text-dark-muted">Start selling on DealsDouble.ai</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-semibold text-dark-text">Name</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none transition-colors"
                placeholder="Enter your name"
              />
            </div>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-semibold text-dark-text">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none transition-colors"
                placeholder="Enter your email"
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
                placeholder="Enter your password"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiUserPlus size={20} />
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-dark-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-blue hover:text-accent-pink transition-colors font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

