import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { Plus, Edit2, Trash2, TrendingUp, Calendar, FileText, Building2, User, Clock, CheckCircle, TrendingDown, DollarSign, Download, Eye, MessageCircle, X, ArrowRight, XCircle, Search, Filter, FileSpreadsheet, Phone } from 'lucide-react';
import { formatCurrency, formatDate, calculateTotalPaymentsIn, calculateTotalPaymentsOut, calculateBalance, formatDateTime, calculateMilestoneAmount } from '../utils/dataManager';
import { generatePaymentReceiptPDF, previewPaymentReceiptPDF } from '../utils/paymentTemplates';
import { exportPaymentsInToExcel, exportPaymentsInToCSV, showExportSuccess, showExportError } from '../utils/exportUtils';
import FileUpload from '../components/FileUpload';
import AttachmentBadge from '../components/AttachmentBadge';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';

const PaymentsIn = () => {
  const { currentProject, addPaymentIn, updatePaymentIn, deletePaymentIn, addInvoice, data, setCurrentProject } = useData();
  const { isAdmin } = useAuth();
  const { navigate } = useNavigation();
  const [showModal, setShowModal] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [pdfPreviewModal, setPdfPreviewModal] = useState({ show: false, payment: null, pdfUrl: null });
  const [whatsappModal, setWhatsappModal] = useState({ show: false, payment: null });
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'installment',
    description: '',
    clientName: '',
    clientPhone: '', // Store phone number from selected customer
    attachments: [],
    milestoneId: '' // Selected milestone
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, advance, installment
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isCustomClientName, setIsCustomClientName] = useState(false);

  // Get customers from parties
  const customers = useMemo(() => {
    const parties = data?.parties || [];
    return parties.filter(party => party.type === 'customer' || party.type === 'both')
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [data?.parties]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (editingPayment) {
      await updatePaymentIn(editingPayment.id, formData);
    } else {
      const payment = await addPaymentIn(formData);

      // Auto-generate invoice for ALL payments
      if (payment) {
        if (formData.milestoneId) {
          // Generate milestone-based invoice
          await generateMilestoneBill(payment, formData.milestoneId);
        } else {
          // Generate regular invoice for non-milestone payments
          await generateRegularBill(payment);
        }
      }
    }

    resetForm();
  };

  const generateMilestoneBill = async (payment, milestoneId) => {
    const milestone = currentProject.milestones?.find(m => m.id === milestoneId);
    if (!milestone) return;

    // Find next pending milestone
    const currentIndex = currentProject.milestones.findIndex(m => m.id === milestoneId);
    const nextMilestone = currentProject.milestones.find((m, idx) => idx > currentIndex && m.status === 'pending');

    // Calculate milestone amount
    const milestoneAmount = calculateMilestoneAmount(milestone, currentProject.totalCommittedAmount);

    // Create invoice with milestone information
    const invoiceData = {
      clientName: formData.clientName || currentProject.name,
      clientAddress: '',
      clientPhone: '',
      clientEmail: '',
      date: formData.date,
      dueDate: formData.date,
      status: 'paid',
      items: [
        {
          id: Date.now().toString(),
          description: `${milestone.name} (Stage ${currentIndex + 1})`,
          measurement: 'Lump Sum',
          quantity: 1,
          rate: milestoneAmount,
          amount: milestoneAmount
        }
      ],
      subtotal: milestoneAmount,
      gstPercentage: 0,
      gstAmount: 0,
      total: milestoneAmount,
      paymentMethod: 'CASH',
      notes: nextMilestone
        ? `Payment received for ${milestone.name}.\n\nNext Payment Due: ${nextMilestone.name} - ${formatCurrency(calculateMilestoneAmount(nextMilestone, currentProject.totalCommittedAmount))}`
        : `Payment received for ${milestone.name}.\n\nAll milestones completed.`,
      milestoneId: milestoneId,
      paymentId: payment.id
    };

    try {
      await addInvoice(invoiceData);
      console.log('✅ Auto-generated bill for milestone:', milestone.name);
    } catch (error) {
      console.error('Error generating milestone bill:', error);
    }
  };

  const generateRegularBill = async (payment) => {
    const paymentAmount = parseFloat(formData.amount);
    const paymentType = formData.type === 'advance' ? 'Advance Payment' : 'Installment Payment';
    const description = formData.description || `${paymentType} Received`;

    // Create invoice for regular payment
    const invoiceData = {
      clientName: formData.clientName || currentProject.name,
      clientAddress: '',
      clientPhone: '',
      clientEmail: '',
      date: formData.date,
      dueDate: formData.date,
      status: 'paid',
      items: [
        {
          id: Date.now().toString(),
          description: description,
          measurement: 'Lump Sum',
          quantity: 1,
          rate: paymentAmount,
          amount: paymentAmount
        }
      ],
      subtotal: paymentAmount,
      gstPercentage: 0,
      gstAmount: 0,
      total: paymentAmount,
      paymentMethod: 'CASH',
      notes: `Payment Type: ${paymentType}\nPayment Date: ${formatDate(formData.date)}\nProject: ${currentProject.name}${formData.description ? `\n\nDescription: ${formData.description}` : ''}`,
      paymentId: payment.id
    };

    try {
      await addInvoice(invoiceData);
      console.log('✅ Auto-generated invoice for payment:', paymentType);
    } catch (error) {
      console.error('Error generating payment invoice:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'installment',
      description: '',
      clientName: '',
      clientPhone: '',
      attachments: [],
      milestoneId: ''
    });
    setIsCustomClientName(false);
    setEditingPayment(null);
    setShowModal(false);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    const clientName = payment.clientName || '';
    // Check if client name exists in customers list
    const isExistingCustomer = customers.some(c => c.name === clientName);
    setIsCustomClientName(!isExistingCustomer && clientName !== '');

    setFormData({
      amount: payment.amount,
      date: new Date(payment.date).toISOString().split('T')[0],
      type: payment.type,
      description: payment.description || '',
      clientName: clientName,
      clientPhone: payment.clientPhone || '',
      attachments: payment.attachments || [],
      milestoneId: payment.milestoneId || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      deletePaymentIn(id);
    }
  };

  const handleDownloadPDF = (payment) => {
    const settings = data?.settings || {};
    generatePaymentReceiptPDF(payment, currentProject, settings);
  };

  const handlePreviewPDF = async (payment) => {
    const settings = data?.settings || {};
    const pdfBlob = previewPaymentReceiptPDF(payment, currentProject, settings);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfPreviewModal({ show: true, payment, pdfUrl });
  };

  const closePdfPreview = () => {
    if (pdfPreviewModal.pdfUrl) {
      URL.revokeObjectURL(pdfPreviewModal.pdfUrl);
    }
    setPdfPreviewModal({ show: false, payment: null, pdfUrl: null });
  };

  const handleWhatsAppShare = (payment) => {
    setWhatsappModal({ show: true, payment });
    // Pre-fill phone number if available
    setWhatsappPhone(payment.clientPhone || '');
  };

  const sendWhatsAppMessage = () => {
    const payment = whatsappModal.payment;
    if (!payment) return;

    // Validate phone number
    let phoneNumber = whatsappPhone.trim();
    if (!phoneNumber) {
      alert('Please enter a phone number');
      return;
    }

    // Add country code if not present
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+91' + phoneNumber;
    }

    // Get milestone name if applicable
    let milestoneName = '';
    if (payment.milestoneId && currentProject?.milestones) {
      const milestone = currentProject.milestones.find(m => m.id === payment.milestoneId);
      if (milestone) {
        milestoneName = milestone.name;
      }
    }

    // Create WhatsApp message
    const message = `*Payment Receipt*\n\n` +
      `Project: ${currentProject.name}\n` +
      `Date: ${formatDate(payment.date)}\n` +
      `Client: ${payment.clientName || 'N/A'}\n` +
      `Amount: ${formatCurrency(payment.amount)}\n` +
      `Type: ${payment.type === 'advance' ? 'Advance' : 'Installment'}\n` +
      (milestoneName ? `Milestone: ${milestoneName}\n` : '') +
      (payment.description ? `Description: ${payment.description}\n` : '') +
      `\nThank you for your payment!`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Close modal
    setWhatsappModal({ show: false, payment: null });
    setWhatsappPhone('');
  };

  const handleSelectProject = (projectId) => {
    setCurrentProject(projectId);
    setShowProjectSelector(false);
  };

  if (!currentProject) {
    const hasProjects = data?.projects && data.projects.length > 0;

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-2xl mx-auto px-4">
          <Building2 className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Project Selected</h2>
          <p className="text-gray-600 mb-6">
            {!hasProjects
              ? 'You need to create a project first before recording payments.'
              : 'Please select a project to start recording payments.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!hasProjects ? (
              <button
                onClick={() => navigate('projects')}
                className="btn btn-primary flex items-center gap-2 justify-center"
              >
                <Plus className="w-5 h-5" />
                Create Your First Project
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowProjectSelector(true)}
                  className="btn btn-primary flex items-center gap-2 justify-center"
                >
                  <Building2 className="w-5 h-5" />
                  Select Project
                </button>
                <button
                  onClick={() => navigate('projects')}
                  className="btn btn-secondary flex items-center gap-2 justify-center"
                >
                  View All Projects
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Project Selector Modal */}
          {showProjectSelector && hasProjects && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Select a Project</h2>
                    <button
                      onClick={() => setShowProjectSelector(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XCircle className="w-6 h-6 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {data.projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => handleSelectProject(project.id)}
                        className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-primary-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900">{project.name}</h3>
                              {project.description && (
                                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalPaymentsIn = calculateTotalPaymentsIn(currentProject.paymentsIn || []);
  const totalPaymentsOut = calculateTotalPaymentsOut(currentProject.paymentsOut || []);
  const netBalance = calculateBalance(currentProject.paymentsIn || [], currentProject.paymentsOut || []);

  // Filter payments with useMemo for performance
  const filteredPayments = useMemo(() => {
    let filtered = [...(currentProject.paymentsIn || [])];

    // Search filter (client name, description)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        (payment.clientName && payment.clientName.toLowerCase().includes(searchLower)) ||
        (payment.description && payment.description.toLowerCase().includes(searchLower))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.type === typeFilter);
    }

    // Date range filter
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.date);
        const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const end = dateRange.endDate ? new Date(dateRange.endDate) : null;

        if (start && end) {
          return paymentDate >= start && paymentDate <= end;
        } else if (start) {
          return paymentDate >= start;
        } else if (end) {
          return paymentDate <= end;
        }
        return true;
      });
    }

    return filtered;
  }, [currentProject.paymentsIn, searchTerm, typeFilter, dateRange]);

  // Sort payments by date (newest first)
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredPayments]);

  // Count by type
  const typeCounts = useMemo(() => {
    const payments = currentProject.paymentsIn || [];
    return {
      all: payments.length,
      advance: payments.filter(p => p.type === 'advance').length,
      installment: payments.filter(p => p.type === 'installment').length
    };
  }, [currentProject.paymentsIn]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setTypeFilter('all');
    setDateRange({ startDate: '', endDate: '' });
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (typeFilter !== 'all') count++;
    if (dateRange.startDate || dateRange.endDate) count++;
    return count;
  }, [searchTerm, typeFilter, dateRange]);

  // Export handlers
  const handleExportToExcel = useCallback(() => {
    if (!currentProject) {
      showExportError('No project selected');
      return;
    }

    if (filteredPayments.length === 0) {
      showExportError('No data to export');
      return;
    }

    const filename = `Payments_In_${currentProject.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`;
    const success = exportPaymentsInToExcel(
      filteredPayments,
      filename,
      currentProject.name || 'Unknown Project'
    );

    if (success) {
      showExportSuccess(`Exported ${filteredPayments.length} payment(s) to Excel`);
    } else {
      showExportError('Failed to export to Excel');
    }
  }, [filteredPayments, currentProject]);

  const handleExportToCSV = useCallback(() => {
    if (!currentProject) {
      showExportError('No project selected');
      return;
    }

    if (filteredPayments.length === 0) {
      showExportError('No data to export');
      return;
    }

    const filename = `Payments_In_${currentProject.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`;
    const success = exportPaymentsInToCSV(
      filteredPayments,
      filename,
      currentProject.name || 'Unknown Project'
    );

    if (success) {
      showExportSuccess(`Exported ${filteredPayments.length} payment(s) to CSV`);
    } else {
      showExportError('Failed to export to CSV');
    }
  }, [filteredPayments, currentProject]);

  // Pagination hook
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData: paginatedPayments,
    handlePageChange,
    handlePageSizeChange
  } = usePagination(sortedPayments, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-600">{currentProject.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Payments In</h1>
          <p className="text-gray-600 mt-1">Track all incoming payments from clients</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Export Dropdown */}
          <div className="position-relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn btn-secondary d-flex align-items-center gap-2 justify-content-center w-100 w-sm-auto"
              title="Export data"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Export
            </button>
            {/* Dropdown Menu */}
            {showExportMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="position-fixed top-0 start-0 w-100 h-100"
                  style={{ zIndex: 999 }}
                  onClick={() => setShowExportMenu(false)}
                />
                {/* Dropdown Content */}
                <div
                  className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border"
                  style={{
                    width: '200px',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleExportToExcel();
                        setShowExportMenu(false);
                      }}
                      className="w-100 px-4 py-2 text-start border-0 bg-transparent d-flex align-items-center gap-2"
                      style={{ fontSize: '0.875rem', color: '#374151' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FileSpreadsheet style={{ width: '16px', height: '16px', color: '#10b981' }} />
                      Export to Excel
                    </button>
                    <button
                      onClick={() => {
                        handleExportToCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-100 px-4 py-2 text-start border-0 bg-transparent d-flex align-items-center gap-2"
                      style={{ fontSize: '0.875rem', color: '#374151' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FileText style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                      Export to CSV
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2 justify-center text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Add</span>
            <span className="hidden sm:inline">Payment</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Payments In */}
        <div className="card bg-gradient-to-br from-success-500 to-success-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm font-medium">Total Payments In</p>
              <h2 className="text-3xl font-bold mt-2">{formatCurrency(totalPaymentsIn)}</h2>
              <p className="text-success-100 mt-2">{(currentProject.paymentsIn || []).length} transactions</p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">
              <TrendingUp className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Total Expense (Payments Out) */}
        <div className="card bg-gradient-to-br from-danger-500 to-danger-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100 text-sm font-medium">Total Expense</p>
              <h2 className="text-3xl font-bold mt-2">{formatCurrency(totalPaymentsOut)}</h2>
              <p className="text-danger-100 mt-2">{(currentProject.paymentsOut || []).length} transactions</p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">
              <TrendingDown className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Net Balance */}
        <div className={`card bg-gradient-to-br ${netBalance >= 0 ? 'from-primary-500 to-primary-700' : 'from-warning-500 to-warning-700'} text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${netBalance >= 0 ? 'text-primary-100' : 'text-warning-100'} text-sm font-medium`}>Net Balance</p>
              <h2 className="text-3xl font-bold mt-2">{formatCurrency(netBalance)}</h2>
              <p className={`${netBalance >= 0 ? 'text-primary-100' : 'text-warning-100'} mt-2`}>
                {netBalance >= 0 ? 'Positive balance' : 'Negative balance'}
              </p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">
              <DollarSign className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="space-y-4">
        {/* Filter Toggle and Search Bar */}
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
                placeholder="Search client or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 pr-10 w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
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
                  Filter Payments
                </h3>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-danger-600 hover:text-danger-700 font-medium"
                >
                  Clear All Filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Type Filter */}
                <div>
                  <label className="label">Payment Type</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTypeFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        typeFilter === 'all'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      All ({typeCounts.all})
                    </button>
                    <button
                      onClick={() => setTypeFilter('advance')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        typeFilter === 'advance'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Advance ({typeCounts.advance})
                    </button>
                    <button
                      onClick={() => setTypeFilter('installment')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        typeFilter === 'installment'
                          ? 'bg-success-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Installment ({typeCounts.installment})
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
                    {typeFilter !== 'all' && (
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center gap-2">
                        Type: {typeFilter === 'advance' ? 'Advance' : 'Installment'}
                        <button
                          onClick={() => setTypeFilter('all')}
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
            Showing <span className="font-semibold text-gray-900">{filteredPayments.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{(currentProject.paymentsIn || []).length}</span> payments
          </p>
        </div>
      </div>

      {/* Payments List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Files</th>
                {isAdmin() && (
                  <>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created By</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Modified</th>
                  </>
                )}
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(payment.date)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.type === 'advance'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-success-100 text-success-700'
                      }`}>
                        {payment.type === 'advance' ? 'Advance' : 'Installment'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{payment.clientName || '-'}</span>
                        {payment.clientPhone && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {payment.clientPhone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {payment.description || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <AttachmentBadge attachments={payment.attachments} />
                    </td>
                    {isAdmin() && (
                      <>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{payment.createdBy || 'Unknown'}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDateTime(payment.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{payment.updatedBy || payment.createdBy || 'Unknown'}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDateTime(payment.updatedAt || payment.createdAt)}
                          </div>
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-right font-semibold text-success-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePreviewPDF(payment)}
                          className="p-2 text-info-600 hover:bg-info-50 rounded-lg transition-colors"
                          title="Preview PDF"
                          aria-label="Preview payment receipt PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(payment)}
                          className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                          title="Download PDF"
                          aria-label="Download payment receipt PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(payment)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Share via WhatsApp"
                          aria-label="Share payment receipt via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(payment)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                          aria-label="Edit payment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          title="Delete"
                          aria-label="Delete payment"
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

        {/* Empty State */}
        {filteredPayments.length === 0 && (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <TrendingUp className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium text-gray-600">
                {activeFilterCount > 0 ? 'No payments found' : 'No payments received yet'}
              </p>
              <p className="text-sm mt-2 text-gray-500">
                {activeFilterCount > 0
                  ? 'Try adjusting your search or filter criteria'
                  : 'Click "Add Payment" to record your first payment'}
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

        {/* Pagination */}
        {sortedPayments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowModal(false);
            setEditingPayment(null);
            setIsCustomClientName(false);
            setFormData({
              amount: '',
              date: new Date().toISOString().split('T')[0],
              type: 'installment',
              description: '',
              clientName: '',
              clientPhone: '',
              attachments: [],
              milestoneId: ''
            });
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingPayment ? 'Edit Payment' : 'Add New Payment'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Payment Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="advance">Advance Payment</option>
                    <option value="installment">Installment</option>
                  </select>
                </div>

                {/* Milestone Selection */}
                {currentProject.milestones && currentProject.milestones.length > 0 && (
                  <div>
                    <label className="label">Project Milestone / Stage</label>
                    <select
                      value={formData.milestoneId}
                      onChange={(e) => {
                        const selectedMilestone = currentProject.milestones.find(m => m.id === e.target.value);
                        setFormData({
                          ...formData,
                          milestoneId: e.target.value,
                          amount: selectedMilestone ? calculateMilestoneAmount(selectedMilestone, currentProject.totalCommittedAmount).toString() : formData.amount
                        });
                      }}
                      className="input"
                    >
                      <option value="">-- Select Milestone (Optional) --</option>
                      {currentProject.milestones.map((milestone, index) => (
                        <option key={milestone.id} value={milestone.id}>
                          Stage {index + 1}: {milestone.name} - {
                            milestone.amountType === 'percentage'
                              ? `${milestone.value}% (${formatCurrency(calculateMilestoneAmount(milestone, currentProject.totalCommittedAmount))})`
                              : formatCurrency(milestone.value)
                          }
                          {milestone.status === 'completed' ? ' ✓' : ''}
                        </option>
                      ))}
                    </select>
                    {formData.milestoneId && (
                      <p className="text-sm text-primary-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Auto-bill will be generated for this milestone
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="label">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Client Name</label>
                  {customers.length > 0 ? (
                    <>
                      {!isCustomClientName ? (
                        <select
                          value={formData.clientName}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setIsCustomClientName(true);
                              setFormData({
                                ...formData,
                                clientName: '',
                                clientPhone: ''
                              });
                            } else {
                              const selectedCustomer = customers.find(c => c.name === e.target.value);
                              setFormData({
                                ...formData,
                                clientName: e.target.value,
                                clientPhone: selectedCustomer?.phone || ''
                              });
                            }
                          }}
                          className="input"
                        >
                          <option value="">-- Select Customer --</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.name}>
                              {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                            </option>
                          ))}
                          <option value="__custom__">+ Enter Custom Name</option>
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.clientName}
                            onChange={(e) => setFormData({ ...formData, clientName: e.target.value, clientPhone: '' })}
                            className="input"
                            placeholder="Enter custom client name"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomClientName(false);
                              setFormData({ ...formData, clientName: '', clientPhone: '' });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="Switch back to dropdown"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value, clientPhone: '' })}
                      className="input"
                      placeholder="Enter client name"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {customers.length > 0
                      ? isCustomClientName
                        ? 'Entering custom name. Click X to select from existing customers'
                        : 'Select from existing customers or add a new one'
                      : 'No customers found. Add customers in Parties > Customers'}
                  </p>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Enter payment description"
                  />
                </div>

                {/* File Upload */}
                <FileUpload
                  attachments={formData.attachments}
                  onAttachmentsChange={(attachments) => setFormData({ ...formData, attachments })}
                  maxFiles={5}
                />

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingPayment ? 'Update Payment' : 'Add Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewModal.show && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={closePdfPreview}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success-100 rounded-full">
                  <FileText className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Receipt Preview</h2>
                  <p className="text-sm text-gray-500">
                    {formatDate(pdfPreviewModal.payment?.date)} - {formatCurrency(pdfPreviewModal.payment?.amount)}
                  </p>
                </div>
              </div>
              <button
                onClick={closePdfPreview}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <Trash2 className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              {pdfPreviewModal.pdfUrl && (
                <iframe
                  src={pdfPreviewModal.pdfUrl}
                  className="w-full h-full min-h-[600px] bg-white rounded-lg shadow"
                  title="Payment Receipt PDF Preview"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  handleDownloadPDF(pdfPreviewModal.payment);
                  closePdfPreview();
                }}
                className="btn btn-primary flex items-center gap-2 flex-1"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={closePdfPreview}
                className="btn btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {whatsappModal.show && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setWhatsappModal({ show: false, payment: null });
            setWhatsappPhone('');
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Share via WhatsApp</h2>
                    <p className="text-sm text-gray-500">Send payment receipt to client</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setWhatsappModal({ show: false, payment: null });
                    setWhatsappPhone('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-semibold text-gray-900">{formatDate(whatsappModal.payment?.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-semibold text-gray-900">{whatsappModal.payment?.clientName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-success-600">{formatCurrency(whatsappModal.payment?.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold text-gray-900">
                      {whatsappModal.payment?.type === 'advance' ? 'Advance' : 'Installment'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="mb-6">
                <label className="label">WhatsApp Number *</label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="input"
                  placeholder="+91 9876543210"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter phone number with country code (e.g., +91 for India)
                </p>
              </div>

              {/* Message Preview */}
              <div className="mb-6">
                <label className="label">Message Preview</label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line max-h-40 overflow-y-auto">
                  <strong>Payment Receipt</strong>
                  {'\n\n'}
                  Project: {currentProject?.name}
                  {'\n'}
                  Date: {formatDate(whatsappModal.payment?.date)}
                  {'\n'}
                  Client: {whatsappModal.payment?.clientName || 'N/A'}
                  {'\n'}
                  Amount: {formatCurrency(whatsappModal.payment?.amount)}
                  {'\n'}
                  Type: {whatsappModal.payment?.type === 'advance' ? 'Advance' : 'Installment'}
                  {whatsappModal.payment?.milestoneId && currentProject?.milestones && (() => {
                    const milestone = currentProject.milestones.find(m => m.id === whatsappModal.payment.milestoneId);
                    return milestone ? `\nMilestone: ${milestone.name}` : '';
                  })()}
                  {whatsappModal.payment?.description ? `\nDescription: ${whatsappModal.payment.description}` : ''}
                  {'\n\n'}
                  Thank you for your payment!
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={sendWhatsAppMessage}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send via WhatsApp
                </button>
                <button
                  onClick={() => {
                    setWhatsappModal({ show: false, payment: null });
                    setWhatsappPhone('');
                  }}
                  className="btn btn-secondary flex-1"
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

export default PaymentsIn;

