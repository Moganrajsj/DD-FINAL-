import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Suppliers from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostProduct from './pages/PostProduct';
import BuyRequirements from './pages/BuyRequirements';
import TradeLeads from './pages/TradeLeads';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import RegisterCompany from './pages/RegisterCompany';
import SellerDashboard from './pages/SellerDashboard';
import SellerReports from './pages/SellerReports';
import Payment from './pages/Payment';
import OrderHistory from './pages/OrderHistory';
import UserProfile from './pages/UserProfile';
import OrderTracking from './pages/OrderTracking';
import ContactUs from './pages/ContactUs';
import SubscriptionPlans from './pages/SubscriptionPlans';
import OrderPlaced from './pages/OrderPlaced';
import MyInquiries from './pages/MyInquiries';
import CompareProducts from './pages/CompareProducts';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CompanyRegistrationPrompt from './components/CompanyRegistrationPrompt';
import CompareDrawer from './components/CompareDrawer';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return (
    <div className="App">
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/suppliers/:id" element={<SupplierDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/post-product" element={<PostProduct />} />
        <Route path="/seller" element={<Navigate to="/seller-dashboard" replace />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/seller-reports" element={<SellerReports />} />
        <Route path="/buy-requirements" element={<BuyRequirements />} />
        <Route path="/trade-leads" element={<TradeLeads />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/orders/:id/tracking" element={<OrderTracking />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/subscription-plans" element={<SubscriptionPlans />} />
        <Route path="/order-placed" element={<OrderPlaced />} />
        <Route path="/my-inquiries" element={<MyInquiries />} />
        <Route path="/compare" element={<CompareProducts />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <Chatbot />}
      {!isAdminRoute && <WhatsAppButton />}
      {!isAdminRoute && <CompanyRegistrationPrompt />}
      {!isAdminRoute && <CompareDrawer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

