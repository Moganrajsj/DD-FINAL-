import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiX, FiBriefcase, FiCheckCircle } from 'react-icons/fi';

function CompanyRegistrationPrompt() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const checkAndShowModal = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Check if user has dismissed this modal before (using localStorage)
        const dismissedKey = `company_prompt_dismissed_${parsedUser.id}`;
        const wasDismissed = localStorage.getItem(dismissedKey) === 'true';
        
        // Don't show on register-company page
        const isOnRegisterCompanyPage = location.pathname === '/register-company';
        
        // Show modal if:
        // 1. User doesn't have a company
        // 2. User hasn't dismissed it before
        // 3. User is not an admin
        // 4. Not on the register-company page
        if (!parsedUser.has_company && !wasDismissed && !parsedUser.is_admin && !isOnRegisterCompanyPage) {
          // Small delay to ensure smooth page load
          setTimeout(() => {
            setShowModal(true);
          }, 1000);
        } else {
          setShowModal(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      setShowModal(false);
    }
  };

  useEffect(() => {
    checkAndShowModal();
    
    // Listen for storage changes (when user registers company)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        checkAndShowModal();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically (in case localStorage is updated in same window)
    const interval = setInterval(() => {
      checkAndShowModal();
    }, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handleRegisterCompany = () => {
    setShowModal(false);
    navigate('/register-company');
  };

  const handleDismiss = () => {
    setShowModal(false);
    setDismissed(true);
    
    // Save dismissal to localStorage
    if (user) {
      const dismissedKey = `company_prompt_dismissed_${user.id}`;
      localStorage.setItem(dismissedKey, 'true');
    }
  };

  const handleLater = () => {
    handleDismiss();
  };

  if (!showModal || !user || user.has_company || user.is_admin) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-effect rounded-xl p-8 max-w-md w-full border border-gray-200 animate-slide-down relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-dark-muted hover:text-dark-text transition-colors"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
            <FiBriefcase className="text-white" size={40} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-dark-text mb-3">
            Register Your Company
          </h2>
          <p className="text-dark-muted mb-4">
            Start selling on DealsDouble.AI! Register your company to:
          </p>
          
          <div className="text-left space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-dark-text text-sm">Post and manage your products</span>
            </div>
            <div className="flex items-start gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-dark-text text-sm">Get verified and build trust with buyers</span>
            </div>
            <div className="flex items-start gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-dark-text text-sm">Access seller dashboard and analytics</span>
            </div>
            <div className="flex items-start gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-dark-text text-sm">Receive inquiries and orders from buyers</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRegisterCompany}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <FiBriefcase size={20} />
            Register Company Now
          </button>
          <button
            onClick={handleLater}
            className="w-full px-6 py-3 rounded-lg glass-effect border border-gray-200 text-dark-text font-semibold hover:border-accent-purple transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompanyRegistrationPrompt;

