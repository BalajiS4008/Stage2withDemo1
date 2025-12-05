import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, FileText, Eye, Calendar, DollarSign, Search, Filter, Download, MessageCircle, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/dataManager.jsx';
import { generateInvoicePDF } from '../utils/invoiceTemplates.jsx';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';

const Invoices = () => {
  const { data, addInvoice, updateInvoice, deleteInvoice } = useData();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState({ show: false, invoice: null });
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  const invoices = data.invoices || [];

  // Handle row selection
  const toggleRowSelection = (invoiceId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedInvoices.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedInvoices.map(inv => inv.id)));
    }
  };

  // Filter invoices with useMemo for performance
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        (invoice.clientName && invoice.clientName.toLowerCase().includes(searchLower)) ||
        (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filterStatus);
    }

    // Date range filter
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const end = dateRange.endDate ? new Date(dateRange.endDate) : null;

        if (start && end) {
          return invoiceDate >= start && invoiceDate <= end;
        } else if (start) {
          return invoiceDate >= start;
        } else if (end) {
          return invoiceDate <= end;
        }
        return true;
      });
    }

    return filtered;
  }, [invoices, searchTerm, filterStatus, dateRange]);

  // Sort filtered invoices by date (newest first)
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredInvoices]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: invoices.length,
      pending: invoices.filter(inv => inv.status === 'pending').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length
    };
  }, [invoices]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterStatus('all');
    setDateRange({ startDate: '', endDate: '' });
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterStatus !== 'all') count++;
    if (dateRange.startDate || dateRange.endDate) count++;
    return count;
  }, [searchTerm, filterStatus, dateRange]);

  // Pagination hook
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedInvoices,
    handlePageChange,
    handlePageSizeChange
  } = usePagination(sortedInvoices, 10);

  const handleAddNew = () => {
    setEditingInvoice(null);
    setShowModal(true);
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowModal(true);
  };

  const handleView = (invoice) => {
    setViewingInvoice(invoice);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
    }
  };

  const handleDownloadPDF = (invoice) => {
    generateInvoicePDF(invoice);
  };

  const handleWhatsAppShare = (invoice) => {
    setWhatsappModal({ show: true, invoice });
    // Pre-fill phone number if available
    setWhatsappPhone(invoice.clientPhone || '');
  };

  const sendWhatsAppMessage = () => {
    const invoice = whatsappModal.invoice;
    if (!invoice) return;

    // Validate phone number
    let phoneNumber = whatsappPhone.trim();
    if (!phoneNumber) {
      alert('Please enter a phone number');
      return;
    }

    // Remove any non-digit characters except +
    phoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Ensure phone number starts with country code
    if (!phoneNumber.startsWith('+')) {
      // Default to India country code if not specified
      phoneNumber = '+91' + phoneNumber;
    }

    // Create WhatsApp message
    const message = `*Invoice Details*\n\n` +
      `Invoice No: ${invoice.invoiceNumber}\n` +
      `Date: ${formatDate(invoice.date)}\n` +
      `Client: ${invoice.clientName}\n` +
      `Amount: ${formatCurrency(invoice.grandTotal)}\n` +
      `Status: ${invoice.status?.toUpperCase()}\n` +
      `Payment Method: ${invoice.paymentMethod}\n\n` +
      `${invoice.notes ? `Notes: ${invoice.notes}\n\n` : ''}` +
      `Thank you for your business!`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Close modal
    setWhatsappModal({ show: false, invoice: null });
    setWhatsappPhone('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: 'bg-success-100 text-success-700',
      pending: 'bg-warning-100 text-warning-700',
      cancelled: 'bg-danger-100 text-danger-700'
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Premium Header with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                Invoices
              </h1>
              <p className="text-white/90 text-lg font-medium">Create and manage professional invoices for your clients</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-white/90">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium">{invoices.length} Total</span>
                </div>
                <div className="w-px h-4 bg-white/30"></div>
                <div className="text-white/90 text-sm font-medium">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0))} Revenue
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="group relative px-8 py-4 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            aria-label="Create new invoice"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
            <div className="absolute inset-0 bg-white group-hover:opacity-0 transition-opacity duration-200"></div>
            <Plus className="w-5 h-5 relative z-10 text-indigo-600 group-hover:text-white transition-colors duration-200" />
            <span className="relative z-10 text-indigo-600 group-hover:text-white transition-colors duration-200">Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Premium Stats Cards with Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Invoices Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full">All Time</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90 mb-2">Total Invoices</p>
              <p className="text-4xl font-bold text-white mb-1">{invoices.length}</p>
              <p className="text-xs text-white/70 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Active tracking
              </p>
            </div>
          </div>
        </div>

        {/* Paid Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full">Completed</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90 mb-2">Paid Invoices</p>
              <p className="text-4xl font-bold text-white mb-1">
                {invoices.filter(inv => inv.status === 'paid').length}
              </p>
              <p className="text-xs text-white/90 font-semibold">
                {formatCurrency(invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full">Awaiting</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90 mb-2">Pending Invoices</p>
              <p className="text-4xl font-bold text-white mb-1">
                {invoices.filter(inv => inv.status === 'pending').length}
              </p>
              <p className="text-xs text-white/90 font-semibold">
                {formatCurrency(invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full">Gross</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white/90 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-white mb-1">
                {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0))}
              </p>
              <p className="text-xs text-white/70 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                All transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Filters Section */}
      <div className="space-y-5">
        {/* Filter Toggle and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`group relative px-6 py-3.5 rounded-xl font-semibold flex items-center gap-3 justify-center transition-all duration-300 overflow-hidden ${
              showFilterPanel
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-white text-xs items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              </span>
            )}
          </button>

          {/* Premium Search Bar */}
          <div className="flex-1">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity blur"></div>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="🔍 Search by invoice number or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="relative w-full pl-12 pr-12 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-900 placeholder:text-gray-500 placeholder:font-semibold font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors group/clear"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-gray-400 group-hover/clear:text-red-500 transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Premium Filter Panel */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            showFilterPanel ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border-2 border-indigo-100 p-8">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                    <Filter className="w-6 h-6 text-white" />
                  </div>
                  Filter Invoices
                </h3>
                <button
                  onClick={handleClearFilters}
                  className="group px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border-2 border-red-100 hover:border-red-200"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="label">Invoice Status</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === 'all'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      All ({statusCounts.all})
                    </button>
                    <button
                      onClick={() => setFilterStatus('pending')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === 'pending'
                          ? 'bg-warning-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Pending ({statusCounts.pending})
                    </button>
                    <button
                      onClick={() => setFilterStatus('paid')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === 'paid'
                          ? 'bg-success-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Paid ({statusCounts.paid})
                    </button>
                    <button
                      onClick={() => setFilterStatus('overdue')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === 'overdue'
                          ? 'bg-danger-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Overdue ({statusCounts.overdue})
                    </button>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="label flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="input text-sm"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="input text-sm"
                      placeholder="End Date"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters Summary */}
              {activeFilterCount > 0 && (
                <div className="pt-4 border-t border-gray-300">
                  <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center gap-2">
                        Search: "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm('')}
                          className="hover:bg-primary-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filterStatus !== 'all' && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center gap-2">
                        Status: {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        <button
                          onClick={() => setFilterStatus('all')}
                          className="hover:bg-primary-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(dateRange.startDate || dateRange.endDate) && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center gap-2">
                        Date: {dateRange.startDate || '...'} to {dateRange.endDate || '...'}
                        <button
                          onClick={() => setDateRange({ startDate: '', endDate: '' })}
                          className="hover:bg-primary-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing <span className="font-semibold text-gray-900">{filteredInvoices.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{invoices.length}</span> invoices
          </p>
        </div>
      </div>

      {/* Premium Invoices Table */}
      <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Table Header with Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 border-b border-indigo-700">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-5 bg-white/80 rounded-full"></div>
              Invoice List
            </h2>
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/90 font-medium">
                  {selectedRows.size} selected
                </span>
                <button
                  onClick={() => setSelectedRows(new Set())}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-all duration-200"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modern Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <th className="py-3 px-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedInvoices.length && paginatedInvoices.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-2 border-indigo-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="text-left py-3 px-4 font-bold text-indigo-900 text-xs uppercase tracking-wider">Invoice No.</th>
                <th className="text-left py-3 px-4 font-bold text-indigo-900 text-xs uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 font-bold text-indigo-900 text-xs uppercase tracking-wider">Client</th>
                <th className="text-left py-3 px-4 font-bold text-indigo-900 text-xs uppercase tracking-wider">Payment</th>
                <th className="text-left py-3 px-4 font-bold text-indigo-900 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 font-bold text-indigo-900 text-xs uppercase tracking-wider">Amount</th>
                <th className="text-center py-3 px-4 font-bold text-indigo-900 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedInvoices.map((invoice, index) => {
                const isSelected = selectedRows.has(invoice.id);
                return (
                  <tr
                    key={invoice.id}
                    onClick={() => toggleRowSelection(invoice.id)}
                    className={`group cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-l-4 border-indigo-600'
                        : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-md border-l-4 border-transparent'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(invoice.id)}
                        className="w-4 h-4 rounded border-2 border-indigo-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg group-hover:shadow-xl transition-shadow">
                          {invoice.invoiceNumber ? invoice.invoiceNumber.substring(0, 2).toUpperCase() : 'IN'}
                        </div>
                        <span className="font-bold text-indigo-700 text-sm group-hover:text-indigo-900 transition-colors">{invoice.invoiceNumber || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                          <Calendar className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <span className="text-sm font-medium">{formatDate(invoice.date)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 text-sm">{invoice.clientName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${
                        invoice.paymentMethod === 'CASH'
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                          : invoice.paymentMethod === 'ONLINE'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : invoice.paymentMethod === 'UPI'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                      }`}>
                        {invoice.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${getStatusBadge(invoice.status)}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                          invoice.status === 'paid' ? 'bg-success-600' :
                          invoice.status === 'cancelled' ? 'bg-danger-600' :
                          'bg-warning-600'
                        }`}></span>
                        {invoice.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-black text-gray-900 text-base">{formatCurrency(invoice.grandTotal)}</div>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleView(invoice); }}
                          className="group/btn p-2 text-blue-600 hover:bg-blue-600 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-600 hover:scale-110 shadow-sm hover:shadow-md"
                          title="View invoice"
                          aria-label="View invoice"
                        >
                          <Eye className="w-4 h-4 group-hover/btn:text-white transition-colors" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadPDF(invoice); }}
                          className="group/btn p-2 text-purple-600 hover:bg-purple-600 rounded-lg transition-all duration-200 border border-purple-200 hover:border-purple-600 hover:scale-110 shadow-sm hover:shadow-md"
                          title="Download PDF"
                          aria-label="Download PDF"
                        >
                          <Download className="w-4 h-4 group-hover/btn:text-white transition-colors" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(invoice); }}
                          className="group/btn p-2 text-green-600 hover:bg-green-600 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-600 hover:scale-110 shadow-sm hover:shadow-md"
                          title="Share via WhatsApp"
                          aria-label="Share via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 group-hover/btn:text-white transition-colors" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(invoice); }}
                          className="group/btn p-2 text-indigo-600 hover:bg-indigo-600 rounded-lg transition-all duration-200 border border-indigo-200 hover:border-indigo-600 hover:scale-110 shadow-sm hover:shadow-md"
                          title="Edit invoice"
                          aria-label="Edit invoice"
                        >
                          <Edit2 className="w-4 h-4 group-hover/btn:text-white transition-colors" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(invoice.id); }}
                          className="group/btn p-2 text-red-600 hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600 hover:scale-110 shadow-sm hover:shadow-md"
                          title="Delete invoice"
                          aria-label="Delete invoice"
                        >
                          <Trash2 className="w-4 h-4 group-hover/btn:text-white transition-colors" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sortedInvoices.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {filteredInvoices.length === 0 && (
          <div className="py-24 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl shadow-xl">
                  <FileText className="w-20 h-20 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {activeFilterCount > 0 ? 'No invoices found' : 'No invoices created yet'}
              </h3>
              <p className="text-base text-gray-600 max-w-md mb-8">
                {activeFilterCount > 0
                  ? 'Try adjusting your search or filter criteria to find what you\'re looking for'
                  : 'Get started by creating your first professional invoice for your clients'}
              </p>
              {activeFilterCount > 0 ? (
                <button
                  onClick={handleClearFilters}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  <X className="w-5 h-5" />
                  Clear All Filters
                </button>
              ) : (
                <button
                  onClick={handleAddNew}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Invoice
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Form Modal */}
      {showModal && (
        <InvoiceFormModal
          invoice={editingInvoice}
          onClose={() => {
            setShowModal(false);
            setEditingInvoice(null);
          }}
          onSave={(invoiceData) => {
            if (editingInvoice) {
              updateInvoice(editingInvoice.id, invoiceData);
            } else {
              addInvoice(invoiceData);
            }
            setShowModal(false);
            setEditingInvoice(null);
          }}
        />
      )}

      {/* Invoice View Modal */}
      {viewingInvoice && (
        <InvoiceViewModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {/* Premium WhatsApp Share Modal */}
      {whatsappModal.show && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => {
            setWhatsappModal({ show: false, invoice: null });
            setWhatsappPhone('');
          }}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative flex items-start gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">Share via WhatsApp</h2>
                  <p className="text-white/90 text-sm font-medium">Send invoice details instantly to your client</p>
                </div>
                <button
                  onClick={() => {
                    setWhatsappModal({ show: false, invoice: null });
                    setWhatsappPhone('');
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Invoice Summary Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border-2 border-indigo-100">
                <h3 className="text-sm font-bold text-indigo-900 mb-4 uppercase tracking-wide">Invoice Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                    <span className="text-gray-600 font-medium">Invoice No:</span>
                    <span className="font-bold text-gray-900">{whatsappModal.invoice?.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                    <span className="text-gray-600 font-medium">Client:</span>
                    <span className="font-bold text-gray-900">{whatsappModal.invoice?.clientName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Amount:</span>
                    <span className="font-black text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{formatCurrency(whatsappModal.invoice?.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">WhatsApp Number *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-gray-900 font-medium"
                    placeholder="+91 9876543210"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                  Enter phone number with country code (e.g., +91 for India)
                </p>
              </div>

              {/* Message Preview */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">Message Preview</label>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 text-sm text-gray-700 whitespace-pre-line max-h-48 overflow-y-auto">
                  <strong className="text-green-700">Invoice Details</strong>
                  {'\n\n'}
                  Invoice No: {whatsappModal.invoice?.invoiceNumber}
                  {'\n'}
                  Date: {formatDate(whatsappModal.invoice?.date)}
                  {'\n'}
                  Client: {whatsappModal.invoice?.clientName}
                  {'\n'}
                  Amount: {formatCurrency(whatsappModal.invoice?.grandTotal)}
                  {'\n'}
                  Status: {whatsappModal.invoice?.status?.toUpperCase()}
                  {'\n'}
                  Payment Method: {whatsappModal.invoice?.paymentMethod}
                  {'\n\n'}
                  <strong className="text-green-700">Thank you for your business!</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={sendWhatsAppMessage}
                  className="group relative flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <MessageCircle className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Send via WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    setWhatsappModal({ show: false, invoice: null });
                    setWhatsappPhone('');
                  }}
                  className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all duration-300 border-2 border-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Import the modal components (will create these next)
import InvoiceFormModal from '../components/InvoiceFormModal';
import InvoiceViewModal from '../components/InvoiceViewModal';

export default Invoices;

