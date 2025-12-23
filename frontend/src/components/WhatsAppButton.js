import React from 'react';
import { FiMessageCircle } from 'react-icons/fi';

function WhatsAppButton() {
  const handleClick = () => {
    window.open('https://wa.me/+918925217669?text=', '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-40 rounded-full px-5 py-3 shadow-lg bg-[#25D366] text-white hover:opacity-90 transition-opacity flex items-center gap-2 font-semibold"
      aria-label="Chat on WhatsApp"
    >
      <FiMessageCircle size={22} />
      <span>Whatsapp Us!</span>
    </button>
  );
}

export default WhatsAppButton;




