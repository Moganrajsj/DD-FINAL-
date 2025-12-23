import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiShield, FiPackage } from 'react-icons/fi';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await axios.get('/api/suppliers');
        setSuppliers(res.data);
      } catch (err) {
        console.error('Error loading suppliers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 text-dark-text animate-slide-down">Suppliers Directory</h1>
          <p className="text-dark-muted font-semibold animate-slide-down" style={{ animationDelay: '0.1s' }}>Discover verified suppliers and manufacturers</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-muted font-semibold">
            <div className="animate-pulse">Loading suppliers...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier, idx) => (
              <Link
                key={supplier.id}
                to={`/suppliers/${supplier.id}`}
                className="glass-effect rounded-xl p-6 hover-lift hover-glow transition-all group animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 hover-scale">
                    {supplier.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-dark-text group-hover:text-accent-purple transition-colors truncate">
                        {supplier.name}
                      </h3>
                      {supplier.verified && (
                        <span className="px-2 py-1 bg-accent-green text-white text-xs font-semibold rounded flex items-center gap-1 flex-shrink-0">
                          <FiShield size={10} />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-muted font-semibold mb-2">{supplier.location}</p>
                    <p className="text-sm text-dark-muted font-semibold mb-3 line-clamp-2">
                      {supplier.description}
                    </p>
                    <div className="flex items-center gap-2 text-accent-blue">
                      <FiPackage size={14} />
                      <span className="text-sm font-semibold">{supplier.product_count} products</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Suppliers;
