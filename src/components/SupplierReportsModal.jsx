import { useState, useMemo } from 'react';
import { X, FileText, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { calculateSupplierBalance } from '../utils/supplierBalanceUtils';
import { exportSuppliersToExcel } from '../utils/exportUtils';
import { generateAllSuppliersReportPDF } from '../utils/supplierReportUtils';

const SupplierReportsModal = ({ show, onClose }) => {
  const { data } = useData();
  const [reportType, setReportType] = useState('all'); // 'all' or 'specific'
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateRange, setDateRange] = useState('all'); // 'all', 'last30', 'last90', 'lastQuarter', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Get suppliers
  const suppliers = useMemo(() => {
    return (data.parties || []).filter(p => p.type === 'supplier' || p.type === 'both');
  }, [data.parties]);

  // Get projects
  const projects = useMemo(() => {
    return data.projects || [];
  }, [data.projects]);

  // Calculate supplier summary data
  const supplierSummaries = useMemo(() => {
    const transactions = data.supplierTransactions || [];

    // Filter transactions by date range
    let filteredTransactions = transactions;

    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'last30':
          startDate = new Date();
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last90':
          startDate = new Date();
          startDate.setDate(now.getDate() - 90);
          break;
        case 'lastQuarter':
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'custom':
          if (customStartDate) {
            startDate = new Date(customStartDate);
          }
          break;
        default:
          break;
      }

      if (startDate) {
        filteredTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          if (dateRange === 'custom' && customEndDate) {
            const endDate = new Date(customEndDate);
            return transactionDate >= startDate && transactionDate <= endDate;
          }
          return transactionDate >= startDate;
        });
      }
    }

    // Filter suppliers list if specific supplier is selected
    let suppliersToProcess = suppliers;
    if (selectedSupplierId && selectedSupplierId !== '' && selectedSupplierId !== 'all') {
      suppliersToProcess = suppliers.filter(s => String(s.id) === String(selectedSupplierId));
    }

    return suppliersToProcess.map(supplier => {
      // Filter transactions for this supplier
      let supplierTransactions = filteredTransactions.filter(t => t.supplierId === supplier.id);

      // Filter by project if selected
      if (selectedProjectId && selectedProjectId !== '' && selectedProjectId !== 'all') {
        supplierTransactions = supplierTransactions.filter(t => String(t.projectId) === String(selectedProjectId));
      }

      const balance = calculateSupplierBalance(supplierTransactions, supplier.id, null);

      return {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        ...balance,
        transactionCount: supplierTransactions.length
      };
    }); // Show all suppliers, including those without transactions
  }, [suppliers, data.supplierTransactions, selectedSupplierId, selectedProjectId, dateRange, customStartDate, customEndDate]);

  // Export to Excel
  const handleExportExcel = () => {
    console.log('📊 Export Excel clicked');
    console.log('Supplier Summaries:', supplierSummaries);

    if (supplierSummaries.length === 0) {
      alert('No data to export. Please adjust your filters.');
      return;
    }

    try {
      const dateRangeText = dateRange === 'all' ? 'All_Time' :
                           dateRange === 'last30' ? 'Last_30_Days' :
                           dateRange === 'last90' ? 'Last_90_Days' :
                           dateRange === 'lastQuarter' ? 'Last_Quarter' : 'Custom_Range';

      const projectFilter = selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : 'All_Projects';
      const filename = `Suppliers_Report_${dateRangeText}_${projectFilter.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      const success = exportSuppliersToExcel(
        supplierSummaries,
        filename,
        'Suppliers Report'
      );

      if (success) {
        console.log('✅ Excel export completed');
        alert('Excel file exported successfully!');
      } else {
        console.error('❌ Excel export failed');
        alert('Failed to export Excel. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error exporting Excel:', error);
      alert('Failed to export Excel. Check console for details.');
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    console.log('📄 Export PDF clicked');
    console.log('Supplier Summaries:', supplierSummaries);

    if (supplierSummaries.length === 0) {
      alert('No data to export. Please adjust your filters.');
      return;
    }

    try {
      const companyProfile = data.settings?.companyProfile || {};
      const companySettings = {
        companyName: companyProfile.companyName || 'Company Name',
        companyLogo: companyProfile.logo || null,
        companyAddress: companyProfile.address || '',
        companyPhone: companyProfile.phone || '',
        companyEmail: companyProfile.email || ''
      };

      console.log('Calling generateAllSuppliersReportPDF...');
      generateAllSuppliersReportPDF(
        supplierSummaries,
        companySettings,
        dateRange,
        customStartDate,
        customEndDate,
        selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : 'All Projects'
      );
      console.log('✅ PDF generation completed');
      alert('PDF file exported successfully!');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Failed to generate PDF. Check console for details.');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📊 Supplier Reports</h2>
              <p className="text-sm text-gray-600 mt-1">Generate comprehensive supplier reports with filtering</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Filters Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Filters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date Range
                    {dateRange !== 'all' && (
                      <span className="ml-2 text-xs text-blue-600 font-semibold">● Active</span>
                    )}
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      dateRange !== 'all' ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="all">All Time</option>
                    <option value="last30">Last 30 Days</option>
                    <option value="last90">Last 90 Days</option>
                    <option value="lastQuarter">Last Quarter</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Project
                    {selectedProjectId && selectedProjectId !== '' && (
                      <span className="ml-2 text-xs text-blue-600 font-semibold">● Active</span>
                    )}
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      selectedProjectId && selectedProjectId !== '' ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">All Projects</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                {/* Supplier Filter (for specific report) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Supplier (Optional)
                    {selectedSupplierId && selectedSupplierId !== '' && (
                      <span className="ml-2 text-xs text-blue-600 font-semibold">● Active</span>
                    )}
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      selectedSupplierId && selectedSupplierId !== '' ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Date Range */}
              {dateRange === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Clear Filters Button */}
              {(dateRange !== 'all' || selectedProjectId !== '' || selectedSupplierId !== '') && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setDateRange('all');
                      setSelectedProjectId('');
                      setSelectedSupplierId('');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Export Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{supplierSummaries.length}</span> supplier(s)
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportPDF}
                  disabled={supplierSummaries.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={supplierSummaries.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* Suppliers Summary Table */}
            {supplierSummaries.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No suppliers found with the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Purchases</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payments</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Balance</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supplierSummaries.map((supplier, index) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {supplier.phone && <div>📞 {supplier.phone}</div>}
                          {supplier.email && <div className="text-xs">📧 {supplier.email}</div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          ₹{supplier.totalPurchases.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-orange-600">
                          ₹{supplier.totalPayments.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold">
                          <span className={
                            supplier.balanceType === 'payable' ? 'text-red-600' :
                            supplier.balanceType === 'overpaid' ? 'text-blue-600' :
                            'text-gray-600'
                          }>
                            ₹{supplier.outstandingBalance.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            supplier.balanceType === 'payable' ? 'bg-red-100 text-red-800' :
                            supplier.balanceType === 'overpaid' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {supplier.balanceType === 'payable' ? 'Payable' :
                             supplier.balanceType === 'overpaid' ? 'Advance' :
                             'Settled'}
                          </span>
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
  );
};

export default SupplierReportsModal;

