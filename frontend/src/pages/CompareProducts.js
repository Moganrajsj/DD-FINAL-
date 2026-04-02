import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiShoppingCart, FiMessageCircle, FiStar, FiCheckCircle } from 'react-icons/fi';

const CompareProducts = () => {
  const [compareList, setCompareList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('compareList') || '[]');
    setCompareList(stored);
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
    navigate('/products');
  };

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 mb-6">
          <FiTrash2 size={48} />
        </div>
        <h2 className="text-2xl font-bold text-dark-text mb-2">No products to compare</h2>
        <p className="text-dark-muted mb-8 text-center max-w-sm">Add products from the catalog to see them side-by-side here.</p>
        <button 
          onClick={() => navigate('/products')}
          className="px-8 py-3 bg-accent-purple text-white font-bold rounded-xl shadow-lg shadow-purple-200"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const attributes = [
    { label: 'Price (per unit)', key: 'price', format: (v) => `₹${v?.toLocaleString()}` },
    { label: 'Minimum Order', key: 'min_order', format: (v) => v || 'N/A' },
    { label: 'Inventory Status', key: 'stock_quantity', format: (v) => v > 10 ? 'In Stock' : 'Low Stock' },
    { label: 'Supplier', key: 'company_name', format: (v) => v || 'Direct' },
    { label: 'Trust Level', key: 'is_verified', format: (v) => v ? 'Verified Gold' : 'Verified' },
    { label: 'Unit', key: 'unit', format: (v) => v || 'Pieces' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-dark-muted hover:text-dark-text transition-colors mb-4"
            >
              <FiArrowLeft /> Back
            </button>
            <h1 className="text-4xl font-black text-dark-text">Product Comparison</h1>
            <p className="text-dark-muted mt-1">Analyzing {compareList.length} products side-by-side</p>
          </div>
          <button 
            onClick={clearAll}
            className="px-6 py-3 border-2 border-red-100 text-red-500 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center gap-2"
          >
            <FiTrash2 /> Clear Comparison
          </button>
        </div>

        <div className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-8 text-left bg-gray-50/50 w-64 border-b border-gray-100">
                    <span className="text-xs font-black uppercase tracking-widest text-dark-muted">Specifications</span>
                  </th>
                  {compareList.map((product) => (
                    <th key={product.id} className="p-8 min-w-[300px] border-b border-gray-100 group relative">
                      <button 
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                      >
                        <FiX size={16} />
                      </button>
                      <div className="flex flex-col items-center text-center">
                        <div className="w-40 h-40 rounded-3xl bg-gray-50 border border-gray-100 overflow-hidden mb-6 shadow-sm">
                          <img 
                            src={product.image_url || '/placeholder.png'} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Link to={`/products/${product.id}`} className="text-lg font-bold text-dark-text hover:text-accent-purple transition-colors line-clamp-2 mb-2">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-1 text-amber-400 mb-4">
                          <FiStar fill="currentColor" size={14} />
                          <FiStar fill="currentColor" size={14} />
                          <FiStar fill="currentColor" size={14} />
                          <FiStar fill="currentColor" size={14} />
                          <span className="text-dark-muted text-xs ml-1 font-bold">(4.8)</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attributes.map((attr, idx) => (
                  <tr key={attr.key} className={idx % 2 === 0 ? '' : 'bg-gray-50/30'}>
                    <td className="p-8 font-bold text-dark-text border-b border-gray-100 bg-gray-50/50">
                      {attr.label}
                    </td>
                    {compareList.map((product) => (
                      <td key={product.id} className="p-8 text-center text-dark-text border-b border-gray-100">
                        {attr.key === 'is_verified' ? (
                          <div className="flex items-center justify-center gap-1 font-bold text-accent-purple">
                            <FiCheckCircle /> {attr.format(product[attr.key])}
                          </div>
                        ) : (
                          <span className="font-medium text-dark-muted">
                            {attr.format(product[attr.key])}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-8 bg-gray-50/50"></td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-8">
                       <div className="space-y-3">
                          <button 
                            className="w-full py-4 bg-accent-purple text-white font-bold rounded-2xl shadow-lg shadow-purple-100 hover:scale-105 transition-transform flex items-center justify-center gap-2"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            <FiShoppingCart /> Buy Now
                          </button>
                          <button 
                            className="w-full py-4 bg-white border-2 border-accent-purple text-accent-purple font-bold rounded-2xl hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-bold"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            <FiMessageCircle /> Negotiate
                          </button>
                       </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const FiX = ({ size }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} xmlns="http://www.w3.org/2000/svg">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default CompareProducts;
