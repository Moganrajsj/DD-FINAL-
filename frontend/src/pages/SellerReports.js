import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiDownload, FiCalendar, FiTrendingUp, FiPackage, FiCheckCircle, FiClock, FiXCircle, FiDollarSign } from 'react-icons/fi';

function SellerReports() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (!parsedUser.has_company) {
      navigate('/register-company');
      return;
    }

    // Set default date range for custom (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);

    // Load default report
    fetchReport('monthly');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReport = async (type = reportType) => {
    setLoading(true);
    try {
      const currentUser = user || JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.id) {
        setLoading(false);
        return;
      }

      let url = `/api/seller/reports?user_id=${currentUser.id}&type=${type}`;
      if (type === 'custom') {
        if (!startDate || !endDate) {
          alert('Please select both start and end dates for custom report');
          setLoading(false);
          return;
        }
        url += `&start_date=${startDate}T00:00:00&end_date=${endDate}T23:59:59`;
      }

      const response = await axios.get(url);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert(error.response?.data?.error || 'Failed to fetch report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
    fetchReport(type);
  };

  const downloadCSV = () => {
    if (!reportData || !reportData.order_details) {
      alert('No report data available to download');
      return;
    }

    // Create CSV content
    const headers = [
      'Order ID',
      'Order Date',
      'Product Name',
      'Buyer Name',
      'Buyer Email',
      'Quantity',
      'Unit Price',
      'Total Amount',
      'Status',
      'Payment Method',
      'Payment Status'
    ];

    const rows = reportData.order_details.map(order => [
      order.id,
      order.order_date ? new Date(order.order_date).toLocaleString('en-IN') : 'N/A',
      order.product_name,
      order.buyer_name,
      order.buyer_email,
      order.quantity,
      `₹${order.unit_price.toLocaleString('en-IN')}`,
      `₹${order.total_amount.toLocaleString('en-IN')}`,
      order.status,
      order.payment_method,
      order.payment_status
    ]);

    // Add summary section
    const summary = [
      [],
      ['=== REPORT SUMMARY ==='],
      [`Report Type: ${reportData.report_type}`],
      [`Period: ${new Date(reportData.start_date).toLocaleDateString('en-IN')} - ${new Date(reportData.end_date).toLocaleDateString('en-IN')}`],
      [],
      ['Total Orders', reportData.summary.total_orders],
      ['Pending Orders', reportData.summary.pending_orders],
      ['Processing Orders', reportData.summary.processing_orders],
      ['Shipped Orders', reportData.summary.shipped_orders],
      ['Completed Orders', reportData.summary.completed_orders],
      ['Cancelled Orders', reportData.summary.cancelled_orders],
      ['Total Revenue', `₹${reportData.summary.total_revenue.toLocaleString('en-IN')}`],
      ['Pending Revenue', `₹${reportData.summary.pending_revenue.toLocaleString('en-IN')}`],
      ['Average Order Value', `₹${reportData.summary.avg_order_value.toLocaleString('en-IN')}`],
      [],
      ['=== ORDER DETAILS ==='],
      headers
    ];

    const csvContent = [
      ...summary.map(row => row.map(cell => `"${cell}"`).join(',')),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seller-report-${reportData.report_type}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-dark-text">Sales Reports</h1>
            <p className="text-dark-muted">View and download your sales performance reports</p>
          </div>
          {reportData && (
            <button
              onClick={downloadCSV}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <FiDownload />
              Download CSV Report
            </button>
          )}
        </div>

        {/* Report Type Selection */}
        <div className="glass-effect rounded-xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={() => handleReportTypeChange('weekly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                reportType === 'weekly'
                  ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white'
                  : 'glass-effect border border-dark-border hover:border-accent-purple text-dark-text'
              }`}
            >
              Weekly Report
            </button>
            <button
              onClick={() => handleReportTypeChange('monthly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                reportType === 'monthly'
                  ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white'
                  : 'glass-effect border border-dark-border hover:border-accent-purple text-dark-text'
              }`}
            >
              Monthly Report
            </button>
            <button
              onClick={() => handleReportTypeChange('custom')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                reportType === 'custom'
                  ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white'
                  : 'glass-effect border border-dark-border hover:border-accent-purple text-dark-text'
              }`}
            >
              Custom Date Range
            </button>
          </div>

          {/* Custom Date Range Inputs */}
          {reportType === 'custom' && (
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-2 font-semibold text-dark-text">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-dark-text focus:border-accent-purple focus:outline-none"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block mb-2 font-semibold text-dark-text">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-dark-text focus:border-accent-purple focus:outline-none"
                />
              </div>
              <button
                onClick={() => fetchReport('custom')}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <FiCalendar />
                Generate Report
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-muted">
            <div className="animate-pulse">Loading report...</div>
          </div>
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center">
                    <FiPackage className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-dark-text mb-1">{reportData.summary.total_orders}</h3>
                <p className="text-dark-muted">Total Orders</p>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                    <FiClock className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-dark-text mb-1">{reportData.summary.pending_orders}</h3>
                <p className="text-dark-muted">Pending Orders</p>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <FiCheckCircle className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-dark-text mb-1">{reportData.summary.completed_orders}</h3>
                <p className="text-dark-muted">Completed Orders</p>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green to-accent-orange flex items-center justify-center">
                    <FiDollarSign className="text-white text-xl" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-dark-text mb-1">
                  ₹{reportData.summary.total_revenue.toLocaleString('en-IN')}
                </h3>
                <p className="text-dark-muted">Total Revenue</p>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="glass-effect rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-dark-text mb-4">Detailed Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-dark-muted mb-1">Processing Orders</p>
                  <p className="text-2xl font-bold text-dark-text">{reportData.summary.processing_orders}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-dark-muted mb-1">Shipped Orders</p>
                  <p className="text-2xl font-bold text-dark-text">{reportData.summary.shipped_orders}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-dark-muted mb-1">Cancelled Orders</p>
                  <p className="text-2xl font-bold text-dark-text">{reportData.summary.cancelled_orders}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-dark-muted mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-dark-text">₹{reportData.summary.avg_order_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-dark-muted mb-1">Pending Revenue</p>
                    <p className="text-2xl font-bold text-dark-text">₹{reportData.summary.pending_revenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-dark-muted mb-1">Processing Revenue</p>
                    <p className="text-2xl font-bold text-dark-text">₹{reportData.summary.processing_revenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Statistics */}
            {reportData.product_stats && reportData.product_stats.length > 0 && (
              <div className="glass-effect rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-4">Product Performance</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-dark-text">Product Name</th>
                        <th className="text-right py-3 px-4 font-semibold text-dark-text">Orders</th>
                        <th className="text-right py-3 px-4 font-semibold text-dark-text">Quantity Sold</th>
                        <th className="text-right py-3 px-4 font-semibold text-dark-text">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.product_stats.map((product, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-dark-text">{product.product_name}</td>
                          <td className="py-3 px-4 text-right text-dark-text">{product.total_orders}</td>
                          <td className="py-3 px-4 text-right text-dark-text">{product.total_quantity}</td>
                          <td className="py-3 px-4 text-right font-semibold text-accent-orange">₹{product.revenue.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Report Period Info */}
            <div className="glass-effect rounded-xl p-4 text-center text-dark-muted">
              <p>
                Report Period: {new Date(reportData.start_date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} - {new Date(reportData.end_date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-dark-muted">
            <p>Select a report type to view your sales reports</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerReports;

