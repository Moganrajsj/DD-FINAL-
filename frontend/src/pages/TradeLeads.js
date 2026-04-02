import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getPusher } from '../socket';
import './TradeLeads.css';
import { FiLock, FiUnlock, FiMapPin, FiTag, FiClock, FiCheckCircle } from 'react-icons/fi';

function TradeLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [purchasing, setPurchasing] = useState(null);
  const [newLeadNotification, setNewLeadNotification] = useState(false);

  useEffect(() => {
    fetchLeads();

    // Request notification permission on mount
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    // Pusher for real-time leads
    const pusher = getPusher();
    const channel = pusher.subscribe('public_trade_leads');
    
    channel.bind('new_lead', (data) => {
      setNewLeadNotification(true);
      
      // Spawn native browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = "New Trade Lead Available!";
        const body = `${data.type === 'buy' ? 'WANTED' : 'OFFERING'}: ${data.title} - ${data.location || 'India'}`;
        
        try {
          const notification = new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            tag: 'new_lead_' + new Date().getTime(),
          });
          
          notification.onclick = () => {
            window.focus();
            fetchLeads();
            notification.close();
          };
        } catch (e) {
          console.error("Browser push notification failed", e);
        }
      }
      
      console.log('New lead received:', data);
    });

    return () => channel.unbind_all();
  }, [filter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = filter !== 'all' ? `?type=${filter}` : '';
      const response = await axios.get(`/api/trade-leads${params}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setLeads(response.data);
      setNewLeadNotification(false);
    } catch (error) {
      console.error('Error fetching trade leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (leadId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to unlock trade leads');
      return;
    }

    if (!window.confirm('Unlock this trade lead? The contact information will be revealed to you.')) return;

    try {
      setPurchasing(leadId);
      await axios.post(`/api/trade-leads/${leadId}/purchase`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Lead unlocked successfully!');
      fetchLeads();
    } catch (error) {
      console.error('Error purchasing lead:', error);
      alert(error.response?.data?.error || 'Failed to unlock lead');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="trade-leads-page">
      <div className="container">
        {newLeadNotification && (
          <div className="new-lead-toast" onClick={fetchLeads}>
            <FiClock /> New trade leads available! Click to refresh.
          </div>
        )}

        <div className="page-header">
          <div className="header-info">
            <h1>Trade Leads</h1>
            <p>Real-time buying and selling opportunities from verified businesses</p>
          </div>
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Leads
            </button>
            <button 
              className={filter === 'buy' ? 'active' : ''}
              onClick={() => setFilter('buy')}
            >
              Buy Leads
            </button>
            <button 
              className={filter === 'sell' ? 'active' : ''}
              onClick={() => setFilter('sell')}
            >
              Sell Leads
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Fetching active trade leads...</p>
          </div>
        ) : (
          <div className="leads-grid-premium">
            {leads.length === 0 ? (
              <div className="no-results-premium">
                <FiTag size={48} />
                <h3>No Leads Found</h3>
                <p>Try changing your filter or check back later for new opportunities.</p>
              </div>
            ) : (
              leads.map(lead => (
                <div key={lead.id} className={`lead-card-premium ${lead.has_access ? 'unlocked' : 'locked'}`}>
                  <div className={`lead-type-tag ${lead.type}`}>
                    {lead.type === 'buy' ? 'WANTED' : 'OFFERING'}
                  </div>
                  
                  <div className="lead-header">
                    <h3>{lead.title}</h3>
                    <div className="lead-price">₹{lead.price}</div>
                  </div>

                  <p className="lead-description">{lead.description}</p>
                  
                  <div className="lead-specs">
                    <div className="spec-item"><FiTag /> {lead.category}</div>
                    <div className="spec-item"><FiMapPin /> {lead.location || 'Pan India'}</div>
                    <div className="spec-item"><FiClock /> {new Date(lead.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="contact-reveal-area">
                    {lead.has_access ? (
                      <div className="unlocked-contact">
                        <div className="contact-success"><FiCheckCircle /> Contact Details Revealed</div>
                        <div className="contact-info-grid">
                          <div><strong>Name:</strong> {lead.contact_name}</div>
                          <div><strong>Email:</strong> {lead.contact_email}</div>
                          <div><strong>Phone:</strong> {lead.contact_phone}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="locked-contact">
                        <div className="contact-locked-overlay">
                          <FiLock size={24} />
                          <p>Contact Info Locked</p>
                        </div>
                        <button 
                          className="unlock-btn"
                          onClick={() => handlePurchase(lead.id)}
                          disabled={purchasing === lead.id}
                        >
                          {purchasing === lead.id ? 'Unlocking...' : `Unlock for ₹${lead.price}`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TradeLeads;





