import React, { useState } from 'react';
import { FiMessageCircle, FiX, FiSend, FiSearch, FiHelpCircle } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: "HI! 👋\n\nI'm your AI Agent. How can I help you today?\n\nI can assist you with:\n• Finding products\n• Registering your company\n• Posting products\n• Understanding subscriptions\n• Seller Dashboard queries\n\nJust ask me anything!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage({ from: 'user', text: trimmed });
    setInput('');
    await handleBotResponse(trimmed);
  };

  const handleBotResponse = async (text) => {
    setIsProcessing(true);
    const lower = text.toLowerCase().trim();

    try {
      // Handle greetings first
      const greetings = ['hi', 'hello', 'hey', 'hai', 'hii', 'hola', 'namaste', 'good morning', 'good afternoon', 'good evening'];
      const isGreeting = greetings.some(greeting => lower === greeting || lower.startsWith(greeting + ' ') || lower === greeting + '!');
      
      if (isGreeting) {
        addMessage({
          from: 'bot',
          text: "HI! How can I help you today?\n\nI can assist you with:\n- Finding products\n- Registering your company\n- Posting products\n- Understanding subscriptions\n- Seller Dashboard queries\n\nWhat would you like to know?"
        });
        return;
      }

      // Quick navigation intents
      if (lower.includes('register') && (lower.includes('company') || lower.includes('business'))) {
        addMessage({
          from: 'bot',
          text:
            "To register your company:\n\n" +
            "1. Login to your account\n" +
            "2. Go to the Dashboard\n" +
            "3. Click \"Add Your Business\" and fill the form (including GST number)\n" +
            "4. Wait for admin verification, then you can start posting products.\n\n" +
            "I can take you there now. Click the button below."
        });
        addMessage({
          from: 'bot',
          action: {
            label: 'Go to Register Company',
            onClick: () => navigate('/register-company')
          }
        });
        return;
      }

      if (lower.includes('post product') || lower.includes('post products') || lower.includes('add product') || lower.includes('create product')) {
        addMessage({
          from: 'bot',
          text:
            "To post products:\n\n" +
            "1. Login and register your company\n" +
            "2. Wait for admin to verify your company\n" +
            "3. After verification, go to \"Post a Product\" page or use the \"Seller Dashboard\"\n" +
            "4. Fill in product details including name, description, price, category, and upload an image\n" +
            "5. Submit and your product will be live on the marketplace!"
        });
        addMessage({
          from: 'bot',
          action: {
            label: 'Go to Post Product',
            onClick: () => navigate('/post-product')
          }
        });
        return;
      }

      if (lower.includes('seller dashboard')) {
        addMessage({
          from: 'bot',
          text:
            "The Seller Dashboard shows your inquiries, orders, and revenue.\n" +
            "You can also update order status and post new products from there."
        });
        addMessage({
          from: 'bot',
          action: {
            label: 'Go to Seller Dashboard',
            onClick: () => navigate('/seller-dashboard')
          }
        });
        return;
      }

      if (
        lower.includes('phone') ||
        lower.includes('subscription') ||
        lower.includes('view number') ||
        lower.includes('contact supplier') ||
        lower.includes('supplier contact')
      ) {
        addMessage({
          from: 'bot',
          text:
            "To view supplier phone numbers, you need an active subscription.\n\n" +
            "Here's how it works:\n" +
            "1. Click \"View Phone Number\" on any product\n" +
            "2. A subscription popup will appear\n" +
            "3. Choose and activate a subscription plan\n" +
            "4. Once activated, you can view phone numbers for all products on the site\n\n" +
            "This helps you directly contact suppliers and negotiate deals!"
        });
        return;
      }

      // Handle product search queries
      if (lower.includes('find') || lower.includes('search') || lower.includes('looking for') || lower.includes('need') || lower.includes('want to buy')) {
        let query = text;
        // Extract the search term
        if (lower.startsWith('find ')) {
          query = text.substring(5);
        } else if (lower.startsWith('search for ')) {
          query = text.substring(11);
        } else if (lower.includes('looking for')) {
          const match = text.match(/looking for (.+)/i);
          query = match ? match[1] : text;
        } else if (lower.includes('need')) {
          const match = text.match(/need (.+)/i);
          query = match ? match[1] : text;
        } else if (lower.includes('want to buy')) {
          const match = text.match(/want to buy (.+)/i);
          query = match ? match[1] : text;
        }

        addMessage({
          from: 'bot',
          text: `Let me search for products matching: "${query}"...`
        });

        try {
          const resp = await axios.get(
            `/api/products?search=${encodeURIComponent(query)}&limit=5`
          );
          const products = Array.isArray(resp.data) ? resp.data : [];

          if (products.length === 0) {
            addMessage({
              from: 'bot',
              text:
                `I couldn't find any products matching "${query}" right now.\n\n` +
                "Try:\n- Using different keywords\n- Checking the Products page to browse all items\n- Contacting us if you need specific products"
            });
            addMessage({
              from: 'bot',
              action: {
                label: 'Browse All Products',
                onClick: () => navigate('/products')
              }
            });
            return;
          }

          const lines = products
            .map(
              (p, idx) =>
                `${idx + 1}. ${p.name} — ${p.company_name || 'Supplier'} (${p.location || 'India'})`
            )
            .join('\n');

          addMessage({
            from: 'bot',
            text:
              `Here are ${products.length} products I found for "${query}":\n\n` +
              lines +
              "\n\nClick below to see all matching results and more details."
          });
          addMessage({
            from: 'bot',
            action: {
              label: 'View All Results',
              onClick: () => navigate(`/products?search=${encodeURIComponent(query)}`)
            }
          });
          return;
        } catch (err) {
          console.error('Chatbot search error', err);
          addMessage({
            from: 'bot',
            text: 'Sorry, something went wrong while searching. Please try again in a moment or visit the Products page directly.'
          });
          return;
        }
      }

      // Handle general product queries
      if (lower.includes('product') || lower.includes('item') || lower.includes('goods')) {

        addMessage({
          from: 'bot',
          text:
            "I can help you find products on our B2B marketplace!\n\n" +
            "You can:\n" +
            "- Search for specific products (e.g., \"Find cotton t-shirts\")\n" +
            "- Browse all products on the Products page\n" +
            "- View supplier details and contact them\n\n" +
            "What product are you looking for?"
        });
        addMessage({
          from: 'bot',
          action: {
            label: 'Browse Products',
            onClick: () => navigate('/products')
          }
        });
        return;
      }

      // Handle help queries
      if (lower.includes('help') || lower.includes('what can you do') || lower.includes('what do you do')) {
        addMessage({
          from: 'bot',
          text:
            "I'm your AI Agent! I can help you with:\n\n" +
            "🔍 **Finding Products**\n" +
            "   - Search for specific products\n" +
            "   - Browse by category\n\n" +
            "🏢 **Company Registration**\n" +
            "   - Register your business\n" +
            "   - Get verified to start selling\n\n" +
            "📦 **Posting Products**\n" +
            "   - Add your products to the marketplace\n" +
            "   - Manage your listings\n\n" +
            "💼 **Seller Dashboard**\n" +
            "   - View inquiries and orders\n" +
            "   - Track your sales\n\n" +
            "📞 **Subscriptions**\n" +
            "   - Learn about viewing supplier contacts\n\n" +
            "Just ask me anything, and I'll help you!"
        });
        return;
      }

      // Handle thank you
      if (lower.includes('thank') || lower.includes('thanks') || lower.includes('thx')) {
        addMessage({
          from: 'bot',
          text: "You're welcome! 😊\n\nIs there anything else I can help you with?"
        });
        return;
      }

      // Fallback - try to understand the query better
      if (lower.length > 2) {
        // Try to search if it seems like a product query
        addMessage({
          from: 'bot',
          text: `Let me help you with that. Searching for "${text}"...`
        });

        try {
          const resp = await axios.get(
            `/api/products?search=${encodeURIComponent(text)}&limit=3`
          );
          const products = Array.isArray(resp.data) ? resp.data : [];

          if (products.length > 0) {
            const lines = products
              .map((p, idx) => `${idx + 1}. ${p.name} — ${p.company_name || 'Supplier'}`)
              .join('\n');

            addMessage({
              from: 'bot',
              text: `I found some related products:\n\n${lines}\n\nWould you like to see more?`
            });
            addMessage({
              from: 'bot',
              action: {
                label: 'View Products',
                onClick: () => navigate(`/products?search=${encodeURIComponent(text)}`)
              }
            });
            return;
          }
        } catch (err) {
          console.error('Chatbot search error', err);
        }
      }

      // Final fallback
      addMessage({
        from: 'bot',
        text:
          "I'm not sure I understood that completely. 😅\n\n" +
          "Here are some things I can help with:\n" +
          "• \"Find [product name]\" - Search for products\n" +
          "• \"How to register company?\" - Company registration\n" +
          "• \"How to post products?\" - Posting products\n" +
          "• \"What is Seller Dashboard?\" - Dashboard info\n" +
          "• \"Help\" - See all my capabilities\n\n" +
          "Feel free to ask me anything else!"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMessage = (msg, index) => {
    const isBot = msg.from === 'bot';

    return (
      <div
        key={index}
        className={`mb-3 flex ${isBot ? 'justify-start' : 'justify-end'}`}
      >
        <div
          className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-line ${
            isBot
              ? 'bg-gray-50 border border-gray-200 text-dark-text'
              : 'bg-gradient-to-r from-accent-purple to-accent-pink text-white'
          }`}
        >
          {isBot && (
            <div className="flex items-center gap-1 mb-1 text-xs text-dark-muted">
              <FiHelpCircle className="text-accent-purple" />
              <span>AI Agent</span>
            </div>
          )}
          <div>{msg.text}</div>
          {msg.action && (
            <button
              type="button"
              onClick={msg.action.onClick}
              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <FiSearch size={14} />
              <span>{msg.action.label}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 rounded-full px-5 py-3 shadow-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:opacity-90 transition-opacity flex items-center gap-2 ${
          isOpen ? 'hidden' : ''
        }`}
      >
        <FiMessageCircle size={22} />
        <span className="font-semibold text-sm">AI Agent</span>
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-full max-w-sm">
          <div className="glass-effect rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col h-[460px]">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <div className="text-sm font-semibold text-dark-text">
                  AI Agent
                </div>
                <div className="text-xs text-green-400">Online • Smart Help</div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-dark-muted hover:text-dark-text transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 px-3 py-3 overflow-y-auto bg-white">
              {messages.map((m, idx) => renderMessage(m, idx))}
              {isProcessing && (
                <div className="text-xs text-dark-muted px-2 py-1">Thinking...</div>
              )}
            </div>

            <form
              onSubmit={handleSend}
              className="px-3 py-2 border-t border-gray-200 bg-gray-50 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about products or selling..."
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-dark-text text-sm placeholder-dark-muted focus:border-accent-purple focus:outline-none"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="p-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <FiSend size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;



