import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiSend, FiUser, FiClock, FiCheck } from 'react-icons/fi';
import { getPusher } from '../socket';

const NegotiationChat = ({ inquiryId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  useEffect(() => {
    // 1. Initial Fetch of History
    fetchMessages();

    // 2. Connect Pusher and Subscribe to Room
    const pusher = getPusher();
    const room = `inquiry_${inquiryId}`;
    const channel = pusher.subscribe(room);

    // 3. Listen for Incoming Messages
    channel.bind('receive_message', (data) => {
      setMessages(prev => {
        // Avoid duplicates if the sender's own emit somehow comes back
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(room);
    };
  }, [inquiryId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/api/inquiries/${inquiryId}/chat`);
      setMessages(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const msgText = newMessage.trim();
    setNewMessage(''); // optimistic clear
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/inquiries/${inquiryId}/chat`, {
        message: msgText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // optionally restore the text block
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12 bg-slate-50 rounded-3xl h-[400px]">
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-3xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <FiUser size={20} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Negotiation Room</h4>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4">
              <FiSend size={24} />
            </div>
            <p className="text-slate-400 text-sm">No messages yet. Send a message to start negotiating price and terms.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div 
                key={msg.id || idx} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                  isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    <FiClock size={10} />
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && <FiCheck size={10} className="ml-1" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Talk about price, delivery, samples..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-1 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md shadow-indigo-100"
          >
            <FiSend size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default NegotiationChat;
