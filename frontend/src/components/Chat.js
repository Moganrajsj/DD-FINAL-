import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiSend, FiX, FiMessageCircle } from 'react-icons/fi';

function Chat({ productId, orderId, sellerId, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      fetchConversations(parsedUser.id);
      
      if (sellerId && sellerId !== parsedUser.id) {
        setSelectedConversation({ user_id: sellerId });
        fetchMessages(parsedUser.id, sellerId, productId);
      }
    }
  }, [productId, orderId, sellerId]);

  useEffect(() => {
    if (selectedConversation && user) {
      const interval = setInterval(() => {
        fetchMessages(user.id, selectedConversation.user_id, productId);
      }, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [selectedConversation, user, productId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async (userId) => {
    try {
      const response = await axios.get(`/api/chat/conversations?user_id=${userId}`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (senderId, receiverId, prodId = null) => {
    try {
      const params = new URLSearchParams({
        sender_id: senderId,
        receiver_id: receiverId
      });
      if (prodId) params.append('product_id', prodId);
      
      const response = await axios.get(`/api/chat/messages?${params.toString()}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      await axios.post('/api/chat/messages', {
        sender_id: user.id,
        receiver_id: selectedConversation.user_id,
        message: newMessage,
        product_id: productId || null,
        order_id: orderId || null
      });
      
      setNewMessage('');
      fetchMessages(user.id, selectedConversation.user_id, productId);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const selectConversation = (conv) => {
    setSelectedConversation(conv);
    if (user) {
      fetchMessages(user.id, conv.user_id, productId);
    }
  };

  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex items-center justify-center">
        <p className="text-gray-600">Please login to use chat</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-purple to-accent-pink text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiMessageCircle />
          <h3 className="font-semibold">Messages</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <FiX />
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No conversations</div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 ${
                    selectedConversation?.user_id === conv.user_id ? 'bg-accent-purple/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white text-xs font-bold">
                      {conv.user_avatar ? (
                        <img src={conv.user_avatar} alt={conv.user_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span>{conv.user_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{conv.user_name}</p>
                      <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-accent-pink text-white text-xs rounded-full px-2 py-1">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <p className="font-semibold text-gray-800">{selectedConversation.user_name || 'User'}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender_id === user.id
                            ? 'bg-accent-purple text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-white/70' : 'text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <FiSend />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;

