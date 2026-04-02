import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiCheck, FiX, FiStar, FiZap, FiShield, FiTruck, FiHeadphones, FiCreditCard, FiGlobe, FiTrendingUp, FiUsers, FiDatabase, FiBell } from 'react-icons/fi';

function SubscriptionPlans() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [user] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const handleSubscribe = async (planType) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Starter plan is free, no need to create subscription
    if (planType === 'starter') {
      alert('Starter Plan is free! You can start using it right away.');
      navigate('/');
      return;
    }

    setLoading(planType);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/subscriptions', {
        user_id: user.id,
        plan_type: planType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const planName = planType === 'basic' ? 'Basic' : 'Premium';
      alert(`Successfully subscribed to ${planName} plan!`);
      navigate('/');
    } catch (error) {
      console.error('Error subscribing:', error);
      alert(error.response?.data?.error || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const starterFeatures = {
    visibility: [
      'Basic seller profile',
      'Limited product catalog (up to 10 listings)',
      'Appears in standard search results'
    ],
    ordering: [
      'Inquiry-based orders only (no direct checkout)',
      'Basic order request management'
    ],
    communication: [
      'Limited direct messaging with buyers',
      'Email notifications for inquiries'
    ],
    trust: [
      'SSL-secured platform access',
      'Basic profile verification'
    ],
    logistics: [
      'Manual shipping coordination',
      'No automated tracking'
    ],
    support: [
      'Community and Help Center access',
      'Email support with 72-hour response time'
    ]
  };

  const basicFeatures = {
    visibility: [
      'Standard Company Profile',
      'Basic Product Catalog (up to 50 listings)'
    ],
    ordering: [
      'Standard Checkout',
      'Basic Shopping Cart',
      'Digital Invoices'
    ],
    communication: [
      'Direct Messaging with buyers/sellers (limit on active threads)'
    ],
    trust: [
      'Standard Business Verification badge',
      'SSL-secured transactions'
    ],
    logistics: [
      'Manual Shipping updates',
      'Basic order tracking'
    ],
    support: [
      'Email Support (48-hour response time)',
      'Access to Help Center'
    ]
  };

  const premiumFeatures = {
    pricing: [
      'Tiered Pricing: Automatic discounts for bulk quantities',
      'Custom Quote (RFQ): Direct negotiation tools for large orders'
    ],
    account: [
      'Multi-User Access: Different permissions for procurement, finance, and warehouse teams',
      'Company Hierarchy: Manage multiple office locations under one account'
    ],
    logistics: [
      'Freight Integration: Real-time shipping quotes for sea/air/trucking',
      'Automated Tracking: Live API-based tracking for international cargo'
    ],
    financial: [
      'Credit Lines: Option to offer "Net 30" or "Net 60" payment terms',
      'Multi-Currency: Automatic conversion and settlement in local currencies'
    ],
    data: [
      'Advanced Analytics: Heatmaps, buyer behavior reports, and sales forecasting',
      'Priority Search: Featured placement in search results and category pages'
    ],
    workflow: [
      'ERP/CRM Integration: Sync orders directly with SAP, Oracle, or Salesforce'
    ],
    support: [
      '24/7 Dedicated Account Manager',
      'Live Chat support'
    ]
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-dark-text mb-4">Choose Your Plan</h1>
          <p className="text-lg text-dark-muted">Select the perfect plan for your business needs</p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Starter Plan */}
          <div className="glass-effect rounded-xl p-8 border-2 border-dark-border hover:border-blue-500 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <FiStar className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-text">Starter Plan</h2>
                <p className="text-sm text-dark-muted italic">"The Launchpad"</p>
              </div>
            </div>
            
            <p className="text-dark-muted mb-4">
              For individuals, first-time sellers, and businesses exploring the platform.
            </p>

            {/* Pricing */}
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-dark-text">₹0</span>
                <span className="text-sm text-dark-muted">/month</span>
              </div>
              <p className="text-xs text-blue-600 font-semibold mt-1">Forever Free</p>
            </div>

            <div className="space-y-6">
              {/* Visibility */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiStar className="text-blue-500" />
                  Visibility
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {starterFeatures.visibility.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ordering */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiCreditCard className="text-blue-500" />
                  Ordering
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {starterFeatures.ordering.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Communication */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiBell className="text-blue-500" />
                  Communication
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {starterFeatures.communication.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust & Safety */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiShield className="text-blue-500" />
                  Trust & Safety
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {starterFeatures.trust.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Logistics */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiTruck className="text-blue-500" />
                  Logistics
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {starterFeatures.logistics.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiHeadphones className="text-blue-500" />
                  Support
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {starterFeatures.support.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Upgrade Benefits */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dark-border">
              <p className="text-xs text-dark-muted mb-2 font-semibold">Upgrade Benefits</p>
              <p className="text-xs text-dark-muted">
                Upgrade anytime to Basic or Premium to unlock more product listings, direct checkout and invoicing, advanced analytics, and priority visibility.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-dark-border">
              <button
                onClick={() => handleSubscribe('starter')}
                disabled={loading === 'starter'}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'starter' ? 'Processing...' : 'Get Started for Free'}
              </button>
            </div>
          </div>

          {/* Basic Plan */}
          <div className="glass-effect rounded-xl p-8 border-2 border-dark-border hover:border-accent-purple transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <FiCheck className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-text">Basic Plan</h2>
                <p className="text-sm text-dark-muted italic">"The Foundation"</p>
              </div>
            </div>
            
            <p className="text-dark-muted mb-4">
              Small businesses, startups, and infrequent traders looking for visibility.
            </p>

            {/* Pricing */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-dark-border">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-dark-text">₹5,000</span>
                <span className="text-sm text-dark-muted">/month</span>
              </div>
              <p className="text-xs text-dark-muted mt-1">Exclusive of GST</p>
            </div>

            <div className="space-y-6">
              {/* Visibility */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiStar className="text-accent-purple" />
                  Visibility
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {basicFeatures.visibility.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ordering */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiCreditCard className="text-accent-purple" />
                  Ordering
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {basicFeatures.ordering.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Communication */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiBell className="text-accent-purple" />
                  Communication
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {basicFeatures.communication.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust & Safety */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiShield className="text-accent-purple" />
                  Trust & Safety
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {basicFeatures.trust.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Logistics */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiTruck className="text-accent-purple" />
                  Logistics
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {basicFeatures.logistics.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiHeadphones className="text-accent-purple" />
                  Support
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {basicFeatures.support.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dark-border">
              <button
                onClick={() => handleSubscribe('basic')}
                disabled={loading === 'basic'}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'basic' ? 'Processing...' : 'Subscribe to Basic Plan'}
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="glass-effect rounded-xl p-8 border-2 border-accent-purple bg-gradient-to-br from-accent-purple/5 to-accent-pink/5 relative">
            <div className="absolute top-4 right-4 px-3 py-1 bg-accent-purple text-white text-xs font-semibold rounded-full">
              POPULAR
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-purple to-accent-pink flex items-center justify-center">
                <FiZap className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-text">Premium Plan</h2>
                <p className="text-sm text-dark-muted italic">"The Powerhouse"</p>
              </div>
            </div>
            
            <p className="text-dark-muted mb-4">
              Established manufacturers, wholesalers, and high-volume traders.
            </p>

            {/* Pricing */}
            <div className="mb-6 p-4 bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 rounded-lg border border-accent-purple/20">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-dark-text">₹10,000</span>
                <span className="text-sm text-dark-muted">/month</span>
              </div>
              <p className="text-xs text-dark-muted mt-1">Exclusive of GST</p>
            </div>

            <div className="space-y-6">
              {/* Advanced Pricing */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiTrendingUp className="text-accent-purple" />
                  Advanced Pricing
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {premiumFeatures.pricing.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Account Management */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiUsers className="text-accent-purple" />
                  Account Management
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {premiumFeatures.account.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Smart Logistics */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiTruck className="text-accent-purple" />
                  Smart Logistics
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {premiumFeatures.logistics.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Financial Tools */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiCreditCard className="text-accent-purple" />
                  Financial Tools
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {premiumFeatures.financial.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Data & SEO */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiDatabase className="text-accent-purple" />
                  Data & SEO
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {premiumFeatures.data.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Workflow */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiGlobe className="text-accent-purple" />
                  Workflow
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {premiumFeatures.workflow.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priority Support */}
              <div>
                <h3 className="font-semibold text-dark-text mb-2 flex items-center gap-2">
                  <FiHeadphones className="text-accent-purple" />
                  Priority Support
                </h3>
                <ul className="space-y-1 text-sm text-dark-muted">
                  {premiumFeatures.support.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <FiCheck className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dark-border">
              <button
                onClick={() => handleSubscribe('premium')}
                disabled={loading === 'premium'}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'premium' ? 'Processing...' : 'Subscribe to Premium Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-accent-blue hover:text-accent-pink transition-colors font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPlans;

