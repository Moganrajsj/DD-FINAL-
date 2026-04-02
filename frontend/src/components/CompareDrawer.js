import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiX, FiLayers, FiTrash2, FiMaximize2 } from 'react-icons/fi';

const CompareDrawer = () => {
  const [compareList, setCompareList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Sync with localStorage
    const updateList = () => {
      const stored = JSON.parse(localStorage.getItem('compareList') || '[]');
      setCompareList(stored);
    };

    updateList();
    window.addEventListener('storage', updateList);
    // Custom event for same-window updates
    window.addEventListener('compareUpdate', updateList);

    return () => {
      window.removeEventListener('storage', updateList);
      window.removeEventListener('compareUpdate', updateList);
    };
  }, []);

  const removeFromCompare = (id) => {
    const updated = compareList.filter(p => p.id !== id);
    localStorage.setItem('compareList', JSON.stringify(updated));
    setCompareList(updated);
    window.dispatchEvent(new Event('compareUpdate'));
  };

  const clearAll = () => {
    localStorage.setItem('compareList', '[]');
    setCompareList([]);
    window.dispatchEvent(new Event('compareUpdate'));
  };

  // Don't show on the comparison page itself or if empty
  if (compareList.length === 0 || location.pathname === '/compare') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom duration-300">
      <div className="max-w-4xl mx-auto bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center">
              <FiLayers size={20} />
            </div>
            <div>
              <h4 className="font-bold text-dark-text">Compare Products</h4>
              <p className="text-xs text-dark-muted">{compareList.length} products selected</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={clearAll}
              className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
            >
              <FiTrash2 /> Clear All
            </button>
            <button 
              onClick={() => navigate('/compare')}
              className="px-6 py-2.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold rounded-xl shadow-lg shadow-purple-200 flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <FiMaximize2 /> Compare Now
            </button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {compareList.map((product) => (
            <div key={product.id} className="relative group flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
                <img 
                  src={product.image_url || '/placeholder.png'} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                onClick={() => removeFromCompare(product.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors border border-gray-100"
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
          
          {/* Add more placeholder */}
          {compareList.length < 4 && Array(4 - compareList.length).fill(0).map((_, i) => (
            <div key={`empty-${i}`} className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-200">
               <FiPlus size={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FiPlus = ({ size }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default CompareDrawer;
