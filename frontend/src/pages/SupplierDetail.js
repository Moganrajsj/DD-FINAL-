import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiMapPin, FiGlobe, FiCheck, FiArrowLeft } from 'react-icons/fi';

function SupplierDetail() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/api/suppliers/${id}`);
        setSupplier(res.data);
      } catch (err) {
        console.error('Error loading supplier', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!supplier) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted">Supplier not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/suppliers"
          className="inline-flex items-center gap-2 text-dark-muted hover:text-accent-purple mb-6 transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Suppliers</span>
        </Link>

        <div className="glass-effect rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center flex-shrink-0">
              <span className="text-white text-3xl font-bold">
                {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-dark-text">{supplier.name}</h1>
                {supplier.verified && (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500 text-green-400 text-sm font-semibold flex items-center gap-1">
                    <FiCheck />
                    Verified
                  </span>
                )}
              </div>
              {supplier.location && (
                <p className="text-dark-muted mb-3 flex items-center gap-2">
                  <FiMapPin />
                  {supplier.location}
                </p>
              )}
              {supplier.description && (
                <p className="text-dark-text mb-4 leading-relaxed">{supplier.description}</p>
              )}
              {supplier.website && (
                <a 
                  href={supplier.website} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-accent-purple hover:text-accent-pink transition-colors"
                >
                  <FiGlobe />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-dark-text mb-4 flex items-center gap-2">
            <FiPackage />
            Products ({supplier.products?.length || 0})
          </h2>
        </div>

        {supplier.products && supplier.products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {supplier.products.map((p) => (
              <Link 
                key={p.id} 
                to={`/products/${p.id}`} 
                className="glass-effect rounded-xl overflow-hidden hover:glow-effect transition-all group"
              >
                <div className="relative h-48 bg-dark-card overflow-hidden">
                  {p.image_url ? (
                    <img 
                      src={p.image_url} 
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        const encodedName = encodeURIComponent(p.name.substring(0, 30));
                        e.target.src = `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodedName}`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-muted">
                      <FiPackage className="text-4xl" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-2 text-dark-text line-clamp-2 group-hover:text-accent-purple transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xl font-bold text-accent-orange mb-2">
                    ₹{p.price?.toLocaleString('en-IN') || 'Price on Request'}
                  </p>
                  {p.category_name && (
                    <p className="text-xs text-dark-muted">{p.category_name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-effect rounded-xl p-12 text-center">
            <FiPackage className="mx-auto text-6xl text-dark-muted mb-4" />
            <p className="text-dark-muted text-lg">No products available from this supplier.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplierDetail;

