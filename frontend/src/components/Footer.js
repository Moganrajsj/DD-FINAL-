import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiMail, FiPhone, FiMapPin, FiMap } from 'react-icons/fi';

function Footer() {
  return (
    <footer className="glass-effect border-t border-dark-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl mb-4" style={{ fontWeight: 900 }}>
              <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent" style={{ fontWeight: 900 }}>DealsDouble</span>
              <span className="bg-gradient-to-r from-accent-pink to-accent-pink bg-clip-text text-transparent" style={{ fontWeight: 900 }}>.AI</span>
            </h3>
            <p className="text-dark-muted text-sm mb-4">
              Tech DLT Software Services, established in 2025, is a B2B company built to modernize and simplify business
              transactions between manufacturers, suppliers, and enterprise buyers. The company offers a digital platform
              designed to streamline product listing, sourcing, lead generation, and vendor management. With a strong
              focus on AI-driven tools, automation, and data-driven insights, it enables businesses to reduce manual work,
              increase visibility, and improve operational efficiency. Its mission is to create a transparent, efficient,
              and reliable B2B ecosystem that supports businesses of all sizes in scaling their operations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-dark-text mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-dark-muted hover:text-accent-blue transition-colors text-sm">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/suppliers" className="text-dark-muted hover:text-accent-blue transition-colors text-sm">
                  Suppliers
                </Link>
              </li>
              <li>
                <Link to="/buy-requirements" className="text-dark-muted hover:text-accent-blue transition-colors text-sm">
                  Buy Requirements
                </Link>
              </li>
              <li>
                <Link to="/trade-leads" className="text-dark-muted hover:text-accent-blue transition-colors text-sm">
                  Trade Leads
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Address */}
          <div>
            <h4 className="text-lg font-semibold text-dark-text mb-4">Contact Us</h4>
            <ul className="space-y-3 mb-4">
              <li>
                <a href="mailto:support@dealsdouble.ai" className="text-dark-muted hover:text-accent-blue transition-colors text-sm flex items-center gap-2">
                  <FiMail size={14} />
                  support@dealsdouble.ai
                </a>
              </li>
              <li>
                <a href="tel:+919952449499" className="text-dark-muted hover:text-accent-blue transition-colors text-sm flex items-center gap-2">
                  <FiPhone size={14} />
                  INDIA: +91-99524 49499
                </a>
              </li>
              <li>
                <a href="tel:+85262645265" className="text-dark-muted hover:text-accent-blue transition-colors text-sm flex items-center gap-2">
                  <FiPhone size={14} />
                  HONG KONG: +852-62645265
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Our Locations */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-dark-text mb-4">Our Locations</h3>
          <p className="text-gray-600 mb-6">
            We operate from Chennai-IN, Hong Kong, Dharmapuri-TN and Hosur, offering a range of tech solutions for various industries.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Head Office */}
            <div className="glass-effect rounded-xl p-6">
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
            <div className="glass-effect rounded-xl p-6">
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
            <div className="glass-effect rounded-xl p-6">
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

        <div className="border-t border-dark-border mt-8 pt-6 text-center">
          <p className="text-dark-muted text-sm">
            © {new Date().getFullYear()} DealsDouble.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;



