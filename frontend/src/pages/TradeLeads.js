import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './TradeLeads.css';

function TradeLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const fetchLeads = async () => {
    try {
      const params = filter !== 'all' ? `?type=${filter}` : '';
      const response = await axios.get(`/api/trade-leads${params}`);
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching trade leads:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trade-leads-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Trade Leads</h1>
            <p>Discover buying and selling opportunities from verified businesses</p>
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
          <div className="loading">Loading trade leads...</div>
        ) : (
          <div className="leads-grid">
            {leads.length === 0 ? (
              <div className="no-results">
                <p>No trade leads available at the moment.</p>
              </div>
            ) : (
              leads.map(lead => (
                <div key={lead.id} className="lead-card">
                  <div className="lead-badge">{lead.type === 'buy' ? 'Buy Lead' : 'Sell Lead'}</div>
                  <h3>{lead.title}</h3>
                  <p className="lead-description">{lead.description}</p>
                  <div className="lead-meta">
                    <span><strong>Category:</strong> {lead.category || 'N/A'}</span>
                    <span><strong>Location:</strong> {lead.location || 'N/A'}</span>
                    <span><strong>Posted:</strong> {new Date(lead.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="lead-actions">
                    <button className="btn btn-primary">Contact Supplier</button>
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





