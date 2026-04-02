import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { trackMarketplaceEvent } from '../utils/analytics';
import {
  FiArrowRight,
  FiFileText,
  FiLayers,
  FiSearch,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiInfo,
} from 'react-icons/fi';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('All Locations');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ products: 0, suppliers: 0, categories: 0, users: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [velocityData, setVelocityData] = useState([42, 58, 66, 61, 73, 81, 77, 69, 88, 84, 79, 91]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [homepageRes] = await Promise.all([
          axios.get('/api/homepage/data'),
          fetchCountries(),
        ]);
        const data = homepageRes.data;
        if (data.categories) setCategories(data.categories);
        if (data.featured_products) setProducts(data.featured_products);
        if (data.stats) setStats({ products: data.stats.products || 0, suppliers: data.stats.suppliers || 0, categories: data.stats.categories || 0, users: data.stats.users || 0 });
        if (data.velocity && data.velocity.length) setVelocityData(data.velocity);
      } catch (err) {
        console.error('Homepage load error:', err);
      }
      trackMarketplaceEvent('homepage_view');
    };
    loadHomeData();
  }, []);

  useEffect(() => {
    if (country) {
      fetchStates();
    } else {
      setStates([]);
      setState('');
      setDistrict('');
      setDistricts([]);
      setLocation('All Locations');
    }
  }, [country]);

  useEffect(() => {
    if (state) {
      fetchDistricts();
    } else {
      setDistricts([]);
    }
  }, [state]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await axios.get(
          `/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`,
          { signal: controller.signal }
        );
        setSuggestions(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          console.error('Error fetching product suggestions:', error);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories?sort=trending');
      const list = Array.isArray(response.data) ? response.data : [];
      setCategories(list);
      return list;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  const fetchProducts = async (categoryList = []) => {
    try {
      let activeCategories = categoryList;

      if (!activeCategories.length) {
        const response = await axios.get('/api/categories?sort=trending');
        activeCategories = Array.isArray(response.data) ? response.data : [];
        if (activeCategories.length) {
          setCategories(activeCategories);
        }
      }

      const productRequests = activeCategories.map((category) =>
        axios
          .get(`/api/products?category=${category.id}&limit=6`)
          .then((response) => ({
            categoryId: category.id,
            items: Array.isArray(response.data) ? response.data : [],
          }))
          .catch(() => ({ categoryId: category.id, items: [] }))
      );

      const results = await Promise.all(productRequests);
      setProducts(results.flatMap((result) => result.items));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats');
      const data = response.data || {};
      setStats({
        products: data.products || 0,
        suppliers: data.suppliers || 0,
        categories: data.categories || 0,
        users: data.users || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVelocityData = async () => {
    try {
      const response = await axios.get('/api/analytics/velocity');
      const series = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.series)
          ? response.data.series
          : [];

      if (series.length > 0) {
        setVelocityData(series.slice(0, 12).map((value) => Number(value) || 0));
      }
    } catch (error) {
      console.error('Error fetching velocity data:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await axios.get('/api/locations/countries');
      const list = response.data || [];
      setCountries(list);
      if (!country && list.length > 0) {
        setCountry(list[0]);
        setLocation(list[0]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchStates = async () => {
    if (!country) return;
    try {
      const response = await axios.get(`/api/locations/states?country=${encodeURIComponent(country)}`);
      setStates(response.data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await axios.get(
        `/api/locations/districts?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`
      );
      setDistricts(response.data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const groupedProducts = useMemo(() => {
    const grouped = {};
    products.forEach((product) => {
      const categoryId = product.category_id;
      if (!categoryId) return;
      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          name: product.category_name || 'Uncategorized',
          items: [],
        };
      }
      grouped[categoryId].items.push(product);
    });
    return grouped;
  }, [products]);

  const velocityInsights = useMemo(() => {
    const cleanedSeries = velocityData
      .slice(0, 12)
      .map((value) => Number(value) || 0)
      .filter((value) => value > 0);

    if (!cleanedSeries.length) {
      return {
        average: 0,
        latest: 0,
        previous: 0,
        delta: 0,
        change: 0,
        peakLabel: 'N/A',
        peakValue: 0,
        status: 'Stable',
        bars: [],
      };
    }

    const peakValue = Math.max(...cleanedSeries);
    const latest = cleanedSeries[cleanedSeries.length - 1];
    const previous = cleanedSeries[cleanedSeries.length - 2] ?? latest;
    const delta = latest - previous;
    const average = Math.round(cleanedSeries.reduce((sum, value) => sum + value, 0) / cleanedSeries.length);
    const peakIndex = cleanedSeries.lastIndexOf(peakValue);
    const change = previous ? Math.round((delta / previous) * 100) : 0;
    const status = delta > 0 ? 'Rising' : delta < 0 ? 'Cooling' : 'Stable';
    const bars = cleanedSeries.map((value, index) => ({
      label: MONTHS[index] || `M${index + 1}`,
      value,
      height: `${Math.max(24, Math.round((value / peakValue) * 100))}%`,
      isPeak: value === peakValue,
      isLatest: index === cleanedSeries.length - 1,
    }));

    return {
      average,
      latest,
      previous,
      delta,
      change,
      peakLabel: MONTHS[peakIndex] || 'N/A',
      peakValue,
      status,
      bars,
    };
  }, [velocityData]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('search', searchQuery);
      if (location && location !== 'All Locations') {
        params.set('location', location);
      }
      navigate(`/products?${params.toString()}`);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (productId) => {
    setSuggestions([]);
    navigate(`/products/${productId}`);
  };

  const featuredProducts = products.slice(0, 6);
  const displayCategories = categories; // Show ALL categories
  const topCategories = categories; // Show ALL categories

  return (
    <div className="min-h-screen bg-white">
      <div className="glass-effect border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex gap-2 min-w-[220px] w-full md:w-auto">
              <select
                className="px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-dark-text text-sm flex-1"
                value={country}
                onChange={(event) => {
                  const value = event.target.value;
                  setCountry(value);
                  setState('');
                  setDistrict('');
                  setLocation(value || 'All Locations');
                }}
              >
                <option value="">All Countries</option>
                {countries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-dark-text text-sm flex-1"
                value={state}
                onChange={(event) => {
                  const value = event.target.value;
                  setState(value);
                  setDistrict('');
                  setLocation(value ? `${value}, ${country || ''}` : country || 'All Locations');
                }}
                disabled={!country}
              >
                <option value="">{country ? 'All States' : 'Select a country first'}</option>
                {states.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {state && (
                <select
                  className="px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-dark-text text-sm flex-1"
                  value={district}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDistrict(value);
                    setLocation(value ? `${value}, ${state}, ${country || ''}` : `${state}, ${country || ''}`);
                  }}
                >
                  <option value="">All Districts</option>
                  {districts.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex-1 max-w-3xl w-full">
              <form onSubmit={handleSearch} className="flex items-center gap-0 w-full">
                <input
                  type="text"
                  placeholder="Search products, suppliers, buyers worldwide"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-l-lg bg-white border border-gray-200 border-r-0 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-r-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  <FiSearch size={20} />
                </button>
              </form>

              {searchQuery.trim() && suggestions.length > 0 && (
                <div className="mt-1 w-full rounded-lg bg-white border border-gray-200 shadow-lg max-h-80 overflow-y-auto animate-fade-in">
                  {isSearching && (
                    <div className="px-4 py-2 text-xs text-dark-muted border-b border-gray-200">
                      Searching...
                    </div>
                  )}
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(product.id)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col gap-1"
                    >
                      <span className="text-sm font-semibold text-dark-text">{product.name}</span>
                      <span className="text-xs text-dark-muted line-clamp-1">
                        {product.company_name || 'Supplier'} • {product.location || 'Global'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          <aside className="order-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm animate-fade-in md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent-purple">All Categories</p>
                  <h3 className="mt-2 text-2xl font-black text-dark-text md:text-3xl">Browse by Category</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-dark-muted">
                    {categories.length} categories — from raw materials to finished goods. Explore them all.
                  </p>
                </div>
                <Link
                  to="/products"
                  className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-accent-blue transition-colors hover:text-accent-pink shrink-0"
                >
                  View all products
                  <FiArrowRight size={16} />
                </Link>
              </div>

              {categories.length === 0 ? (
                /* Skeleton Loader */
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <li key={i} className="animate-pulse">
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 h-28" />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {topCategories.map((category, index) => {
                    const CATEGORY_COLORS = [
                      { bg: 'bg-violet-50', text: 'text-violet-600', hover: 'hover:border-violet-300 hover:shadow-violet-100', icon: '#7c3aed' },
                      { bg: 'bg-pink-50', text: 'text-pink-600', hover: 'hover:border-pink-300 hover:shadow-pink-100', icon: '#db2777' },
                      { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:border-blue-300 hover:shadow-blue-100', icon: '#2563eb' },
                      { bg: 'bg-amber-50', text: 'text-amber-600', hover: 'hover:border-amber-300 hover:shadow-amber-100', icon: '#d97706' },
                      { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:border-emerald-300 hover:shadow-emerald-100', icon: '#059669' },
                      { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'hover:border-orange-300 hover:shadow-orange-100', icon: '#ea580c' },
                      { bg: 'bg-cyan-50', text: 'text-cyan-600', hover: 'hover:border-cyan-300 hover:shadow-cyan-100', icon: '#0891b2' },
                      { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:border-indigo-300 hover:shadow-indigo-100', icon: '#4f46e5' },
                    ];
                    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                    return (
                      <li
                        key={category.id}
                        style={{
                          opacity: 0,
                          animation: `fadeSlideUp 0.4s ease forwards`,
                          animationDelay: `${Math.min(index * 0.04, 0.6)}s`,
                        }}
                      >
                        <Link
                          to={`/products?category=${category.id}`}
                          className={`group block rounded-2xl border border-gray-200 bg-white p-4 text-dark-text transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${color.hover}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className={`rounded-xl ${color.bg} p-2.5 ${color.text} transition-transform duration-300 group-hover:scale-110`}>
                              <FiPackage size={18} />
                            </div>
                            <FiArrowRight
                              className="text-gray-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent-purple"
                              size={14}
                            />
                          </div>
                          <span className="mt-3 block text-sm font-black text-dark-text leading-tight">{category.name}</span>
                          {category.views > 0 && (
                            <span className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold ${color.text} uppercase tracking-wide`}>
                              <FiTrendingUp size={10} />
                              {(category.views).toLocaleString()} views
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-6 rounded-3xl border border-gray-200 bg-white/92 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent-blue">Trade Pulse</p>
                    <h3 className="mt-2 text-2xl font-black text-dark-text">Demand Velocity</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-dark-muted">
                      Live marketplace momentum from the latest sourcing activity across products and categories.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-gradient-to-br from-accent-blue/15 to-accent-purple/15 p-3 text-accent-blue">
                      <FiBarChart2 size={20} />
                    </div>
                    <div
                      className={`rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${
                        velocityInsights.delta >= 0
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-orange-50 text-orange-600'
                      }`}
                    >
                      {velocityInsights.status} {velocityInsights.delta >= 0 ? '+' : ''}
                      {velocityInsights.change}%
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="group relative rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 hover:bg-white hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-dark-muted">Current Index</p>
                      <FiInfo className="text-gray-400 cursor-help" size={14} title="Normalized index (0-100+) of total sourcing intent across the platform today." />
                    </div>
                    <p className="mt-2 text-2xl font-black text-dark-text">{velocityInsights.latest}</p>
                    <p className="mt-1 text-xs text-dark-muted">Latest demand signal</p>
                  </div>
                  <div className="group relative rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 hover:bg-white hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-dark-muted">Monthly Change</p>
                      <FiInfo className="text-gray-400 cursor-help" size={14} title="Percentage difference in sourcing activity compared to the previous 30 days." />
                    </div>
                    <p className="mt-2 text-2xl font-black text-dark-text">
                      {velocityInsights.delta >= 0 ? '+' : ''}
                      {velocityInsights.delta}
                    </p>
                    <p className="mt-1 text-xs text-dark-muted">Against the previous period</p>
                  </div>
                  <div className="group relative rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 hover:bg-white hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-dark-muted">Peak Window</p>
                      <FiInfo className="text-gray-400 cursor-help" size={14} title="The month with the highest historical sourcing activity in the past year." />
                    </div>
                    <p className="mt-2 text-2xl font-black text-dark-text">{velocityInsights.peakLabel}</p>
                    <p className="mt-1 text-xs text-dark-muted">Top index {velocityInsights.peakValue}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4">
                  <div className="mb-3 flex flex-wrap gap-2 items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-dark-muted">12-Month Demand View</p>
                    <div className="flex gap-3 text-[10px] font-semibold text-dark-muted">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> History</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-purple"></span> Peak</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-blue"></span> Current</span>
                    </div>
                  </div>
                  <div className="flex h-48 items-end gap-2 rounded-2xl bg-[linear-gradient(to_top,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[length:100%_32px] px-2 pb-2 pt-4">
                    {velocityInsights.bars.map((bar) => (
                      <div key={`${bar.label}-${bar.value}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-[10px] font-bold text-dark-text/70">{bar.value}</span>
                        <div
                          className={`w-full rounded-t-2xl ${
                            bar.isLatest
                              ? 'bg-gradient-to-t from-accent-blue to-cyan-300 shadow-[0_8px_20px_rgba(34,211,238,0.28)]'
                              : bar.isPeak
                                ? 'bg-gradient-to-t from-accent-purple to-accent-pink shadow-[0_8px_20px_rgba(236,72,153,0.2)]'
                                : 'bg-gradient-to-t from-slate-300 to-slate-200'
                          }`}
                          style={{ height: bar.height }}
                        />
                        <span className="text-[10px] font-bold tracking-wide text-gray-500">{bar.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-100 p-3 text-xs leading-relaxed text-dark-muted">
                    <p>
                        <strong className="text-dark-text">Platform Pulse Guide:</strong><br />
                        Data reflects live sourcing signals including Product Views, Searches, and active RFQs. 
                        A <span className="font-semibold text-emerald-600">Rising</span> velocity indicates &gt;5% growth, while <span className="font-semibold text-orange-600">Cooling</span> indicates a decline.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="order-1 space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-violet-50/70 shadow-sm animate-fade-in">
              <div className="hero-grid-pattern absolute inset-0 opacity-30" />
              <div className="absolute -left-16 top-12 h-40 w-40 rounded-full bg-accent-purple/10 blur-3xl" />
              <div className="absolute right-12 top-10 h-44 w-44 rounded-full bg-accent-blue/10 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-accent-pink/8 blur-3xl" />

              <div className="relative grid gap-5 p-5 md:p-7 xl:grid-cols-[1.12fr_0.88fr]">
                <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
                  <div className="inline-flex items-center gap-3 rounded-full border border-accent-purple/15 bg-violet-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-accent-purple">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent-purple shadow-[0_0_12px_rgba(139,92,246,0.45)]" />
                    AI-Powered B2B Marketplace
                  </div>

                  <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.94] tracking-[-0.04em] text-dark-text md:text-6xl">
                    Source faster.
                    <span className="mt-1 block bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue bg-clip-text text-transparent">
                      Trade with clearer signals.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-dark-muted md:text-base">
                    Discover verified suppliers, monitor demand momentum, and move from product discovery to RFQ with a home page that feels sharper, clearer, and easier to trust.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-dark-text shadow-sm">
                      <FiShield className="text-accent-green" size={14} />
                      Verified supplier network
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-dark-text shadow-sm">
                      <FiTrendingUp className="text-accent-blue" size={14} />
                      Live demand indicators
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-dark-text shadow-sm">
                      <FiFileText className="text-accent-purple" size={14} />
                      RFQ-ready discovery flow
                    </div>
                  </div>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/products"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-purple to-accent-pink px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition-all hover:opacity-90"
                    >
                      Explore Products
                      <FiArrowRight size={16} />
                    </Link>
                    <Link
                      to="/buy-requirements"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-dark-text transition-all hover:border-accent-purple hover:text-accent-purple"
                    >
                      Post Requirement
                      <FiFileText size={16} />
                    </Link>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-accent-green">
                        <FiShield size={16} />
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-dark-text">Verified Suppliers</span>
                      </div>
                      <p className="text-2xl font-black text-dark-text">{stats.suppliers?.toLocaleString() || '0'}</p>
                      <p className="mt-1 text-xs leading-5 text-dark-muted">Trusted companies visible across active categories.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-accent-blue">
                        <FiTrendingUp size={16} />
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-dark-text">Marketplace Motion</span>
                      </div>
                      <p className="text-2xl font-black text-dark-text">{stats.products?.toLocaleString() || '0'}</p>
                      <p className="mt-1 text-xs leading-5 text-dark-muted">Products flowing through a growing sourcing network.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-2 text-accent-purple">
                        <FiLayers size={16} />
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-dark-text">Category Reach</span>
                      </div>
                      <p className="text-2xl font-black text-dark-text">{stats.categories?.toLocaleString() || '0'}</p>
                      <p className="mt-1 text-xs leading-5 text-dark-muted">Source across multiple sectors with less friction.</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-effect rounded-xl p-6 bg-gradient-to-br from-accent-orange to-yellow-500 border border-accent-orange/30">
                <h3 className="text-xl font-bold mb-2 text-dark-bg">Looking for a Product?</h3>
                <p className="text-sm text-dark-bg/80 mb-4">
                  Post your buying requirement and get quotes from verified suppliers
                </p>
                <Link
                  to="/buy-requirements"
                  className="block w-full px-4 py-2 rounded-lg bg-dark-bg text-accent-orange font-semibold hover:opacity-90 transition-opacity text-center"
                >
                  Post Buy Requirement
                </Link>
              </div>

              <div className="glass-effect rounded-xl p-6 bg-gradient-to-br from-red-500 to-pink-500 border border-red-500/30">
                <h3 className="text-xl font-bold mb-2 text-white">Want to grow your business faster?</h3>
                <p className="text-sm text-white/90 mb-4">Join thousands of sellers on DealsDouble.ai</p>
                <Link
                  to="/register"
                  className="block w-full px-4 py-2 rounded-lg bg-white text-red-500 font-semibold hover:opacity-90 transition-opacity text-center"
                >
                  Sell on DealsDouble.ai
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-effect rounded-xl p-6 hover-lift hover-glow animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center mb-4 hover-scale">
                  <FiSearch size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-dark-text">AI-Powered Search</h3>
                <p className="text-dark-muted font-medium">
                  Find exactly what you need with semantic search that understands technical specifications.
                </p>
              </div>

              <div className="glass-effect rounded-xl p-6 hover-lift hover-glow animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center mb-4 hover-scale">
                  <FiFileText size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-dark-text">Instant RFQs</h3>
                <p className="text-dark-muted font-medium">
                  Generate detailed Requests for Quotation in seconds and reach suppliers faster.
                </p>
              </div>

              <div className="glass-effect rounded-xl p-6 hover-lift hover-glow animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center mb-4 hover-scale">
                  <FiUsers size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-dark-text">Trusted Network</h3>
                <p className="text-dark-muted font-medium">
                  Explore a growing supplier base with verified company visibility and category-driven discovery.
                </p>
              </div>
            </div>

            <div className="glass-effect rounded-xl p-6 bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20">
              <h3 className="text-2xl font-bold mb-6 text-dark-text text-center">Platform Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-purple mb-1">{stats.products?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600 font-semibold">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-pink mb-1">{stats.suppliers?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600 font-semibold">Suppliers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-blue mb-1">{stats.categories?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600 font-semibold">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-green mb-1">{stats.users?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600 font-semibold">Users</div>
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-dark-text">Market Velocity</h3>
                  <p className="text-sm text-dark-muted font-medium">Monthly marketplace movement and category demand</p>
                </div>
                <FiBarChart2 className="text-accent-blue text-2xl" />
              </div>
              <div className="h-56 bg-gray-50 rounded-xl border border-gray-200 flex items-end justify-between p-6 gap-2">
                {velocityData.map((value, index) => (
                  <div key={`${MONTHS[index]}-${value}`} className="flex-1 h-full flex flex-col items-center justify-end gap-3">
                    <div
                      className={`w-full rounded-t-lg ${index >= 9 ? 'bg-gradient-to-t from-accent-blue to-accent-green' : 'bg-gradient-to-t from-accent-purple/50 to-accent-pink/60'}`}
                      style={{ height: `${Math.max(value, 16)}%` }}
                    />
                    <span className="text-[10px] font-bold text-gray-500">{MONTHS[index]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-dark-text">Featured Products</h3>
                <Link to="/products" className="text-sm font-semibold text-accent-blue hover:text-accent-pink transition-colors">
                  View all products →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="glass-effect rounded-xl overflow-hidden hover-lift transition-all"
                  >
                    <div className="h-44 bg-gray-100 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.target.onerror = null;
                            event.target.src = '/placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiPackage size={40} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-accent-blue font-semibold mb-1">{product.category_name || 'Marketplace Product'}</div>
                      <h4 className="text-base font-bold text-dark-text mb-2">{product.name}</h4>
                      <p className="text-sm text-dark-muted mb-3">{product.company_name || 'Verified Supplier'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-accent-orange">
                          {product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : 'Price on Request'}
                        </span>
                        <span className="text-xs font-semibold text-dark-muted flex items-center gap-1">
                          Details
                          <FiArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {displayCategories.map((category) => {
                const group = groupedProducts[category.id] || { items: [] };
                return (
                  <div key={category.id} className="glass-effect rounded-xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-dark-text">{category.name}</h3>
                        <p className="text-sm text-dark-muted font-medium">Browse products from this category</p>
                      </div>
                      <Link
                        to={`/products?category=${category.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
                      >
                        Explore Category
                        <FiArrowRight size={16} />
                      </Link>
                    </div>

                    {group.items.length > 0 ? (
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {group.items.slice(0, 3).map((product) => (
                          <Link
                            key={product.id}
                            to={`/products/${product.id}`}
                            className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
                          >
                            <div className="h-40 bg-gray-100 overflow-hidden">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(event) => {
                                    event.target.onerror = null;
                                    event.target.src = '/placeholder.png';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <FiPackage size={34} />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="text-base font-bold text-dark-text mb-2">{product.name}</h4>
                              <p className="text-sm text-dark-muted mb-3">{product.company_name || 'Supplier'}</p>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-bold text-accent-orange">
                                  {product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : 'Quote only'}
                                </span>
                                <span className="text-dark-muted font-semibold">{product.location || 'India'}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                        <h4 className="text-lg font-bold text-dark-text mb-2">Products are being added</h4>
                        <p className="text-sm text-dark-muted mb-4">
                          This category is available, and inventory will appear here as soon as approved products are listed.
                        </p>
                        <Link
                          to="/buy-requirements"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-bg text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                          Post a Requirement
                          <FiArrowRight size={16} />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-6 text-dark-text">Trending Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.id}`}
                    className="glass-effect rounded-lg p-4 text-center hover:glow-effect transition-all"
                  >
                    <FiPackage className="mx-auto mb-2 text-accent-purple text-2xl" />
                    <div className="text-sm font-semibold text-dark-text">{category.name}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-6 text-dark-text text-center">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">1</div>
                  <h4 className="text-lg font-bold text-dark-text mb-2">Search & Discover</h4>
                  <p className="text-sm text-gray-600">Browse thousands of products from verified suppliers worldwide</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">2</div>
                  <h4 className="text-lg font-bold text-dark-text mb-2">Connect & Negotiate</h4>
                  <p className="text-sm text-gray-600">Chat directly with suppliers and get instant quotes</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">3</div>
                  <h4 className="text-lg font-bold text-dark-text mb-2">Order & Grow</h4>
                  <p className="text-sm text-gray-600">Place orders securely and track them in real-time</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Home;
