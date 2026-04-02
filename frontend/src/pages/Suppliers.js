import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiUsers, FiShield, FiPackage, FiSearch, FiStar } from 'react-icons/fi';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }
        const res = await axios.get(`/api/suppliers?${params.toString()}`);
        setSuppliers(res.data);
      } catch (err) {
        console.error('Error loading suppliers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* NEW Top Hero Banner - Designed by Stitch */}
      <section className="w-full h-[400px] md:h-[500px] relative overflow-hidden bg-[#060e20] flex items-center justify-center mb-10 border-b border-white/5 shadow-2xl">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#060e20] via-[#060e20]/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-[#060e20]/40 z-10"></div>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKvRkaMt9e-iHouP9QfcYBs9XJDJcWyZAFZwK2ownbB-y9umZPrTv_uINaMdT5CVuDkt4rBUTrTGCddM-JcAOv-irf9hdny_YemRiPTwGNOWBZ91Qhudn4jNhLnx_y5hIFv8Jh7uSWHRRb141ONe9p8h2_Ax-Xzx_57JhWfVx_vn8ix2Xcj9w2o8eZ0ulYUG8d-4PL0VR22ni6gmz_HrrFsuBH1BDKhbbPGkdFoF5-OyCYAgHGnrH2yGK3NF5TEYnTgq5Yt4k5sTU" 
            alt="Global Network Background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Content Container */}
        <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center text-left">
          {/* Nexus Node Indicator */}
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#81ecff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#81ecff]"></span>
            </span>
            <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-[#81ecff] font-bold">Verified Network Active</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-none text-white mb-4 drop-shadow-2xl animate-slide-up">
            GLOBAL <br/>
            <span className="bg-gradient-to-r from-white to-[#00e3fd] bg-clip-text text-transparent" style={{ textShadow: '0 0 20px rgba(129, 236, 255, 0.4)' }}>SUPPLY CHAIN</span> <br/>
            NETWORK
          </h1>
          
          <p className="text-[#a3aac4] text-lg md:text-xl max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Access the world's most resilient manufacturing hub. Real-time logistics, verified Tier-1 suppliers, and seamless digital procurement.
          </p>
        </div>
      </section>

      {/* Existing Suppliers Promotional Hero Section */}
      <div className="relative bg-dark-bg overflow-hidden border-b border-dark-border mb-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/90 to-accent-purple/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-pink/20 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 animate-slide-up flex items-center justify-center gap-4">
              <FiUsers className="text-accent-pink" />
              Trusted Global Network
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium animate-slide-up mb-10" style={{ animationDelay: '0.1s' }}>
              Expand your supply chain. Connect with industry-leading manufacturers, wholesalers, and verified distributors across the globe.
            </p>

            {/* Integrated Search Bar inside Hero */}
            <div className="relative max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="glass-effect bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl flex items-center">
                <FiSearch className="text-white/60 ml-4 text-xl" />
                <input
                  type="text"
                  placeholder="Search suppliers by name, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-transparent border-none text-white placeholder-white/60 focus:outline-none text-lg"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-6 text-sm text-white/80 font-semibold animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span className="flex items-center gap-2"><FiShield className="text-accent-green" /> Verified Businesses</span>
              <span className="flex items-center gap-2"><FiStar className="text-yellow-400" /> Top Rated Suppliers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Content Header */}
        <div className="mb-8 animate-fade-in">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2 text-dark-text animate-slide-down">Suppliers Directory</h1>
            <p className="text-dark-muted font-semibold animate-slide-down" style={{ animationDelay: '0.1s' }}>Discover verified suppliers and manufacturers</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-muted font-semibold">
            <div className="animate-pulse">Loading suppliers...</div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-dark-muted font-semibold text-lg mb-2">
              {searchQuery ? `No suppliers found for "${searchQuery}"` : 'No suppliers found'}
            </div>
            <p className="text-dark-muted text-sm">
              {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new suppliers'}
            </p>
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
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-dark-text group-hover:text-accent-purple transition-colors truncate">
                        {supplier.name}
                      </h3>
                      {supplier.best_seller && (
                        <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded flex items-center gap-1 flex-shrink-0">
                          <FiStar size={10} />
                          Best Seller
                        </span>
                      )}
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
