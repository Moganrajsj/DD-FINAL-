import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddBusinessModal from '../components/AddBusinessModal';
import { FiPackage, FiUsers, FiFileText, FiAlertCircle } from 'react-icons/fi';

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // If user is admin, redirect to admin portal instead
    if (parsedUser.is_admin) {
      navigate('/admin');
      return;
    }

    // Redirect verified companies to the new premium Seller Dashboard
    if (parsedUser.has_company && parsedUser.company_verified) {
      navigate('/seller-dashboard');
      return;
    }

    // Show business modal if user doesn't have a company
    if (!parsedUser.has_company) {
      setShowBusinessModal(true);
    }

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Error loading dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted">No data available.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-2 text-dark-text">Supplier Dashboard</h1>
        <p className="text-dark-muted mb-8">Overview of your marketplace activity</p>

        {/* Company Verification Alert */}
        {user && user.has_company && !user.company_verified && (
          <div className="glass-effect rounded-xl p-6 mb-6 bg-yellow-500/20 border border-yellow-500">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-yellow-400 text-2xl" />
              <div>
                <h3 className="font-semibold text-dark-text mb-1">Company Pending Verification</h3>
                <p className="text-dark-muted text-sm">
                  Your company is registered and waiting for admin verification. Once verified, you'll be able to post products and start selling.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                <FiPackage className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{data.stats.products}</h3>
            <p className="text-dark-muted">Products</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center">
                <FiUsers className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{data.stats.suppliers}</h3>
            <p className="text-dark-muted">Suppliers</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center">
                <FiFileText className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{data.stats.categories}</h3>
            <p className="text-dark-muted">Categories</p>
          </div>
        </div>

        {/* Latest Products */}
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark-text">Latest Products</h2>
            {user && user.has_company && user.company_verified && (
              <button
                onClick={() => navigate('/post-product')}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm hover:opacity-90 transition-opacity"
              >
                Post Product
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.latest_products.map((p) => (
              <div key={p.id} className="glass-effect rounded-lg p-4 hover:glow-effect transition-all">
                <h4 className="font-semibold text-dark-text mb-2">{p.name}</h4>
                <p className="text-accent-orange font-bold mb-1">
                  ₹{p.price?.toLocaleString() || 'Price on Request'}
                </p>
                <p className="text-sm text-dark-muted">{p.company_name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Business Modal */}
      <AddBusinessModal isOpen={showBusinessModal} onClose={() => setShowBusinessModal(false)} />
    </div>
  );
}

export default Dashboard;
