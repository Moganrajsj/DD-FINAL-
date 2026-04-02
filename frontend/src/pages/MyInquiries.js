import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiMail, FiMessageCircle, FiPackage, FiArrowLeft, FiCheckCircle, FiX } from 'react-icons/fi';
import NegotiationChat from '../components/NegotiationChat';

function MyInquiries() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [negotiatingWith, setNegotiatingWith] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchInquiries(parsedUser.email);
  }, [navigate]);

  const fetchInquiries = async (email) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/buyer/inquiries?email=${encodeURIComponent(email)}`);
      setInquiries(response.data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted animate-pulse">Loading your inquiries...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-dark-muted hover:text-dark-text transition-colors"
          >
            <FiArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-4xl font-bold mb-2 text-dark-text">My Inquiries</h1>
          <p className="text-dark-muted">View all your product inquiries and seller replies</p>
        </div>

        {inquiries.length === 0 ? (
          <div className="glass-effect rounded-xl p-12 text-center">
            <FiMail className="mx-auto text-6xl text-dark-muted mb-4" />
            <p className="text-dark-muted text-lg mb-4">You haven't made any inquiries yet.</p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="glass-effect rounded-xl p-6 border border-gray-200">
                {/* Inquiry Header */}
                <div className="flex items-start gap-4 mb-4">
                  {inquiry.product_image ? (
                    <img
                      src={inquiry.product_image.startsWith('http') || inquiry.product_image.startsWith('//') 
                        ? inquiry.product_image 
                        : inquiry.product_image.startsWith('/') 
                          ? `${process.env.REACT_APP_API_URL || ''}${inquiry.product_image}`
                          : `${process.env.REACT_APP_API_URL || ''}/uploads/products/${inquiry.product_image}`}
                      alt={inquiry.product_name}
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder.png';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                      <FiPackage className="text-gray-400" size={32} />
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/products/${inquiry.product_id}`}
                      className="text-xl font-bold text-dark-text hover:text-accent-purple transition-colors"
                    >
                      {inquiry.product_name}
                    </Link>
                    <p className="text-sm text-dark-muted mt-1">
                      Inquired on {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Your Inquiry */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiMail className="text-accent-purple" size={18} />
                    <span className="font-semibold text-dark-text">Your Inquiry</span>
                  </div>
                  <p className="text-dark-text mb-2">{inquiry.message}</p>
                  {inquiry.quantity && (
                    <p className="text-sm text-dark-muted">
                      <strong>Quantity:</strong> {inquiry.quantity}
                    </p>
                  )}
                </div>

                {/* Seller Replies */}
                {inquiry.replies && inquiry.replies.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <FiMessageCircle className="text-accent-green" size={18} />
                      <span className="font-semibold text-dark-text">
                        Seller Replies ({inquiry.replies.length})
                      </span>
                    </div>
                    {inquiry.replies.map((reply) => (
                      <div key={reply.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-semibold text-dark-text">
                              {reply.company_name || reply.seller_name}
                            </span>
                            {reply.company_name && (
                              <span className="text-sm text-dark-muted ml-2">
                                ({reply.seller_name})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-dark-muted">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-dark-text">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => setNegotiatingWith(inquiry.id)}
                    className="w-full py-3 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100"
                  >
                    <FiMessageCircle /> Negotiate with Seller
                  </button>
                </div>

                {/* Negotiation Modal */}
                {negotiatingWith === inquiry.id && (
                  <div className="fixed inset-0 z-[100] bg-dark-text/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-dark-text">Negotiation with Seller</h3>
                        <button onClick={() => setNegotiatingWith(null)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-dark-muted hover:text-dark-text transition-colors">
                          <FiX />
                        </button>
                      </div>
                      <div className="p-6">
                        <NegotiationChat inquiryId={inquiry.id} currentUser={user} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyInquiries;

