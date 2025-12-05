import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, FileCheck, Eye, Calendar, DollarSign, Search, Filter, RefreshCw, Download, Grid, List, X, FileSpreadsheet, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/dataManager.jsx';
import { generateQuotationPDF } from '../utils/quotationTemplates.jsx';
import { exportToExcel, exportToCSV, formatQuotationsForExport, showExportSuccess, showExportError } from '../utils/exportUtils';
import QuotationFormModal from '../components/QuotationFormModal';
import QuotationViewModal from '../components/QuotationViewModal';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';

const Quotations = () => {
  const { data, addQuotation, updateQuotation, deleteQuotation, addInvoice } = useData();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const quotations = data.quotations || [];

  // Filter quotations with useMemo for performance
  const filteredQuotations = useMemo(() => {
    let filtered = [...quotations];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(quotation =>
        (quotation.clientName && quotation.clientName.toLowerCase().includes(searchLower)) ||
        (quotation.quotationNumber && quotation.quotationNumber.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(quotation => quotation.status === filterStatus);
    }

    // Date range filter
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(quotation => {
        const quotationDate = new Date(quotation.date);
        const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const end = dateRange.endDate ? new Date(dateRange.endDate) : null;

        if (start && end) {
          return quotationDate >= start && quotationDate <= end;
        } else if (start) {
          return quotationDate >= start;
        } else if (end) {
          return quotationDate <= end;
        }
        return true;
      });
    }

    return filtered;
  }, [quotations, searchTerm, filterStatus, dateRange]);

  // Sort filtered quotations by date (newest first)
  const sortedQuotations = useMemo(() => {
    return [...filteredQuotations].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredQuotations]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: quotations.length,
      draft: quotations.filter(q => q.status === 'draft').length,
      sent: quotations.filter(q => q.status === 'sent').length,
      accepted: quotations.filter(q => q.status === 'accepted').length,
      rejected: quotations.filter(q => q.status === 'rejected').length
    };
  }, [quotations]);

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

  // Export handlers
  const handleExportToExcel = useCallback(() => {
    if (filteredQuotations.length === 0) {
      showExportError('No data to export');
      return;
    }

    const formattedData = formatQuotationsForExport(filteredQuotations);
    const success = exportToExcel(
      formattedData,
      `Quotations_${new Date().toISOString().split('T')[0]}`,
      'Quotations'
    );

    if (success) {
      showExportSuccess(`Exported ${filteredQuotations.length} quotation(s) to Excel`);
    } else {
      showExportError('Failed to export to Excel');
    }
  }, [filteredQuotations]);

  const handleExportToCSV = useCallback(() => {
    if (filteredQuotations.length === 0) {
      showExportError('No data to export');
      return;
    }

    const formattedData = formatQuotationsForExport(filteredQuotations);
    const success = exportToCSV(
      formattedData,
      `Quotations_${new Date().toISOString().split('T')[0]}`
    );

    if (success) {
      showExportSuccess(`Exported ${filteredQuotations.length} quotation(s) to CSV`);
    } else {
      showExportError('Failed to export to CSV');
    }
  }, [filteredQuotations]);

  // Pagination hook
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedQuotations,
    handlePageChange,
    handlePageSizeChange
  } = usePagination(sortedQuotations, 10);

  const handleAddNew = () => {
    setEditingQuotation(null);
    setShowModal(true);
  };

  const handleEdit = (quotation) => {
    setEditingQuotation(quotation);
    setShowModal(true);
  };

  const handleView = (quotation) => {
    setViewingQuotation(quotation);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      deleteQuotation(id);
    }
  };

  const handleConvertToInvoice = (quotation) => {
    if (window.confirm('Convert this quotation to an invoice?')) {
      const invoiceData = {
        ...quotation,
        status: 'pending',
        // Remove quotation-specific fields
        quotationNumber: undefined,
        expiryDate: undefined,
        // Will get new invoice number automatically
      };
      addInvoice(invoiceData);
      alert('Quotation converted to invoice successfully!');
    }
  };

  const handleDownloadPDF = (quotation) => {
    generateQuotationPDF(quotation);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      accepted: 'bg-success-100 text-success-700',
      rejected: 'bg-danger-100 text-danger-700',
      expired: 'bg-warning-100 text-warning-700'
    };
    return badges[status] || badges.draft;
  };

  const getStatusDot = (status) => {
    const dots = {
      draft: 'bg-gray-600',
      sent: 'bg-blue-600',
      accepted: 'bg-success-600',
      rejected: 'bg-danger-600',
      expired: 'bg-warning-600'
    };
    return dots[status] || dots.draft;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
            Quotations
          </h1>
          <p className="text-gray-600 mt-2 ml-14">Create and manage professional quotations for your clients</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn btn-secondary flex items-center gap-2 justify-center w-full sm:w-auto text-sm sm:text-base"
              title="Export data"
            >
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
              Export
            </button>
            {/* Dropdown Menu */}
            {showExportMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                {/* Dropdown Content */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleExportToExcel();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      Export to Excel
                    </button>
                    <button
                      onClick={() => {
                        handleExportToCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      Export to CSV
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleAddNew}
            className="btn btn-primary flex items-center gap-2 justify-center shadow-lg hover:shadow-xl transition-shadow text-sm sm:text-base"
            aria-label="Create new quotation"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">New</span>
            <span className="hidden sm:inline">Quotation</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Quotations Card */}
        <div className="card hover:shadow-lg transition-shadow border-l-4 border-gray-500">
          {/* Line 1: Label and Icon */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Total Quotations</p>
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileCheck className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          {/* Line 2: Value and Additional Info */}
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-gray-900">{quotations.length}</p>
            <p className="text-xs text-gray-500">All time</p>
          </div>
        </div>

        {/* Sent Card */}
        <div className="card hover:shadow-lg transition-shadow border-l-4 border-blue-500">
          {/* Line 1: Label and Icon */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Sent</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          {/* Line 2: Value and Additional Info */}
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-blue-600">
              {quotations.filter(q => q.status === 'sent').length}
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(quotations.filter(q => q.status === 'sent').reduce((sum, q) => sum + (q.grandTotal || 0), 0))}
            </p>
          </div>
        </div>

        {/* Accepted Card */}
        <div className="card hover:shadow-lg transition-shadow border-l-4 border-success-500">
          {/* Line 1: Label and Icon */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Accepted</p>
            <div className="p-2 bg-success-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-success-600" />
            </div>
          </div>
          {/* Line 2: Value and Additional Info */}
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-success-600">
              {quotations.filter(q => q.status === 'accepted').length}
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(quotations.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.grandTotal || 0), 0))}
            </p>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="card hover:shadow-lg transition-shadow border-l-4 border-danger-500">
          {/* Line 1: Label and Icon */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Rejected</p>
            <div className="p-2 bg-danger-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-danger-600" />
            </div>
          </div>
          {/* Line 2: Value and Additional Info */}
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-danger-600">
              {quotations.filter(q => q.status === 'rejected').length}
            </p>
            <p className="text-xs text-gray-500">Lost opportunities</p>
          </div>
        </div>

        {/* Total Value Card */}
        <div className="card hover:shadow-lg transition-shadow border-l-4 border-purple-500">
          {/* Line 1: Label and Icon */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-600">Total Value</p>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          {/* Line 2: Value and Additional Info */}
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0))}
            </p>
            <p className="text-xs text-gray-500">Gross amount</p>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="space-y-4">
        {/* Filter Toggle, Search Bar, and View Mode */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`btn ${showFilterPanel ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2 justify-center`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-danger-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by quotation number or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showFilterPanel ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="card bg-gray-50 border-2 border-primary-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-600" />
                  Filter Quotations
                </h3>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-danger-600 hover:text-danger-700 font-medium"
                >
                  Clear All Filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="label">Quotation Status</label>
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
                      onClick={() => setFilterStatus('draft')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === 'draft'
                          ? 'bg-gray-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Draft ({statusCounts.draft})
                    </button>
                    <button
                      onClick={() => setFilterStatus('sent')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === 'sent'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Sent ({statusCounts.sent})
                    </button>
                    <button
                      onClick={() => setFilterStatus('accepted')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === 'accepted'
                          ? 'bg-success-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Accepted ({statusCounts.accepted})
                    </button>
                    <button
                      onClick={() => setFilterStatus('rejected')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === 'rejected'
                          ? 'bg-danger-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Rejected ({statusCounts.rejected})
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
            Showing <span className="font-semibold text-gray-900">{filteredQuotations.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{quotations.length}</span> quotations
          </p>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedQuotations.map((quotation) => (
              <div
                key={quotation.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck className="w-5 h-5 text-white" />
                        <span className="text-white font-bold text-lg">{quotation.quotationNumber}</span>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(quotation.status)}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${getStatusDot(quotation.status)}`}></span>
                        {quotation.status?.toUpperCase() || 'DRAFT'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-2xl font-bold">{formatCurrency(quotation.grandTotal)}</div>
                      {quotation.gstEnabled && (
                        <div className="text-xs text-blue-100 mt-1">Inc. GST</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Client Info */}
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Client</div>
                    <div className="font-semibold text-gray-900">{quotation.clientName}</div>
                    {quotation.clientPhone && (
                      <div className="text-sm text-gray-600 mt-1">{quotation.clientPhone}</div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date</div>
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(quotation.date)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expiry</div>
                      <div className="text-sm text-gray-700">
                        {formatDate(quotation.expiryDate)}
                      </div>
                      {new Date(quotation.expiryDate) < new Date() && quotation.status !== 'accepted' && (
                        <span className="text-xs text-danger-600 font-semibold">Expired</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleView(quotation)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="View quotation"
                      aria-label="View quotation"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(quotation)}
                      className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                      title="Download PDF"
                      aria-label="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {quotation.status === 'accepted' && (
                      <button
                        onClick={() => handleConvertToInvoice(quotation)}
                        className="p-2 text-success-600 hover:bg-success-100 rounded-lg transition-colors"
                        title="Convert to invoice"
                        aria-label="Convert to invoice"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(quotation)}
                      className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="Edit quotation"
                      aria-label="Edit quotation"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(quotation.id)}
                      className="p-2 text-danger-600 hover:bg-danger-100 rounded-lg transition-colors"
                      title="Delete quotation"
                      aria-label="Delete quotation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Quotation No.</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Expiry</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Client</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Amount</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuotations.map((quotation) => (
                    <tr key={quotation.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-semibold text-blue-600 text-base">{quotation.quotationNumber}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(quotation.date)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-700">
                          {formatDate(quotation.expiryDate)}
                        </div>
                        {new Date(quotation.expiryDate) < new Date() && quotation.status !== 'accepted' && (
                          <span className="text-xs text-danger-600">Expired</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{quotation.clientName}</div>
                        {quotation.clientPhone && (
                          <div className="text-xs text-gray-500 mt-1">{quotation.clientPhone}</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusBadge(quotation.status)}`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${getStatusDot(quotation.status)}`}></span>
                          {quotation.status?.toUpperCase() || 'DRAFT'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-bold text-gray-900 text-base">{formatCurrency(quotation.grandTotal)}</div>
                        {quotation.gstEnabled && (
                          <div className="text-xs text-gray-500 mt-1">Inc. GST</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleView(quotation)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View quotation"
                            aria-label="View quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(quotation)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Download PDF"
                            aria-label="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {quotation.status === 'accepted' && (
                            <button
                              onClick={() => handleConvertToInvoice(quotation)}
                              className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                              title="Convert to invoice"
                              aria-label="Convert to invoice"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(quotation)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit quotation"
                            aria-label="Edit quotation"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(quotation.id)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Delete quotation"
                            aria-label="Delete quotation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {sortedQuotations.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {filteredQuotations.length === 0 && (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <FileCheck className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium text-gray-600">
                {activeFilterCount > 0 ? 'No quotations found' : 'No quotations created yet'}
              </p>
              <p className="text-sm mt-2 text-gray-500">
                {activeFilterCount > 0
                  ? 'Try adjusting your search or filter criteria'
                  : 'Click "Create New Quotation" to generate your first quotation'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="btn btn-secondary mt-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <QuotationFormModal
          quotation={editingQuotation}
          onClose={() => {
            setShowModal(false);
            setEditingQuotation(null);
          }}
          onSave={(quotationData) => {
            if (editingQuotation) {
              updateQuotation(editingQuotation.id, quotationData);
            } else {
              addQuotation(quotationData);
            }
            setShowModal(false);
            setEditingQuotation(null);
          }}
        />
      )}

      {viewingQuotation && (
        <QuotationViewModal
          quotation={viewingQuotation}
          onClose={() => setViewingQuotation(null)}
          onConvertToInvoice={() => {
            handleConvertToInvoice(viewingQuotation);
            setViewingQuotation(null);
          }}
        />
      )}
    </div>
  );
};

export default Quotations;

