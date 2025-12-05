import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Users, Search, Filter, ArrowUpDown, Plus, Upload, FileSpreadsheet, FileText, Edit2, Calendar, X, BarChart3 } from 'lucide-react';
import AddPartyModal from '../components/AddPartyModal';
import SupplierDetailModal from '../components/SupplierDetailModal';
import AddPurchaseTransactionModal from '../components/AddPurchaseTransactionModal';
import AddPaymentTransactionModal from '../components/AddPaymentTransactionModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';
import SupplierReportsModal from '../components/SupplierReportsModal';
import {
  generateSupplierStatementPDF,
  generateSupplierExcelReport
} from '../utils/supplierReportUtils';

const Parties = () => {
  const { data, addParty, updateParty, deleteParty } = useData();
  const { isBootstrap } = useTheme();
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'suppliers'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Credit Transaction Modal State
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditModalData, setCreditModalData] = useState({ supplier: null, projectId: null });

  // Debit Transaction Modal State
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [debitModalData, setDebitModalData] = useState({ supplier: null, projectId: null });

  // Transaction History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalData, setHistoryModalData] = useState({ supplier: null, projectId: null, projectName: null });

  // Supplier Reports Modal State
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Date filter state
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Get parties from data
  const allParties = useMemo(() => data.parties || [], [data.parties]);

  // Helper function to check if a date is within the filter range
  const isDateInRange = useCallback((dateString) => {
    if (dateFilter === 'all') return true;

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      const itemDate = new Date(date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === today.getTime();
    }

    if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return date >= weekAgo && date <= today;
    }

    if (dateFilter === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return date >= monthStart && date <= today;
    }

    if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      const start = new Date(customDateRange.startDate);
      const end = new Date(customDateRange.endDate);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    }

    return true;
  }, [dateFilter, customDateRange]);

  // Filter parties by type (customers or suppliers)
  const partiesByType = useMemo(() => {
    return allParties.filter(party => {
      if (activeTab === 'customers') {
        return party.type === 'customer' || party.type === 'both';
      } else {
        return party.type === 'supplier' || party.type === 'both';
      }
    });
  }, [allParties, activeTab]);

  // Apply search and date filters
  const filteredParties = useMemo(() => {
    let filtered = partiesByType;

    // Date filter - Apply only for suppliers tab
    if (activeTab === 'suppliers' && dateFilter !== 'all') {
      filtered = filtered.filter(party => {
        const dateToCheck = party.createdAt || party.updatedAt;
        return dateToCheck && isDateInRange(dateToCheck);
      });
    }

    // Search - Enhanced to include new fields
    if (searchQuery) {
      filtered = filtered.filter(party =>
        party.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.phone?.includes(searchQuery) ||
        party.alternateNumber?.includes(searchQuery) ||
        party.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'balance') {
      filtered = [...filtered].sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0));
    }

    return filtered;
  }, [partiesByType, searchQuery, sortBy, activeTab, dateFilter, isDateInRange]);

  // Pagination logic
  const totalPages = Math.ceil(filteredParties.length / itemsPerPage);
  const paginatedParties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredParties.slice(startIndex, endIndex);
  }, [filteredParties, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, activeTab, dateFilter, customDateRange]);

  // Calculate totals - Use filtered data for suppliers when date filter is active
  const totals = useMemo(() => {
    const customers = allParties.filter(p => p.type === 'customer' || p.type === 'both');

    // For suppliers, use filtered data if date filter is active
    let suppliers = allParties.filter(p => p.type === 'supplier' || p.type === 'both');
    if (activeTab === 'suppliers' && dateFilter !== 'all') {
      suppliers = suppliers.filter(party => {
        const dateToCheck = party.createdAt || party.updatedAt;
        return dateToCheck && isDateInRange(dateToCheck);
      });
    }

    const youWillGet = customers.reduce((sum, party) => {
      return sum + (party.balanceType === 'receivable' ? (party.currentBalance || 0) : 0);
    }, 0);

    const youWillGive = suppliers.reduce((sum, party) => {
      return sum + (party.balanceType === 'payable' ? (party.currentBalance || 0) : 0);
    }, 0);

    // Calculate supplier-specific totals
    const totalPurchases = (data.supplierTransactions || [])
      .filter(t => t.type === 'purchase' || t.type === 'credit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalPayments = (data.supplierTransactions || [])
      .filter(t => t.type === 'payment' || t.type === 'debit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalAdvance = suppliers.reduce((sum, party) => {
      return sum + (party.balanceType === 'overpaid' ? Math.abs(party.currentBalance || 0) : 0);
    }, 0);

    return {
      youWillGet,
      youWillGive,
      totalPurchases,
      totalPayments,
      totalAdvance,
      totalSuppliers: suppliers.length
    };
  }, [allParties, activeTab, dateFilter, isDateInRange, data.supplierTransactions]);

  // Handle add party
  const handleAddParty = () => {
    setSelectedParty(null);
    setShowAddModal(true);
  };

  // Handle edit party
  const handleEditParty = (party) => {
    setSelectedParty(party);
    setShowAddModal(true);
  };

  // Handle view party details
  const handleViewParty = (party) => {
    // Only open detail modal for suppliers
    if (party.type === 'supplier' || party.type === 'both') {
      setSelectedParty(party);
      setShowDetailModal(true);
    }
  };

  // Handle save party
  const handleSaveParty = async (partyData) => {
    try {
      if (selectedParty) {
        // Update existing party
        await updateParty(selectedParty.id, partyData);
      } else {
        // Add new party
        await addParty(partyData);
      }
    } catch (error) {
      console.error('Error saving party:', error);
      alert('Failed to save party. Please try again.');
    }
  };

  // Supplier Detail Modal Handlers
  const handleAddCredit = (supplier, projectId = null) => {
    setCreditModalData({ supplier, projectId });
    setShowCreditModal(true);
    // Keep detail modal open in background
  };

  const handleAddPayment = (supplier, projectId = null) => {
    setDebitModalData({ supplier, projectId });
    setShowDebitModal(true);
    // Keep detail modal open in background
  };

  const handleViewTransactions = (supplier, projectId = null, projectName = null) => {
    setHistoryModalData({ supplier, projectId, projectName });
    setShowHistoryModal(true);
    // Keep detail modal open in background
  };

  const handleGenerateReport = (supplier) => {
    // Show options: PDF or Excel
    const choice = window.confirm(
      'Choose report format:\n\nOK = PDF Statement\nCancel = Excel Report'
    );

    try {
      // Prepare company settings for PDF
      const companyProfile = data.settings?.companyProfile || {};
      const companySettings = {
        companyName: companyProfile.companyName || 'Company Name',
        companyLogo: companyProfile.logo || null,
        companyAddress: companyProfile.address || '',
        companyPhone: companyProfile.phone || '',
        companyEmail: companyProfile.email || ''
      };

      if (choice) {
        // Generate PDF
        generateSupplierStatementPDF(
          supplier,
          data.supplierTransactions || [],
          data.projects || [],
          companySettings
        );
        setToast({
          show: true,
          message: 'PDF statement generated successfully',
          type: 'success'
        });
      } else {
        // Generate Excel
        generateSupplierExcelReport(
          supplier,
          data.supplierTransactions || [],
          data.projects || []
        );
        setToast({
          show: true,
          message: 'Excel report generated successfully',
          type: 'success'
        });
      }

      // Auto-hide toast
      setTimeout(() => {
        setToast({ show: false, message: '', type: 'success' });
      }, 3000);
    } catch (error) {
      console.error('Error generating report:', error);
      setToast({
        show: true,
        message: 'Failed to generate report. Please try again.',
        type: 'error'
      });
      setTimeout(() => {
        setToast({ show: false, message: '', type: 'error' });
      }, 3000);
    }
  };

  // Handle credit transaction success
  const handleCreditSuccess = (message) => {
    setToast({ show: true, message, type: 'success' });
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Handle debit transaction success
  const handleDebitSuccess = (message) => {
    setToast({ show: true, message, type: 'success' });
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Get date filter label
  const getDateFilterLabel = () => {
    if (dateFilter === 'all') return 'All Time';
    if (dateFilter === 'today') return 'Today';
    if (dateFilter === 'week') return 'This Week';
    if (dateFilter === 'month') return 'This Month';
    if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      return `${customDateRange.startDate} to ${customDateRange.endDate}`;
    }
    return 'Filter by Date';
  };

  // Handle date filter change
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    setShowDateFilterDropdown(false);
    if (filter !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  };

  // Handle clear date filter
  const handleClearDateFilter = () => {
    setDateFilter('all');
    setCustomDateRange({ startDate: '', endDate: '' });
  };

  return (
    <div className={isBootstrap ? 'container-fluid py-4' : 'p-6'}>
      {/* Header */}
      <div className={isBootstrap ? 'row mb-4' : 'mb-6'}>
        <div className={isBootstrap ? 'col-12' : ''}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={isBootstrap ? 'bg-primary text-white p-3 rounded' : 'bg-primary-600 text-white p-3 rounded-lg'}>
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className={isBootstrap ? 'h3 mb-0' : 'text-2xl font-bold text-gray-900'}>Parties</h1>
                <p className={isBootstrap ? 'text-muted mb-0' : 'text-sm text-gray-500'}>
                  Manage customers and suppliers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={isBootstrap ? 'row mb-4' : 'mb-6'}>
        <div className={isBootstrap ? 'col-12' : ''}>
          <div className="flex items-center gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'customers'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Customers
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                activeTab === 'customers' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {allParties.filter(p => p.type === 'customer' || p.type === 'both').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === 'suppliers'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Suppliers
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                activeTab === 'suppliers' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {allParties.filter(p => p.type === 'supplier' || p.type === 'both').length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards - ONLY FOR SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className={isBootstrap ? 'row mb-4' : 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'}>
          {/* Total Suppliers */}
          <div className={isBootstrap ? 'col-md-3 mb-3 mb-md-0' : ''}>
            <div className="card border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-white font-semibold opacity-90 mb-2 uppercase tracking-wide">Total Suppliers</p>
                    <h3 className="text-3xl font-bold text-white mb-0">{totals.totalSuppliers}</h3>
                    <p className="text-xs text-white opacity-75 mt-1">Active suppliers</p>
                  </div>
                  <div className="p-3">
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Purchases */}
          <div className={isBootstrap ? 'col-md-3 mb-3 mb-md-0' : ''}>
            <div className="card border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-white font-semibold opacity-90 mb-2 uppercase tracking-wide">Total Purchases</p>
                    <h3 className="text-3xl font-bold text-white mb-0">₹{totals.totalPurchases.toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-white opacity-75 mt-1">All time purchases</p>
                  </div>
                  <div className="p-3">
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payable Amount */}
          <div className={isBootstrap ? 'col-md-3 mb-3 mb-md-0' : ''}>
            <div className="card border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-white font-semibold opacity-90 mb-2 uppercase tracking-wide">Payable</p>
                    <h3 className="text-3xl font-bold text-white mb-0">₹{totals.youWillGive.toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-white opacity-75 mt-1">Amount to pay</p>
                  </div>
                  <div className="p-3">
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advance Amount */}
          <div className={isBootstrap ? 'col-md-3' : ''}>
            <div className="card border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-white font-semibold opacity-90 mb-2 uppercase tracking-wide">Advance</p>
                    <h3 className="text-3xl font-bold text-white mb-0">₹{totals.totalAdvance.toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-white opacity-75 mt-1">Paid in advance</p>
                  </div>
                  <div className="p-3">
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search, Filter, Sort, and Actions */}
      <div className={isBootstrap ? 'row mb-4' : 'mb-6'}>
        <div className={isBootstrap ? 'col-12' : ''}>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={`Search for ${activeTab}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isBootstrap ? 'form-control ps-5 pe-5' : 'w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div> 

            {/* Date Filter - ONLY FOR SUPPLIERS TAB */}
            {activeTab === 'suppliers' && (
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowDateFilterDropdown(!showDateFilterDropdown)}
                    className={isBootstrap ? 'btn btn-outline-secondary' : 'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2'}
                  >
                    <Calendar className="w-4 h-4" />
                    {getDateFilterLabel()}
                  </button>

                  {/* Date Filter Dropdown */}
                  {showDateFilterDropdown && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDateFilterDropdown(false)}
                      />
                      {/* Dropdown Content */}
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <div className="p-2">
                          <button
                            onClick={() => handleDateFilterChange('all')}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${dateFilter === 'all' ? 'bg-primary-50 text-primary-600' : ''}`}
                          >
                            All Time
                          </button>
                          <button
                            onClick={() => handleDateFilterChange('today')}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${dateFilter === 'today' ? 'bg-primary-50 text-primary-600' : ''}`}
                          >
                            Today
                          </button>
                          <button
                            onClick={() => handleDateFilterChange('week')}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${dateFilter === 'week' ? 'bg-primary-50 text-primary-600' : ''}`}
                          >
                            This Week
                          </button>
                          <button
                            onClick={() => handleDateFilterChange('month')}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${dateFilter === 'month' ? 'bg-primary-50 text-primary-600' : ''}`}
                          >
                            This Month
                          </button>
                          <div className="border-t border-gray-200 my-2"></div>
                          <div className="px-3 py-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Custom Range</label>
                            <input
                              type="date"
                              value={customDateRange.startDate}
                              onChange={(e) => {
                                setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }));
                                setDateFilter('custom');
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2"
                              placeholder="Start Date"
                            />
                            <input
                              type="date"
                              value={customDateRange.endDate}
                              onChange={(e) => {
                                setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }));
                                setDateFilter('custom');
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="End Date"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Clear Filter Button */}
                {dateFilter !== 'all' && (
                  <button
                    onClick={handleClearDateFilter}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Clear Date Filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Supplier Reports Button - ONLY FOR SUPPLIERS TAB */}
              {activeTab === 'suppliers' && (
                <button
                  onClick={() => setShowReportsModal(true)}
                  className={isBootstrap ? 'btn btn-primary' : 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center text-sm sm:text-base'}
                >
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Reports
                </button>
              )}

              {/* <button className={isBootstrap ? 'btn btn-outline-primary' : 'px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 flex items-center gap-2'}>
                <Upload className="w-4 h-4" />
                Bulk Upload {activeTab === 'customers' ? 'Customers' : 'Suppliers'}
              </button> */}
              <button
                onClick={handleAddParty}
                className={isBootstrap ? 'btn btn-success' : 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 justify-center text-sm sm:text-base'}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Add</span>
                <span className="hidden sm:inline">{activeTab === 'customers' ? 'Customer' : 'Supplier'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Parties List */}
      <div className={isBootstrap ? 'row' : ''}>
        <div className={isBootstrap ? 'col-12' : ''}>
          {filteredParties.length === 0 ? (
            // Empty State
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="flex justify-center mb-4">
                  <div className="empty-state-illustration" role="img" aria-label="No data"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No party data available for applied filters
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'customers'
                    ? 'Add your first customer to get started'
                    : 'Add your first supplier to get started'}
                </p>
                <button
                  onClick={handleAddParty}
                  className={isBootstrap ? 'btn btn-success' : 'px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2 text-sm sm:text-base'}
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Add</span>
                  <span className="hidden sm:inline">{activeTab === 'customers' ? 'Customer' : 'Supplier'}</span>
                </button>
              </div>
            </div>
          ) : (
            // Parties Table
            <div className="card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className={isBootstrap ? 'table table-hover mb-0' : 'w-full'}>
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedParties.map((party) => (
                        <tr
                          key={party.id}
                          onClick={() => handleViewParty(party)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-600 font-semibold text-sm">
                                  {party.name?.charAt(0).toUpperCase() || 'P'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{party.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{party.phone || '-'}</div>
                            {party.alternateNumber && (
                              <div className="text-xs text-gray-500">{party.alternateNumber}</div>
                            )}
                          </td>
                          <td className="hidden md:table-cell px-6 py-4">
                            <div className="text-sm text-gray-900">{party.email || '-'}</div>
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={party.address}>
                              {party.address || '-'}
                            </div>
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {party.createdBy || '-'}
                            </div>
                            {party.createdAt && (
                              <div className="text-xs text-gray-500">
                                {new Date(party.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Supplier Quick Actions */}
                              {activeTab === 'suppliers' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddCredit(party);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                                    title="Record Purchase"
                                  >
                                    + Purchase
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddPayment(party);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded transition-colors"
                                    title="Record Payment"
                                  >
                                    💰 Payment
                                  </button>
                                </>
                              )}

                              {/* Edit Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditParty(party);
                                }}
                                className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {filteredParties.length > 0 && (
                  <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-700">
                          Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredParties.length)}</span> of{' '}
                          <span className="font-medium">{filteredParties.length}</span> results
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Per page:</label>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          First
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm">
                          Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Last
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Party Modal */}
      <AddPartyModal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedParty(null);
        }}
        onSave={handleSaveParty}
        party={selectedParty}
        defaultType={activeTab === 'customers' ? 'customer' : 'supplier'}
        existingParties={data.parties || []}
      />

      {/* Supplier Detail Modal */}
      <SupplierDetailModal
        show={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedParty(null);
        }}
        supplier={selectedParty}
        onAddCredit={handleAddCredit}
        onAddPayment={handleAddPayment}
        onViewTransactions={handleViewTransactions}
        onGenerateReport={handleGenerateReport}
      />

      {/* Add Purchase Transaction Modal */}
      <AddPurchaseTransactionModal
        show={showCreditModal}
        onClose={() => {
          setShowCreditModal(false);
          setCreditModalData({ supplier: null, projectId: null });
        }}
        supplier={creditModalData.supplier}
        preSelectedProjectId={creditModalData.projectId}
        onSuccess={handleCreditSuccess}
      />

      {/* Add Payment Transaction Modal */}
      <AddPaymentTransactionModal
        show={showDebitModal}
        onClose={() => {
          setShowDebitModal(false);
          setDebitModalData({ supplier: null, projectId: null });
        }}
        supplier={debitModalData.supplier}
        preSelectedProjectId={debitModalData.projectId}
        onSuccess={handleDebitSuccess}
      />

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        show={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setHistoryModalData({ supplier: null, projectId: null, projectName: null });
        }}
        supplier={historyModalData.supplier}
        projectId={historyModalData.projectId}
        projectName={historyModalData.projectName}
      />

      {/* Supplier Reports Modal */}
      <SupplierReportsModal
        show={showReportsModal}
        onClose={() => setShowReportsModal(false)}
      />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white flex items-center gap-2`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parties;
