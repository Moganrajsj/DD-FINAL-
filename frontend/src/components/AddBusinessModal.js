import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiBriefcase } from 'react-icons/fi';

function AddBusinessModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAddBusiness = () => {
    onClose();
    navigate('/register-company');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-muted hover:text-dark-text transition-colors"
        >
          <FiX size={24} />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center mx-auto mb-4">
            <FiBriefcase className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-dark-text mb-2">Add Your Business</h2>
          <p className="text-dark-muted">
            Register your company to start selling on DealsDouble.ai. Get verified and reach thousands of buyers.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-accent-purple text-xs font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-dark-text">Register Your Company</h3>
              <p className="text-sm text-dark-muted">Add your business details and information</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-accent-purple text-xs font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-dark-text">Admin Verification</h3>
              <p className="text-sm text-dark-muted">Our team will verify your business</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-accent-purple text-xs font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-dark-text">Start Selling</h3>
              <p className="text-sm text-dark-muted">Add products and reach customers</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAddBusiness}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Add Your Business
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddBusinessModal;





