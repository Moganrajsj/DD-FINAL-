import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPackage, FiUsers, FiFileText, FiTrendingUp, FiShield, FiSettings, FiDollarSign, FiShoppingCart, FiBarChart2, FiPieChart, FiTrash2, FiX, FiCheck, FiHome, FiActivity, FiClipboard, FiGrid, FiDownload, FiStar, FiZap, FiChevronRight } from 'react-icons/fi';
import LiveMarketplaceInsights from '../components/LiveMarketplaceInsights';
import { getPusher } from '../socket';

function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'product' | 'company', id: number, name: string }
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'analytics', 'pending', 'products', 'companies', 'matches'
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [buyerManagers, setBuyerManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [realtimeInsights, setRealtimeInsights] = useState(null);
  const [loadingRealtimeInsights, setLoadingRealtimeInsights] = useState(false);
  const [tradeLeads, setTradeLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [newLead, setNewLead] = useState({
    title: '', description: '', type: 'buy', category: 'Industrial Supplies', 
    location: '', contact_name: '', contact_email: '', contact_phone: '', price: 500
  });

  useEffect(() => {
    // Check if user is admin by verifying with backend
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/admin/login');
      return;
    }

    // Parse user data
    let user;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user data:', e);
      navigate('/admin/login');
      return;
    }

    // Verify admin status with backend
    const verifyAdmin = async () => {
      try {
        const response = await axios.get('/api/auth/check-admin', {
          headers: { Authorization: `Bearer ${token}` },
          params: { user_id: user.id }
        });
        
        if (response.data.is_admin) {
          setIsAdmin(true);
          fetchAdminData();
          fetchAnalytics();
          fetchRealtimeInsights();
          fetchPendingCompanies();
          fetchPendingProducts();
        } else {
          // Not an admin, redirect to login
          localStorage.removeItem('admin_access');
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Error verifying admin status:', error);
        // If verification fails, redirect to login
        localStorage.removeItem('admin_access');
        navigate('/admin/login');
      }
    };

    verifyAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const fetchAdminData = async () => {
    try {
      const [statsRes, productsRes, suppliersRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/products?limit=10'),
        axios.get('/api/suppliers')
      ]);
      
      // Ensure we have arrays
      const recentProducts = Array.isArray(productsRes.data) ? productsRes.data.slice(0, 5) : [];
      const suppliersList = Array.isArray(suppliersRes.data) ? suppliersRes.data.slice(0, 5) : [];
      
      setStats({
        ...statsRes.data,
        recentProducts: recentProducts,
        suppliersList: suppliersList  // Use different name to avoid conflict with stats.suppliers (count)
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setStats({
        products: 0,
        suppliers: 0,
        categories: 0,
        users: 0,
        recentProducts: [],
        suppliersList: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Try advanced analytics first, fallback to regular analytics
      try {
        const response = await axios.get('/api/admin/advanced-analytics', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-User-Id': user?.id
          },
          params: { user_id: user?.id, days: 30 }
        });
        setAnalytics(response.data);
      } catch (advancedError) {
        // Fallback to regular analytics
        const response = await axios.get('/api/admin/analytics', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-User-Id': user?.id
          },
          params: { user_id: user?.id }
        });
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/login');
      }
      setAnalytics(null);
    }
  };

  const fetchRealtimeInsights = async () => {
    setLoadingRealtimeInsights(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const response = await axios.get('/api/admin/realtime-analytics', {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        },
        params: { user_id: user?.id, days: 30 }
      });
      setRealtimeInsights(response.data);
    } catch (error) {
      console.error('Error fetching realtime analytics:', error);
      setRealtimeInsights(null);
    } finally {
      setLoadingRealtimeInsights(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return undefined;

    const pusher = getPusher();
    const channel = pusher.subscribe('admin_dashboard');

    const handleDashboardUpdate = () => {
      fetchAdminData();
      fetchAnalytics();
      fetchRealtimeInsights();
    };

    channel.bind('dashboard_update', handleDashboardUpdate);

    return () => {
      channel.unbind('dashboard_update', handleDashboardUpdate);
      pusher.unsubscribe('admin_dashboard');
    };
  }, [isAdmin]);

  const fetchPendingCompanies = async () => {
    try {
      const response = await axios.get('/api/companies/pending');
      // Ensure we have an array
      if (Array.isArray(response.data)) {
        setPendingCompanies(response.data);
      } else {
        setPendingCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching pending companies:', error);
      setPendingCompanies([]);
    }
  };

  const fetchPendingProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await axios.get('/api/admin/products/pending', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        },
        params: { user_id: user?.id }
      });
      // Ensure we have an array
      if (Array.isArray(response.data)) {
        setPendingProducts(response.data);
      } else {
        setPendingProducts([]);
      }
    } catch (error) {
      console.error('Error fetching pending products:', error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/login');
      }
      setPendingProducts([]);
    }
  };

  const fetchAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await axios.get('/api/products', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        },
        params: { 
          user_id: user?.id,
          limit: 1000 // Get a large number of products
        }
      });
      
      if (Array.isArray(response.data)) {
        setAllProducts(response.data);
        setShowAllProducts(true);
      } else {
        setAllProducts([]);
      }
    } catch (error) {
      console.error('Error fetching all products:', error);
      setAllProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchAllCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await axios.get('/api/suppliers', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        },
        params: { user_id: user?.id }
      });
      
      if (Array.isArray(response.data)) {
        setAllCompanies(response.data);
        setShowAllCompanies(true);
      } else {
        setAllCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching all companies:', error);
      setAllCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await axios.get('/api/admin/users', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        },
        params: { user_id: user?.id }
      });
      
      if (Array.isArray(response.data)) {
        setAllUsers(response.data);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate('/admin/login');
      }
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchBuyerManagers = async () => {
    setLoadingManagers(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const response = await axios.get('/api/admin/buyer-managers', {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': user?.id }
      });
      setBuyerManagers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching buyer managers:', error);
    } finally {
      setLoadingManagers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matches') {
      fetchAdminInquiries();
    }
  }, [activeTab]);

  const fetchAdminInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const response = await axios.get('/api/admin/inquiries', {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': user?.id }
      });
      setInquiries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching admin inquiries:', error);
    } finally {
      setLoadingInquiries(false);
    }
  };

  const handleToggleManager = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      await axios.post(`/api/admin/users/${userId}/toggle-manager`, { admin_id: user?.id }, {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': user?.id }
      });
      fetchAllUsers();
      fetchBuyerManagers();
    } catch (error) {
      console.error('Error toggling manager status:', error);
      alert('Failed to update user role.');
    }
  };

  const handleAssignManager = async (inquiryId, managerId) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      await axios.post('/api/admin/assign-manager', { inquiry_id: inquiryId, manager_id: managerId }, {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': user?.id }
      });
      fetchAdminInquiries();
      alert('Manager assigned successfully');
    } catch (error) {
      console.error('Error assigning manager:', error);
      alert('Failed to assign manager.');
    }
  };

  const fetchTradeLeads = async () => {
    setLoadingLeads(true);
    try {
      const response = await axios.get('/api/trade-leads');
      setTradeLeads(response.data);
    } catch (error) {
      console.error('Error fetching trade leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleUpdateSubscription = async (userId, tier) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${userId}/subscription`, { tier }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`User updated to ${tier} successfully`);
      fetchAllUsers();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      await axios.post('/api/admin/leads', { ...newLead, user_id: user?.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Trade lead created and broadcasted successfully!');
      setNewLead({
        title: '', description: '', type: 'buy', category: 'Industrial Supplies', 
        location: '', contact_name: '', contact_email: '', contact_phone: '', price: 500
      });
      fetchTradeLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTradeLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleViewMatches = async (inq) => {
    setSelectedInquiry(inq);
    setLoadingMatches(true);
    setMatches([]); // Clear previous
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Try to get matches
      let response = await axios.get(`/api/admin/inquiries/${inq.id}/matches`, {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': user?.id }
      });
      
      if (response.data.length === 0) {
        // Trigger matching if no results
        await axios.post(`/api/admin/inquiries/${inq.id}/match`, { user_id: user?.id }, {
          headers: { Authorization: `Bearer ${token}`, 'X-User-Id': user?.id }
        });
        // Fetch again
        response = await axios.get(`/api/admin/inquiries/${inq.id}/matches`, {
          headers: { Authorization: `Bearer ${token}`, 'X-User-Id': user?.id }
        });
      }
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleExportSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User information not found. Please log in again.');
        navigate('/admin/login');
        return;
      }
      
      // Create a download link
      const response = await axios.get('/api/admin/suppliers/export-excel', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.id
        },
        params: { user_id: user.id },
        responseType: 'blob' // Important for file download
      });
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'suppliers_export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting suppliers:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to export suppliers. Please try again.';
      alert(`Error: ${errorMessage}`);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/login');
      }
    }
  };

  const handleExportProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User information not found. Please log in again.');
        navigate('/admin/login');
        return;
      }
      
      // Create a download link
      const response = await axios.get('/api/admin/products/export-excel', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.id
        },
        params: { user_id: user.id },
        responseType: 'blob' // Important for file download
      });
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'products_export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting products:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to export products. Please try again.';
      alert(`Error: ${errorMessage}`);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/login');
      }
    }
  };

  const handleVerifyCompany = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User information not found. Please log in again.');
        return;
      }
      
      await axios.post(`/api/companies/verify/${companyId}`, { user_id: user.id }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.id
        },
        params: { user_id: user.id }
      });
      alert('Company verified successfully!');
      fetchPendingCompanies();
      // Refresh admin data
      fetchAdminData();
      // Refresh companies list if on companies tab
      if (activeTab === 'companies') {
        fetchAllCompanies();
      }
    } catch (error) {
      console.error('Error verifying company:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to verify company. Please try again.';
      alert(`Error: ${errorMessage}`);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/login');
      }
    }
  };

  const handleUnverifyCompany = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User information not found. Please log in again.');
        return;
      }
      
      await axios.post(`/api/companies/unverify/${companyId}`, { user_id: user.id }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.id
        },
        params: { user_id: user.id }
      });
      alert('Company unverified successfully!');
      fetchPendingCompanies();
      // Refresh admin data
      fetchAdminData();
      // Refresh companies list if on companies tab
      if (activeTab === 'companies') {
        fetchAllCompanies();
      }
    } catch (error) {
      console.error('Error unverifying company:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to unverify company. Please try again.';
      alert(`Error: ${errorMessage}`);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/login');
      }
    }
  };

  const handleToggleBestSeller = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User information not found. Please log in again.');
        return;
      }
      
      const response = await axios.post(`/api/admin/companies/${companyId}/toggle-best-seller`, { user_id: user.id }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.id
        },
        params: { user_id: user.id }
      });
      alert(response.data.message || 'Best seller status updated successfully!');
      fetchPendingCompanies();
      // Refresh admin data
      fetchAdminData();
      // Refresh companies list if on companies tab
      if (activeTab === 'companies') {
        fetchAllCompanies();
      }
    } catch (error) {
      console.error('Error toggling best seller:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update best seller status. Please try again.';
      alert(`Error: ${errorMessage}`);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/login');
      }
    }
  };

  const handleApproveAllCompanies = async () => {
    if (pendingCompanies.length === 0) {
      alert('No pending companies to approve.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to approve all ${pendingCompanies.length} pending company(ies)?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User information not found. Please log in again.');
        return;
      }
      
      const response = await axios.post('/api/admin/companies/approve-all', { user_id: user.id }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.id
        },
        params: { user_id: user.id }
      });
      
      alert(response.data.message || `Successfully approved ${response.data.count} company(ies)!`);
      fetchPendingCompanies();
      fetchAdminData();
      if (activeTab === 'companies') {
        fetchAllCompanies();
      }
    } catch (error) {
      console.error('Error approving all companies:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to approve all companies. Please try again.';
      alert(`Error: ${errorMessage}`);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/login');
      }
    }
  };

  const handleApproveAllProducts = async () => {
    if (pendingProducts.length === 0) {
      alert('No pending products to approve.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to approve all ${pendingProducts.length} pending product(s)?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User information not found. Please log in again.');
        return;
      }
      
      const response = await axios.post('/api/admin/products/approve-all', { user_id: user.id }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.id
        },
        params: { user_id: user.id }
      });
      
      alert(response.data.message || `Successfully approved ${response.data.count} product(s)!`);
      fetchPendingProducts();
      fetchAdminData();
      if (activeTab === 'products') {
        fetchAllProducts();
      }
    } catch (error) {
      console.error('Error approving all products:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to approve all products. Please try again.';
      alert(`Error: ${errorMessage}`);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/login');
      }
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User information not found. Please log in again.');
        return;
      }
      
      await axios.delete(`/api/admin/products/${productId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.id
        },
        params: { user_id: user.id }
      });
      alert('Product deleted successfully!');
      setDeleteConfirm(null);
      fetchAdminData();
      fetchPendingProducts();
      // Refresh products list if on products tab
      if (activeTab === 'products') {
        fetchAllProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to delete product. Please try again.';
      alert(`Error: ${errorMessage}`);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/login');
      }
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      await axios.post(`/api/admin/products/${productId}/approve`, { user_id: user?.id }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        },
        params: { user_id: user?.id }
      });
      alert('Product approved successfully!');
      fetchPendingProducts();
      fetchAdminData();
    } catch (error) {
      console.error('Error approving product:', error);
      alert(error.response?.data?.error || 'Failed to approve product. Please try again.');
    }
  };

  const handleRejectProduct = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      await axios.post(`/api/admin/products/${productId}/reject`, { user_id: user?.id }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user?.id
        },
        params: { user_id: user?.id }
      });
      alert('Product rejected successfully!');
      fetchPendingProducts();
      fetchAdminData();
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert(error.response?.data?.error || 'Failed to reject product. Please try again.');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User information not found. Please log in again.');
        return;
      }
      
      await axios.delete(`/api/admin/companies/${companyId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.id
        },
        params: { user_id: user.id }
      });
      alert('Company and all its products deleted successfully!');
      setDeleteConfirm(null);
      fetchPendingCompanies();
      fetchAdminData();
      // Refresh companies list if on companies tab
      if (activeTab === 'companies') {
        fetchAllCompanies();
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to delete company. Please try again.';
      alert(`Error: ${errorMessage}`);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/admin/login');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-dark-muted animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="glass-effect rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-dark-muted">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-dark-text">Admin Portal</h1>
          <p className="text-dark-muted">Manage your marketplace</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-dark-border">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiHome size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'analytics'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiBarChart2 size={18} />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('companies-pending')}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 relative ${
                activeTab === 'companies-pending'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiShield size={18} />
              Company Approvals
              {pendingCompanies.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingCompanies.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('products-pending')}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 relative ${
                activeTab === 'products-pending'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiPackage size={18} />
              Product Approvals
              {pendingProducts.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'products'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiPackage size={18} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'companies'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiUsers size={18} />
              Companies
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'matches'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiZap size={18} />
              AI RFQ Matches
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                fetchAllUsers();
              }}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'users'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiUsers size={18} />
              Users
            </button>
            <button
              onClick={() => {
                setActiveTab('buyer-managers');
                fetchBuyerManagers();
                fetchAdminInquiries();
              }}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'buyer-managers'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiShield size={18} />
              Buyer Management
            </button>
            <button
              onClick={() => {
                setActiveTab('trade-leads');
                fetchTradeLeads();
              }}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'trade-leads'
                  ? 'border-accent-purple text-accent-purple'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              <FiActivity size={18} />
              Trade Leads
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                <FiPackage className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{stats?.products || 0}</h3>
            <p className="text-dark-muted">Total Products</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center">
                <FiUsers className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{stats?.suppliers || 0}</h3>
            <p className="text-dark-muted">Total Suppliers</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center">
                <FiFileText className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{stats?.categories || 0}</h3>
            <p className="text-dark-muted">Categories</p>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-orange to-yellow-500 flex items-center justify-center">
                <FiTrendingUp className="text-white text-xl" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-dark-text mb-1">{stats?.users || 0}</h3>
            <p className="text-dark-muted">Registered Users</p>
          </div>
        </div>

            {/* Quick Analytics Summary */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <FiShoppingCart className="text-white text-xl" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-dark-text mb-1">{analytics.total_orders || 0}</h3>
                  <p className="text-dark-muted">Total Orders</p>
                  <p className="text-sm text-accent-green mt-2">+{analytics.recent_orders_30d || 0} in last 30 days</p>
                </div>

                <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <FiDollarSign className="text-white text-xl" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-dark-text mb-1">₹{(analytics.total_revenue || 0).toLocaleString('en-IN')}</h3>
                  <p className="text-dark-muted">Total Revenue</p>
                  <p className="text-sm text-accent-orange mt-2">From completed orders</p>
                </div>

                <div className="glass-effect rounded-xl p-6 hover:glow-effect transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <FiBarChart2 className="text-white text-xl" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-dark-text mb-1">
                    ₹{analytics.total_orders > 0 ? ((analytics.total_revenue || 0) / analytics.total_orders).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
                  </h3>
                  <p className="text-dark-muted">Average Order Value</p>
                  <p className="text-sm text-accent-blue mt-2">Per order</p>
                </div>
              </div>
            )}

            <LiveMarketplaceInsights data={realtimeInsights} loading={loadingRealtimeInsights} />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="glass-effect rounded-xl p-6 border-2 border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-dark-text">Pending Actions</h3>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-600 text-sm rounded font-semibold">
                    {pendingCompanies.length + pendingProducts.length}
                  </span>
                </div>
                <p className="text-dark-muted mb-4">Items waiting for your approval</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab('companies-pending')}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Companies ({pendingCompanies.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('products-pending')}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Products ({pendingProducts.length})
                  </button>
                </div>
              </div>

              <div className="glass-effect rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-dark-text">View Analytics</h3>
                  <FiActivity className="text-blue-500" size={24} />
                </div>
                <p className="text-dark-muted mb-4">Detailed insights and reports</p>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  View Full Analytics
                </button>
              </div>
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <>

            {/* Revenue Trends - Daily */}
            {analytics.revenue_trends && analytics.revenue_trends.daily && analytics.revenue_trends.daily.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiTrendingUp className="text-accent-purple" />
                  Revenue Trend (Last {analytics.period?.days || 30} Days)
                </h2>
                <div className="mb-4">
                  <p className="text-lg font-bold text-accent-green">
                    Total Revenue: ₹{analytics.revenue_trends.total?.toLocaleString('en-IN') || 0}
                  </p>
                </div>
                <div className="space-y-4">
                  {analytics.revenue_trends.daily.slice(-14).map((item, idx) => {
                    const maxRevenue = Math.max(...analytics.revenue_trends.daily.map(r => r.revenue || 0));
                    const percentage = maxRevenue > 0 ? ((item.revenue || 0) / maxRevenue) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-dark-muted font-medium">{item.date}</div>
                        <div className="flex-1 bg-gray-50 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-purple to-accent-pink rounded-full flex items-center justify-end pr-3 transition-all"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-xs font-semibold">
                              ₹{(item.revenue || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Revenue by Month Chart - Fallback */}
            {analytics.revenue_by_month && analytics.revenue_by_month.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiTrendingUp className="text-accent-purple" />
                  Revenue Trend (Last 6 Months)
                </h2>
                <div className="space-y-4">
                  {analytics.revenue_by_month.map((item, idx) => {
                    const maxRevenue = Math.max(...analytics.revenue_by_month.map(r => r.revenue));
                    const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-dark-muted font-medium">{item.month}</div>
                        <div className="flex-1 bg-gray-50 rounded-full h-8 relative overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent-purple to-accent-pink rounded-full flex items-center justify-end pr-3 transition-all"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-xs font-semibold">
                              ₹{item.revenue.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Products */}
            {analytics.top_products && analytics.top_products.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiPackage className="text-accent-blue" />
                  Top Products
                </h2>
                <div className="space-y-3">
                  {analytics.top_products.map((product, idx) => (
                    <div key={product.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-dark-text">{product.name}</h3>
                          <p className="text-sm text-dark-muted">{product.order_count} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent-orange text-lg">₹{product.revenue.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-dark-muted">Total Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supplier Performance */}
            {analytics.supplier_performance && analytics.supplier_performance.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiUsers className="text-accent-blue" />
                  Top Suppliers
                </h2>
                <div className="space-y-3">
                  {analytics.supplier_performance.map((supplier, idx) => (
                    <div key={supplier.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-dark-text">{supplier.name}</h3>
                          <p className="text-sm text-dark-muted">{supplier.product_count} products, {supplier.order_count} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent-orange text-lg">₹{supplier.revenue.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-dark-muted">Total Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Selling Companies - Fallback */}
            {analytics.top_companies && analytics.top_companies.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiUsers className="text-accent-blue" />
                  Top Selling Companies
                </h2>
                <div className="space-y-3">
                  {analytics.top_companies.map((company, idx) => (
                    <div key={company.id || idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-dark-text">{company.name}</h3>
                          <p className="text-sm text-dark-muted">{company.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent-orange text-lg">₹{company.revenue.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-dark-muted">Total Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Performance */}
            {analytics.category_performance && analytics.category_performance.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiPieChart className="text-accent-green" />
                  Category Performance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.category_performance.map((category, idx) => {
                    const maxRevenue = Math.max(...analytics.category_performance.map(c => c.order_count || 0));
                    const percentage = maxRevenue > 0 ? ((category.order_count || 0) / maxRevenue) * 100 : 0;
                    return (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-dark-text mb-2">{category.name}</h3>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-dark-muted">Products: {category.product_count}, Orders: {category.order_count}</span>
                        </div>
                        <div className="w-full bg-dark-bg rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-accent-green to-accent-blue h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category Analysis - Fallback */}
            {analytics.category_analysis && analytics.category_analysis.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiPieChart className="text-accent-green" />
                  Category Performance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.category_analysis.map((category, idx) => (
                    <div key={category.id || idx} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-dark-text mb-2">{category.name}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-dark-muted">Orders: {category.orders}</span>
                        <span className="text-sm font-bold text-accent-orange">₹{category.revenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-dark-bg rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-accent-green to-accent-blue h-2 rounded-full"
                          style={{ width: `${(category.revenue / Math.max(...analytics.category_analysis.map(c => c.revenue))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue Forecast */}
            {analytics.forecast && analytics.forecast.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiTrendingUp className="text-yellow-500" />
                  Revenue Forecast (Next 3 Months)
                </h2>
                <div className="space-y-4">
                  {analytics.forecast.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24 text-sm text-dark-muted font-medium">{item.month}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-dark-text font-semibold">Forecasted Revenue</span>
                          <span className="text-accent-orange font-bold">₹{item.forecasted_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="w-full bg-dark-bg rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                            style={{ width: `${((idx + 1) / analytics.forecast.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders by Status */}
            {analytics.orders_by_status && Object.keys(analytics.orders_by_status).length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-6 flex items-center gap-2">
                  <FiBarChart2 className="text-accent-purple" />
                  Orders by Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(analytics.orders_by_status).map(([status, count]) => (
                    <div key={status} className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-3xl font-bold text-dark-text mb-2">{count}</p>
                      <p className="text-sm text-dark-muted capitalize">{status} Orders</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Analytics Tab - No Data */}
        {activeTab === 'analytics' && !analytics && (
          <div className="glass-effect rounded-xl p-12 text-center">
            <FiBarChart2 className="text-dark-muted mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-dark-text mb-2">No Analytics Data</h3>
            <p className="text-dark-muted">Analytics data will appear here once orders are placed.</p>
          </div>
        )}

        {/* Company Approvals Tab */}
        {activeTab === 'companies-pending' && (
          <>
            {/* Pending Company Verifications */}
            <div className="glass-effect rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark-text">Pending Company Verifications</h2>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded">
                {Array.isArray(pendingCompanies) ? pendingCompanies.length : 0} Pending
              </span>
              {Array.isArray(pendingCompanies) && pendingCompanies.length > 0 && (
                <button
                  onClick={handleApproveAllCompanies}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <FiCheck size={16} />
                  Approve All
                </button>
              )}
            </div>
          </div>
          {!Array.isArray(pendingCompanies) || pendingCompanies.length === 0 ? (
            <p className="text-dark-muted text-center py-8">No pending company verifications</p>
          ) : (
            <div className="space-y-3">
              {pendingCompanies.map((company) => {
                if (!company || typeof company !== 'object') return null;
                return (
                  <div key={company?.id || Math.random()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-text mb-1">{company?.name || 'Unknown Company'}</h3>
                      <p className="text-sm text-dark-muted mb-2">{company?.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-dark-muted">
                        <span>📍 {company?.location || 'N/A'}</span>
                        {company?.website && <span>🌐 {company.website}</span>}
                        {company?.phone && <span>📞 {company.phone}</span>}
                      </div>
                      <p className="text-xs text-dark-muted mt-2">
                        Registered by: {company?.user_name || 'Unknown'} ({company?.user_email || 'N/A'})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => company?.id && handleVerifyCompany(company.id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <FiShield size={14} />
                        Verify
                      </button>
                      <button
                        onClick={() => company?.id && setDeleteConfirm({
                          type: 'company',
                          id: company.id,
                          name: company.name
                        })}
                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 text-sm font-semibold transition-colors flex items-center gap-2"
                      >
                        <FiTrash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </>
        )}

        {/* Product Approvals Tab */}
        {activeTab === 'products-pending' && (
          <>
            {/* Pending Product Approvals */}
            <div className="glass-effect rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-dark-text">Pending Product Approvals</h2>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded">
                    {Array.isArray(pendingProducts) ? pendingProducts.length : 0} Pending
                  </span>
                  {Array.isArray(pendingProducts) && pendingProducts.length > 0 && (
                    <button
                      onClick={handleApproveAllProducts}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <FiCheck size={16} />
                      Approve All
                    </button>
                  )}
                </div>
              </div>
              {!Array.isArray(pendingProducts) || pendingProducts.length === 0 ? (
                <p className="text-dark-muted text-center py-8">No products pending approval</p>
              ) : (
                <div className="space-y-3">
                  {pendingProducts.map((product) => {
                    if (!product || typeof product !== 'object') return null;
                    return (
                      <div key={product?.id || Math.random()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-dark-text mb-1">{product?.name || 'Unknown Product'}</h3>
                          <p className="text-sm text-dark-muted mb-2">{product?.description || 'No description'}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-dark-muted">
                            <span>🏢 {product?.company_name || 'N/A'}</span>
                            <span>📁 {product?.category_name || 'N/A'}</span>
                            {product?.price && <span>💰 ₹{product.price.toLocaleString()}</span>}
                          </div>
                          <p className="text-xs text-dark-muted mt-2">
                            Posted: {product?.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => product?.id && handleApproveProduct(product.id)}
                            className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
                          >
                            <FiCheck size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => product?.id && handleRejectProduct(product.id)}
                            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 text-sm font-semibold transition-colors flex items-center gap-2"
                          >
                            <FiX size={14} />
                            Reject
                          </button>
                          <button
                            onClick={() => product?.id && setDeleteConfirm({
                              type: 'product',
                              id: product.id,
                              name: product.name
                            })}
                            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 text-sm font-semibold transition-colors flex items-center gap-2"
                          >
                            <FiTrash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {/* Recent Products */}
            <div className="glass-effect rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark-text">
              {showAllProducts ? 'All Products' : 'Recent Products'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportProducts}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                title="Export all products to Excel"
              >
                <FiDownload size={16} />
                Export Excel
              </button>
              {showAllProducts && (
                <button
                  onClick={() => setShowAllProducts(false)}
                  className="px-4 py-2 rounded-lg bg-gray-500 text-white text-sm hover:opacity-90 transition-opacity"
                >
                  Show Recent
                </button>
              )}
              <button
                onClick={fetchAllProducts}
                disabled={loadingProducts}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingProducts ? 'Loading...' : showAllProducts ? 'Refresh' : 'View All'}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {(() => {
              const productsToShow = showAllProducts ? allProducts : (stats?.recentProducts || []);
              return productsToShow && Array.isArray(productsToShow) && productsToShow.length > 0 ? (
                productsToShow.map((product) => (
                <div key={product?.id || Math.random()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-dark-text">{product?.name || 'Unknown Product'}</h3>
                    <p className="text-sm text-dark-muted">{product?.company_name || 'N/A'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-bold text-accent-orange">₹{product?.price?.toLocaleString() || 'N/A'}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({
                            type: 'product',
                            id: product.id,
                            name: product.name
                          });
                        }}
                        className="px-3 py-1 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <FiTrash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
              ) : (
                <p className="text-dark-muted text-center py-8">
                  {showAllProducts ? 'No products found' : 'No recent products'}
                </p>
              );
            })()}
          </div>
            </div>
          </>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <>
            {/* Recent Suppliers */}
            <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-dark-text">
              {showAllCompanies ? 'All Companies' : 'Recent Suppliers'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSuppliers}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                title="Export all suppliers to Excel"
              >
                <FiDownload size={16} />
                Export Excel
              </button>
              {showAllCompanies && (
                <button
                  onClick={() => setShowAllCompanies(false)}
                  className="px-4 py-2 rounded-lg bg-gray-500 text-white text-sm hover:opacity-90 transition-opacity"
                >
                  Show Recent
                </button>
              )}
              <button
                onClick={fetchAllCompanies}
                disabled={loadingCompanies}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCompanies ? 'Loading...' : showAllCompanies ? 'Refresh' : 'View All'}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {(() => {
              const companiesToShow = showAllCompanies ? allCompanies : (stats?.suppliersList || []);
              return companiesToShow && Array.isArray(companiesToShow) && companiesToShow.length > 0 ? (
                companiesToShow.map((supplier) => (
                <div key={supplier?.id || Math.random()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                      <FiUsers className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-text">{supplier?.name || 'Unknown'}</h3>
                      <p className="text-sm text-dark-muted">{supplier?.location || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {supplier?.best_seller && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 text-xs rounded flex items-center gap-1">
                        <FiStar size={10} />
                        Best Seller
                      </span>
                    )}
                    {supplier?.verified ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
                        <FiShield size={10} />
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">Not Verified</span>
                    )}
                    {supplier?.verified && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBestSeller(supplier.id);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                          supplier?.best_seller
                            ? 'bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30'
                            : 'bg-gray-500/20 text-gray-600 hover:bg-gray-500/30'
                        }`}
                        title={supplier?.best_seller ? "Remove Best Seller" : "Mark as Best Seller"}
                      >
                        <FiStar size={12} />
                        {supplier?.best_seller ? 'Remove Best Seller' : 'Best Seller'}
                      </button>
                    )}
                    {supplier?.verified ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to unverify "${supplier.name}"?`)) {
                            handleUnverifyCompany(supplier.id);
                          }
                        }}
                        className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Unverify Company"
                      >
                        <FiX size={12} />
                        Unverify
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerifyCompany(supplier.id);
                        }}
                        className="px-3 py-1 rounded-lg bg-green-500/20 text-green-600 hover:bg-green-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Verify Company"
                      >
                        <FiCheck size={12} />
                        Verify
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          type: 'company',
                          id: supplier.id,
                          name: supplier.name
                        });
                      }}
                      className="px-3 py-1 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <FiTrash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              ))
              ) : (
                <p className="text-dark-muted text-center py-8">
                  {showAllCompanies ? 'No companies found' : 'No suppliers found'}
                </p>
              );
            })()}
          </div>
            </div>
          </>
        )}
        {/* AI RFQ Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-dark-text flex items-center gap-2">
                <FiZap className="text-accent-purple" />
                AI RFQ Matching Dashboard
              </h2>
              <button 
                onClick={fetchAdminInquiries}
                className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiActivity size={18} />
                Refresh Inquiries
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Inquiries List */}
              <div className="glass-effect rounded-xl p-6">
                <h3 className="text-xl font-bold text-dark-text mb-6">Recent Inquiries</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {loadingInquiries ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple mx-auto"></div>
                    </div>
                  ) : inquiries.length === 0 ? (
                    <p className="text-dark-muted text-center py-8">No inquiries found</p>
                  ) : (
                    inquiries.map(inq => (
                      <div 
                        key={inq.id} 
                        className={`p-4 rounded-lg cursor-pointer transition-all border ${
                          selectedInquiry?.id === inq.id 
                            ? 'bg-accent-purple/5 border-accent-purple ring-1 ring-accent-purple/20' 
                            : 'bg-white border-dark-border hover:border-accent-purple/50'
                        }`}
                        onClick={() => handleViewMatches(inq)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-dark-text">{inq.product_name}</h4>
                          <span className="text-xs text-dark-muted">{new Date(inq.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-dark-muted mb-2 line-clamp-2">{inq.message}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-accent-blue font-medium">{inq.name}</span>
                          <span className="text-dark-muted">{inq.email}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Matches List */}
              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-dark-text">AI Recommended Suppliers</h3>
                  {selectedInquiry && (
                    <button 
                      onClick={() => handleViewMatches(selectedInquiry)}
                      className="text-accent-purple hover:underline text-sm font-semibold flex items-center gap-1"
                      disabled={loadingMatches}
                    >
                      <FiZap size={14} />
                      Reprocess Matching
                    </button>
                  )}
                </div>

                {!selectedInquiry ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <FiZap size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-dark-muted">Select an inquiry to view AI-matched suppliers</p>
                  </div>
                ) : loadingMatches ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mx-auto mb-4"></div>
                    <p className="text-dark-muted font-medium">AI is analyzing relevance...</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-dark-muted">No suitable matches found for this category.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map(match => (
                      <div key={match.id} className="p-4 rounded-lg bg-white border border-dark-border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-dark-text flex items-center gap-2">
                              {match.company_name}
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full uppercase font-bold tracking-wider">
                                Recommended
                              </span>
                            </h4>
                            <p className="text-xs text-dark-muted">{match.email}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-accent-green">
                              {match.score}%
                            </div>
                            <p className="text-[10px] uppercase font-bold text-dark-muted tracking-wide">Match Score</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="flex-1 py-1.5 bg-accent-blue text-white text-xs font-semibold rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                          >
                            <FiFileText size={14} />
                            Send RFQ
                          </button>
                          <button 
                            className="px-3 py-1.5 border border-dark-border text-dark-text text-xs font-semibold rounded hover:bg-gray-50 transition-colors"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-dark-text flex items-center gap-2">
                <FiUsers className="text-accent-purple" />
                User Management
              </h2>
              <button 
                onClick={fetchAllUsers}
                className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiActivity size={18} />
                Refresh List
              </button>
            </div>

            {loadingUsers ? (
              <div className="glass-effect rounded-xl p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mx-auto mb-4"></div>
                <p className="text-dark-muted">Fetching registered users...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sellers Section */}
                <div className="glass-effect rounded-xl p-6 border-l-4 border-accent-blue">
                  <h3 className="text-xl font-bold text-dark-text mb-6 flex items-center justify-between">
                    <span>Sellers / Suppliers</span>
                    <span className="bg-accent-blue/10 text-accent-blue px-3 py-1 rounded-full text-sm">
                      {allUsers.filter(u => u.role === 'Seller').length}
                    </span>
                  </h3>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {allUsers.filter(u => u.role === 'Seller').length === 0 ? (
                      <p className="text-dark-muted text-center py-8">No sellers found</p>
                    ) : (
                      allUsers.filter(u => u.role === 'Seller').map(user => (
                        <div key={user.id} className="p-4 rounded-lg bg-white border border-dark-border hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-dark-text">{user.name}</h4>
                              <p className="text-xs text-dark-muted">{user.email}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-accent-blue text-white text-[10px] uppercase font-bold rounded">Seller</span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-dark-muted">Company:</span>
                              <span className="font-semibold text-accent-blue truncate ml-2">{user.company_name}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-dark-muted">Phone:</span>
                              <span className="text-dark-text">{user.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-dark-muted">Joined:</span>
                              <span className="text-dark-text">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Buyers Section */}
                <div className="glass-effect rounded-xl p-6 border-l-4 border-accent-purple">
                  <h3 className="text-xl font-bold text-dark-text mb-6 flex items-center justify-between">
                    <span>Buyers</span>
                    <span className="bg-accent-purple/10 text-accent-purple px-3 py-1 rounded-full text-sm">
                      {allUsers.filter(u => u.role === 'Buyer' || u.role === 'Admin').length}
                    </span>
                  </h3>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {allUsers.filter(u => u.role === 'Buyer' || u.role === 'Admin').length === 0 ? (
                      <p className="text-dark-muted text-center py-8">No buyers found</p>
                    ) : (
                      allUsers.filter(u => u.role === 'Buyer' || u.role === 'Admin').map(user => (
                        <div key={user.id} className="p-4 rounded-lg bg-white border border-dark-border hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-dark-text">{user.name}</h4>
                              <p className="text-xs text-dark-muted">{user.email}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-2 py-0.5 ${user.role === 'Admin' ? 'bg-red-500' : 'bg-accent-purple'} text-white text-[10px] uppercase font-bold rounded`}>
                                {user.is_buyer_manager ? 'Buyer Manager' : user.role}
                              </span>
                              {user.role === 'Buyer' && (
                                <button
                                  onClick={() => handleToggleManager(user.id)}
                                  className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${
                                    user.is_buyer_manager 
                                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                                  }`}
                                >
                                  {user.is_buyer_manager ? 'Remove Manager' : 'Make Manager'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-dark-muted font-bold">Plan: {user.membership_tier || 'STARTER'}</span>
                              <div className="flex gap-1">
                                {['STARTER', 'BASIC', 'PREMIUM'].map(tier => (
                                  <button
                                    key={tier}
                                    onClick={() => handleUpdateSubscription(user.id, tier)}
                                    className={`px-2 py-1 text-[9px] font-black rounded-md ${
                                      user.membership_tier === tier 
                                        ? 'bg-accent-purple text-white' 
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                  >
                                    {tier}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-dark-muted">Phone:</span>
                              <span className="text-dark-text">{user.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-dark-muted">Joined:</span>
                              <span className="text-dark-text">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trade Leads Tab */}
        {activeTab === 'trade-leads' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Create Lead Form */}
              <div className="lg:col-span-1">
                <div className="glass-effect rounded-xl p-6 border-t-4 border-accent-pink">
                  <h3 className="text-xl font-bold text-dark-text mb-4">Post New Trade Lead</h3>
                  <form onSubmit={handleCreateLead} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-dark-muted mb-1 uppercase tracking-wider">Lead Title</label>
                      <input 
                        type="text" required
                        className="w-full bg-white border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent-pink outline-none text-sm"
                        placeholder="e.g. Bulk Wheat Requirement"
                        value={newLead.title}
                        onChange={e => setNewLead({...newLead, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-dark-muted mb-1 uppercase tracking-wider">Description</label>
                      <textarea 
                        required rows="3"
                        className="w-full bg-white border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-accent-pink outline-none text-sm"
                        placeholder="Detailed requirement..."
                        value={newLead.description}
                        onChange={e => setNewLead({...newLead, description: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-dark-muted mb-1 uppercase tracking-wider">Type</label>
                        <select 
                          className="w-full bg-white border border-dark-border rounded-lg px-2 py-2 text-sm"
                          value={newLead.type}
                          onChange={e => setNewLead({...newLead, type: e.target.value})}
                        >
                          <option value="buy">Buy Lead</option>
                          <option value="sell">Sell Lead</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-dark-muted mb-1 uppercase tracking-wider">Price (₹)</label>
                        <input 
                          type="number" required
                          className="w-full bg-white border border-dark-border rounded-lg px-2 py-2 text-sm"
                          value={newLead.price}
                          onChange={e => setNewLead({...newLead, price: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-dark-muted mb-1 uppercase tracking-wider">Category</label>
                      <select 
                        className="w-full bg-white border border-dark-border rounded-lg px-2 py-2 text-sm"
                        value={newLead.category}
                        onChange={e => setNewLead({...newLead, category: e.target.value})}
                      >
                        <option>Industrial Supplies</option>
                        <option>Electronics</option>
                        <option>Apparel</option>
                        <option>Chemicals</option>
                        <option>Food & Beverage</option>
                      </select>
                    </div>
                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <h4 className="text-xs font-black text-slate-800 mb-3 uppercase tracking-widest">Contact Information</h4>
                      <div className="space-y-3">
                        <input type="text" placeholder="Contact Name" className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" value={newLead.contact_name} onChange={e => setNewLead({...newLead, contact_name: e.target.value})} />
                        <input type="email" placeholder="Contact Email" className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" value={newLead.contact_email} onChange={e => setNewLead({...newLead, contact_email: e.target.value})} />
                        <input type="text" placeholder="Contact Phone" className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" value={newLead.contact_phone} onChange={e => setNewLead({...newLead, contact_phone: e.target.value})} />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-accent-pink to-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-lg transition-all"
                    >
                      Publish and Broadcast
                    </button>
                  </form>
                </div>
              </div>

              {/* Leads List */}
              <div className="lg:col-span-2">
                <div className="glass-effect rounded-xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-dark-text">Ongoing Trade Leads</h3>
                    <button onClick={fetchTradeLeads} className="text-accent-pink hover:rotate-180 transition-all">
                      <FiActivity size={20} />
                    </button>
                  </div>
                  {loadingLeads ? (
                    <div className="py-20 text-center"><div className="animate-spin h-10 w-10 border-4 border-accent-pink border-t-transparent rounded-full mx-auto"></div></div>
                  ) : tradeLeads.length === 0 ? (
                    <p className="text-center py-20 text-slate-400 font-bold">No trade leads found.</p>
                  ) : (
                    <div className="space-y-4">
                      {tradeLeads.map(lead => (
                        <div key={lead.id} className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest mr-2 ${lead.type === 'buy' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {lead.type === 'buy' ? 'Buying' : 'Selling'}
                              </span>
                              <h4 className="inline-block font-black text-slate-800 text-lg">{lead.title}</h4>
                            </div>
                            <button onClick={() => handleDeleteLead(lead.id)} className="text-red-400 hover:text-red-600 transition-colors">
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                          <p className="text-sm text-slate-500 mb-4 line-clamp-2">{lead.description}</p>
                          <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>📂 {lead.category}</span>
                            <span>📍 {lead.location || 'India'}</span>
                            <span className="text-accent-pink">💰 ₹{lead.price}</span>
                            <span>📅 {new Date(lead.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Buyer Management Tab */}
        {activeTab === 'buyer-managers' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-dark-text flex items-center gap-2">
                <FiShield className="text-accent-purple" />
                Dedicated Buyer Management
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={fetchBuyerManagers}
                  className="px-4 py-2 glass-effect border border-dark-border rounded-lg hover:border-accent-purple transition-all flex items-center gap-2"
                >
                  <FiActivity size={18} /> Refresh Managers
                </button>
                <button 
                  onClick={fetchAdminInquiries}
                  className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <FiClipboard size={18} /> Refresh Inquiries
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Managers List */}
              <div className="lg:col-span-1">
                <div className="glass-effect rounded-xl p-6 border-t-4 border-accent-purple">
                  <h3 className="text-xl font-bold text-dark-text mb-4">Designated Managers</h3>
                  <div className="space-y-4">
                    {loadingManagers ? (
                      <p className="text-dark-muted animate-pulse">Loading managers...</p>
                    ) : buyerManagers.length === 0 ? (
                      <p className="text-dark-muted py-4 text-center">No designated managers yet.</p>
                    ) : (
                      buyerManagers.map(m => (
                        <div key={m.id} className="p-4 rounded-lg bg-white border border-dark-border shadow-sm">
                          <div className="font-bold text-dark-text">{m.name}</div>
                          <div className="text-xs text-dark-muted mb-2">{m.email}</div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="bg-accent-purple/10 text-accent-purple px-2 py-0.5 rounded">
                              {m.assigned_count} Assigned
                            </span>
                            <button 
                              onClick={() => handleToggleManager(m.id)}
                              className="text-red-500 hover:underline font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="pt-4 border-t border-dark-border">
                      <p className="text-xs text-dark-muted mb-2 italic">To designate a manager, toggle the role on a user card in the Users tab.</p>
                      <button 
                        onClick={() => setActiveTab('users')}
                        className="text-accent-purple text-sm font-bold flex items-center gap-1 hover:underline"
                      >
                        Go to Users <FiGrid size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiries Oversight */}
              <div className="lg:col-span-2">
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-xl font-bold text-dark-text mb-4">Sourcing Requests Oversight</h3>
                  {loadingInquiries ? (
                    <div className="py-12 text-center animate-pulse">
                      <FiClipboard className="mx-auto text-dark-muted mb-2" size={32} />
                      <p className="text-dark-muted">Loading inquiries...</p>
                    </div>
                  ) : inquiries.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-dark-muted">No inquiries found in the system.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-dark-border text-dark-muted text-sm">
                            <th className="pb-3 pr-4">ID</th>
                            <th className="pb-3 pr-4">Buyer / Product</th>
                            <th className="pb-3 pr-4">Qty</th>
                            <th className="pb-3 pr-4">Assigned Manager</th>
                            <th className="pb-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                          {inquiries.map(inq => (
                            <tr key={inq.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 pr-4 font-mono text-xs text-dark-muted">#{inq.id}</td>
                              <td className="py-4 pr-4">
                                <div className="font-bold text-dark-text text-sm">{inq.buyer_name}</div>
                                <div className="text-xs text-accent-blue truncate max-w-[200px]">{inq.product_name}</div>
                              </td>
                              <td className="py-4 pr-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  parseInt(inq.quantity) >= 100 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {inq.quantity || '1'}
                                </span>
                              </td>
                              <td className="py-4 pr-4">
                                {inq.manager_name ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-accent-purple text-white flex items-center justify-center text-[10px] font-bold">
                                      {inq.manager_name[0]}
                                    </div>
                                    <span className="text-sm text-dark-text">{inq.manager_name}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-red-500 font-medium italic">Unassigned</span>
                                )}
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handleViewMatches(inq)}
                                    className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg font-bold text-[10px] hover:bg-indigo-200 transition-colors flex items-center gap-1"
                                  >
                                    <FiZap size={12} /> AI MATCHES
                                  </button>
                                  <select 
                                    className="text-xs border border-dark-border rounded px-2 py-1 bg-white focus:ring-1 focus:ring-accent-purple outline-none"
                                    value={inq.manager_id || ""}
                                    onChange={(e) => handleAssignManager(inq.id, e.target.value)}
                                  >
                                    <option value="">-- Assign --</option>
                                    {buyerManagers.map(m => (
                                      <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-dark-text">Confirm Deletion</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="text-dark-muted hover:text-dark-text transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-dark-muted mb-2">
                Are you sure you want to delete this {deleteConfirm.type === 'product' ? 'product' : 'company'}?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-dark-text">
                  {deleteConfirm.name}
                </p>
              </div>
              {deleteConfirm.type === 'company' && (
                <p className="text-sm text-red-500 mt-2">
                  ⚠️ This will also delete all products associated with this company!
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'product') {
                    handleDeleteProduct(deleteConfirm.id);
                  } else {
                    handleDeleteCompany(deleteConfirm.id);
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg glass-effect border border-dark-border hover:border-accent-purple transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI Matches Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-2xl font-black text-slate-800">AI Sourcing Intelligence</h3>
                <p className="text-sm text-slate-400">Smart matches for: <span className="text-indigo-600 font-bold">{selectedInquiry.product_name}</span> from <span className="font-bold text-slate-600">{selectedInquiry.buyer_name}</span></p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {loadingMatches ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-slate-500 font-bold animate-pulse">Running AI Sourcing Intelligence...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                   <FiZap className="mx-auto text-slate-300 mb-4" size={48} />
                   <p className="text-slate-400 font-medium">No suitable suppliers found for this requirement.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {matches.map((match) => (
                     <div key={match.id} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                           <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              match.match_score >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              match.match_score >= 50 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-slate-50 text-slate-400 border border-slate-100'
                           }`}>
                              Score: {match.match_score}%
                           </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              {match.supplier_name?.charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-slate-800">{match.supplier_name}</h4>
                              <p className="text-xs text-slate-400">{match.supplier_location || 'Global Supplier'}</p>
                           </div>
                        </div>

                        <div className="space-y-3 mb-6">
                           <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Match Reason:</span>
                              <span className="text-indigo-600 font-bold">{match.match_reason || 'Category Alignment'}</span>
                           </div>
                           <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${match.match_score}%` }}></div>
                           </div>
                        </div>

                        <button className="w-full py-4 bg-slate-50 text-slate-600 font-black text-[10px] rounded-2xl hover:bg-slate-100 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                           View Supplier Profile <FiChevronRight />
                        </button>
                     </div>
                   ))}
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <p className="text-xs text-slate-400 font-medium">Auto-generated matches based on category, tags and keyword scoring.</p>
               <button onClick={() => setSelectedInquiry(null)} className="px-10 py-4 bg-slate-900 text-white font-black text-[10px] rounded-2xl hover:bg-slate-800 shadow-xl transition-all uppercase tracking-widest">
                  Close Intelligence
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

export default Admin;
