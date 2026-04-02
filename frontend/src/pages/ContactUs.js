import React from 'react';
import { FiMail, FiPhone, FiMap } from 'react-icons/fi';

function ContactUs() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-4 text-dark-text animate-slide-down">Contact Us</h1>
          <p className="text-dark-muted text-lg animate-slide-down" style={{ animationDelay: '0.1s' }}>
            Get in touch with us - we're here to help
          </p>
        </div>

        {/* Contact Information */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-effect rounded-xl p-6 text-center hover-lift">
              <FiMail className="mx-auto mb-4 text-accent-purple" size={32} />
              <h3 className="text-lg font-semibold text-dark-text mb-2">Email Us</h3>
              <a 
                href="mailto:support@dealsdouble.ai" 
                className="text-accent-blue hover:text-accent-purple transition-colors text-sm"
              >
                support@dealsdouble.ai
              </a>
            </div>
            <div className="glass-effect rounded-xl p-6 text-center hover-lift">
              <FiPhone className="mx-auto mb-4 text-accent-purple" size={32} />
              <h3 className="text-lg font-semibold text-dark-text mb-2">Call Us (India)</h3>
              <a 
                href="tel:+919952449499" 
                className="text-accent-blue hover:text-accent-purple transition-colors text-sm"
              >
                +91-99524 49499
              </a>
            </div>
            <div className="glass-effect rounded-xl p-6 text-center hover-lift">
              <FiPhone className="mx-auto mb-4 text-accent-purple" size={32} />
              <h3 className="text-lg font-semibold text-dark-text mb-2">Call Us (Hong Kong)</h3>
              <a 
                href="tel:+85262645265" 
                className="text-accent-blue hover:text-accent-purple transition-colors text-sm"
              >
                +852-62645265
              </a>
            </div>
          </div>
        </div>

        {/* Our Locations */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-dark-text mb-4">Our Locations</h2>
          <p className="text-gray-600 mb-6">
            We operate from Chennai-IN, Hong Kong, Dharmapuri-TN and Hosur, offering a range of tech solutions for various industries.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Head Office */}
            <div className="glass-effect rounded-xl p-6 hover-lift">
              <h4 className="text-lg font-bold text-dark-text mb-3">Head Office</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Suite 19, No 102, Concord Building,<br />
                Mong Kok,<br />
                Hong Kong (SAR-China)
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Concord+Building+Mong+Kok+Hong+Kong"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-accent-purple hover:text-accent-pink text-sm font-semibold transition-colors"
              >
                <FiMap size={14} />
                View on Map
              </a>
            </div>

            {/* Marketing Office */}
            <div className="glass-effect rounded-xl p-6 hover-lift">
              <h4 className="text-lg font-bold text-dark-text mb-3">Marketing Office</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Block A, Olympia Tech Park,<br />
                Guindy, Chennai-TamilNadu-India
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Olympia+Tech+Park+Guindy+Chennai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-accent-purple hover:text-accent-pink text-sm font-semibold transition-colors"
              >
                <FiMap size={14} />
                View on Map
              </a>
            </div>

            {/* Register Office */}
            <div className="glass-effect rounded-xl p-6 hover-lift">
              <h4 className="text-lg font-bold text-dark-text mb-3">Register Office</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                No.3/291d, Cabin No.2, DNG Complex<br />
                Gundalpatti, Dharmapuri,<br />
                Tamil Nadu - 636 701
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Gundalpatti+Dharmapuri+Tamil+Nadu+636701"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-accent-purple hover:text-accent-pink text-sm font-semibold transition-colors"
              >
                <FiMap size={14} />
                View on Map
              </a>
            </div>
          </div>

          {/* Google Maps Embed - Head Office */}
          <div>
            <h4 className="text-lg font-semibold text-dark-text mb-4">Find Us</h4>
            <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3691.1234567890123!2d114.1725!3d22.3193!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x340400c2df4d242d%3A0x1234567890abcdef!2sConcord%20Building%2C%20Mong%20Kok%2C%20Hong%20Kong!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Tech DLT Software Services - Head Office, Hong Kong"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;

