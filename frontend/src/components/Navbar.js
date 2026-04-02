import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiPackage, FiUsers, FiFileText, FiUser, FiLogOut, FiMenu, FiX, FiSettings, FiChevronDown, FiStar } from 'react-icons/fi';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const accountMenuRef = useRef(null);

  // Check login status on mount and when route changes
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, [location]); // Re-check when route changes

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    if (isProfileOpen || isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen, isAccountMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="glass-effect sticky top-0 z-50 border-b border-gray-200 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex flex-col">
            <div className="text-2xl" style={{ fontWeight: 900 }}>
              <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent" style={{ fontWeight: 900 }}>DealsDouble</span>
              <span className="bg-gradient-to-r from-accent-pink to-accent-pink bg-clip-text text-transparent" style={{ fontWeight: 900 }}>.AI</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">AI Powered B2B Marketplace</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Main Navigation Links */}
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                location.pathname === '/' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
            >
              <FiHome size={18} />
              <span>Home</span>
            </Link>
            <Link
              to="/products"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                location.pathname === '/products' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
            >
              <FiPackage size={18} />
              <span>Products</span>
            </Link>
            <Link
              to="/suppliers"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                location.pathname === '/suppliers' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
            >
              <FiUsers size={18} />
              <span>Suppliers</span>
            </Link>
            <Link
              to="/buy-requirements"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                location.pathname === '/buy-requirements' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
            >
              <FiFileText size={18} />
              <span>Buy Requirements</span>
            </Link>
            <Link
              to="/trade-leads"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                location.pathname === '/trade-leads' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
            >
              <FiFileText size={18} />
              <span>Trade Leads</span>
            </Link>
            <Link
              to="/subscription-plans"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                location.pathname === '/subscription-plans'
                  ? 'bg-accent-purple/20 text-accent-purple'
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
            >
              <FiStar size={18} />
              <span>Pricing</span>
            </Link>
            
            {/* Account Menu (for logged in users) */}
            {isLoggedIn && (
              <div className="relative ml-2" ref={accountMenuRef}>
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm ${
                    isAccountMenuOpen 
                      ? 'bg-accent-purple/20 text-accent-purple' 
                      : 'hover:bg-gray-50 text-dark-text'
                  }`}
                >
                  <FiUser size={18} />
                  <span>Account</span>
                  <FiChevronDown size={16} className={isAccountMenuOpen ? 'transform rotate-180' : ''} />
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 glass-effect rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm text-dark-text"
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      <FiUser size={16} />
                      <span>My Dashboard</span>
                    </Link>
                    {user && user.company_verified ? (
                      <Link
                        to="/seller-dashboard"
                        className="block px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm text-dark-text"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        <FiPackage size={16} />
                        <span>Seller Dashboard</span>
                      </Link>
                    ) : (
                      <Link
                        to="/post-product"
                        className="block px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm text-dark-text"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        <FiPackage size={16} />
                        <span>Post Product</span>
                      </Link>
                    )}
                    <div className="border-t border-dark-border my-1"></div>
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm text-red-400"
                    >
                      <FiLogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-dark-text text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden lg:inline max-w-[120px] truncate">{user?.name || 'User'}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-effect rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-dark-text">{user?.name}</p>
                      <p className="text-xs text-dark-muted truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm text-dark-text"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FiUser size={16} />
                      <span>My Dashboard</span>
                    </Link>
                    {user && user.company_verified ? (
                      <Link
                        to="/seller-dashboard"
                        className="block px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm text-dark-text"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FiPackage size={16} />
                        <span>Seller Dashboard</span>
                      </Link>
                    ) : (
                      <Link
                        to="/post-product"
                        className="block px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm text-dark-text"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FiPackage size={16} />
                        <span>Post Product</span>
                      </Link>
                    )}
                    <div className="border-t border-dark-border my-1"></div>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm text-red-400"
                    >
                      <FiLogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-dark-text text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:opacity-90 transition-opacity text-sm font-semibold"
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-50 text-dark-text"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-dark-border py-4">
          <div className="px-4 space-y-1">
            <Link
              to="/"
              className={`block px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                location.pathname === '/' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiHome size={18} />
              <span>Home</span>
            </Link>
            <Link
              to="/products"
              className={`block px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                location.pathname === '/products' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiPackage size={18} />
              <span>Products</span>
            </Link>
            <Link
              to="/suppliers"
              className={`block px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                location.pathname === '/suppliers' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiUsers size={18} />
              <span>Suppliers</span>
            </Link>
            <Link
              to="/buy-requirements"
              className={`block px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                location.pathname === '/buy-requirements' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiFileText size={18} />
              <span>Buy Requirements</span>
            </Link>
            <Link
              to="/trade-leads"
              className={`block px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                location.pathname === '/trade-leads' 
                  ? 'bg-accent-purple/20 text-accent-purple' 
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiFileText size={18} />
              <span>Trade Leads</span>
            </Link>
            <Link
              to="/subscription-plans"
              className={`block px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                location.pathname === '/subscription-plans'
                  ? 'bg-accent-purple/20 text-accent-purple'
                  : 'hover:bg-gray-50 text-dark-text'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiStar size={18} />
              <span>Subscription Plans</span>
            </Link>
            {isLoggedIn && (
              <>
                <div className="border-t border-dark-border my-2"></div>
                <Link
                  to="/dashboard"
                  className={`block px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                    location.pathname === '/dashboard' 
                      ? 'bg-accent-purple/20 text-accent-purple' 
                      : 'hover:bg-gray-50 text-dark-text'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser size={18} />
                  <span>Dashboard</span>
                </Link>
                {user && user.company_verified ? (
                  <Link
                    to="/seller-dashboard"
                    className={`block px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                      location.pathname === '/seller-dashboard' 
                        ? 'bg-accent-purple/20 text-accent-purple' 
                        : 'hover:bg-gray-50 text-dark-text'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiPackage size={18} />
                    <span>Seller Dashboard</span>
                  </Link>
                ) : (
                  <Link
                    to="/post-product"
                    className={`block px-4 py-2 rounded-lg text-sm flex items-center space-x-2 ${
                      location.pathname === '/post-product' 
                        ? 'bg-accent-purple/20 text-accent-purple' 
                        : 'hover:bg-gray-50 text-dark-text'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiPackage size={18} />
                    <span>Post Product</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
