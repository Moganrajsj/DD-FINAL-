import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone } from 'react-icons/fi';

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
              <li>
                <Link to="/contact-us" className="text-dark-muted hover:text-accent-blue transition-colors text-sm">
                  Contact Us
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



