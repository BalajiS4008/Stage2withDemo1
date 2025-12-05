import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { Plus, Edit2, Trash2, TrendingDown, Calendar, FileText, Tag, Building2, User, Clock, Upload, CheckCircle, XCircle, AlertCircle, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { formatCurrency, formatDate, calculateTotalPaymentsOut, formatDateTime } from '../utils/dataManager';
import { exportToExcel, exportToCSV, formatPaymentsOutForExport, showExportSuccess, showExportError } from '../utils/exportUtils';
import FileUpload from '../components/FileUpload';
import AttachmentBadge from '../components/AttachmentBadge';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import PaymentOutImport from '../components/PaymentOutImport';
import PaymentOutApproval from '../components/PaymentOutApproval';

const PaymentsOut = () => {
  const { currentProject, data, addPaymentOut, updatePaymentOut, deletePaymentOut, approvePaymentOut, rejectPaymentOut, bulkAddPaymentsOut, setCurrentProject } = useData();
  const { isAdmin, user } = useAuth();
  const { navigate } = useNavigation();
  const [showModal, setShowModal] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    departmentId: '',
    description: '',
    category: 'material',
    vendor: '',
    attachments: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!formData.departmentId) {
      alert('Please select a department');
      return;
    }

    if (editingPayment) {
      updatePaymentOut(editingPayment.id, formData);
    } else {
      addPaymentOut(formData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      departmentId: '',
      description: '',
      category: 'material',
      vendor: '',
      attachments: []
    });
    setEditingPayment(null);
    setShowModal(false);
  };

  const handleImport = async (importedData) => {
    try {
      const payments = importedData.map(row => ({
        amount: row.amount,
        date: row.date,
        departmentId: row.departmentId,
        category: row.category,
        description: row.description,
        vendor: row.vendor,
        attachments: []
      }));

      await bulkAddPaymentsOut(payments);
      setShowImportModal(false);
      alert(`Successfully imported ${payments.length} payment entries!`);
    } catch (error) {
      console.error('Error importing payments:', error);
      alert('Error importing payments. Please try again.');
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm('Are you sure you want to approve this expense entry?')) {
      await approvePaymentOut(id);
    }
  };

  const handleReject = async (id, reason) => {
    await rejectPaymentOut(id, reason);
  };

  const handleEdit = (payment) => {
    // Only allow editing if user is admin or if payment is pending and created by user
    if (payment.approvalStatus === 'approved' && user?.role !== 'admin') {
      alert('Cannot edit approved expenses');
      return;
    }

    setEditingPayment(payment);
    setFormData({
      amount: payment.amount,
      date: new Date(payment.date).toISOString().split('T')[0],
      departmentId: payment.departmentId,
      description: payment.description || '',
      category: payment.category || 'material',
      vendor: payment.vendor || '',
      attachments: payment.attachments || []
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      deletePaymentOut(id);
    }
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
              ? 'You need to create a project first before adding expenses.'
              : 'Please select a project to start adding expenses.'}
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

  const getDepartmentName = (departmentId) => {
    const dept = currentProject.departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'Unknown';
  };

  // Calculate total expenses (calculateTotalPaymentsOut now filters for approved only)
  const totalExpenses = calculateTotalPaymentsOut(currentProject.paymentsOut || []);

  // Filter payments by status
  const filteredPayments = useMemo(() => {
    return (currentProject.paymentsOut || []).filter(payment => {
      if (statusFilter === 'all') return true;
      return payment.approvalStatus === statusFilter;
    });
  }, [currentProject.paymentsOut, statusFilter]);

  // Sort payments by date (newest first)
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredPayments]);

  // Count by status
  const pendingCount = (currentProject.paymentsOut || []).filter(p => p.approvalStatus === 'pending').length;
  const approvedCount = (currentProject.paymentsOut || []).filter(p => p.approvalStatus === 'approved').length;
  const rejectedCount = (currentProject.paymentsOut || []).filter(p => p.approvalStatus === 'rejected').length;

  // Export handlers
  const handleExportToExcel = useCallback(() => {
    if (filteredPayments.length === 0) {
      showExportError('No data to export');
      return;
    }

    const departmentsObj = (data.departments || []).reduce((acc, dept) => {
      acc[dept.id] = dept;
      return acc;
    }, {});

    const formattedData = formatPaymentsOutForExport(filteredPayments, departmentsObj);
    const success = exportToExcel(
      formattedData,
      `Payments_Out_${currentProject.name}_${new Date().toISOString().split('T')[0]}`,
      'Payments Out'
    );

    if (success) {
      showExportSuccess(`Exported ${filteredPayments.length} expense(s) to Excel`);
    } else {
      showExportError('Failed to export to Excel');
    }
  }, [filteredPayments, currentProject.name, data.departments]);

  const handleExportToCSV = useCallback(() => {
    if (filteredPayments.length === 0) {
      showExportError('No data to export');
      return;
    }

    const departmentsObj = (data.departments || []).reduce((acc, dept) => {
      acc[dept.id] = dept;
      return acc;
    }, {});

    const formattedData = formatPaymentsOutForExport(filteredPayments, departmentsObj);
    const success = exportToCSV(
      formattedData,
      `Payments_Out_${currentProject.name}_${new Date().toISOString().split('T')[0]}`
    );

    if (success) {
      showExportSuccess(`Exported ${filteredPayments.length} expense(s) to CSV`);
    } else {
      showExportError('Failed to export to CSV');
    }
  }, [filteredPayments, currentProject.name, data.departments]);

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
          <h1 className="text-3xl font-bold text-gray-900">Payments Out</h1>
          <p className="text-gray-600 mt-1">Track all expenses and outgoing payments</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative group">
            <button
              className="btn btn-secondary flex items-center gap-2 justify-center w-full sm:w-auto"
              title="Export data"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Export
            </button>
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-2">
                <button
                  onClick={handleExportToExcel}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Export to Excel
                </button>
                <button
                  onClick={handleExportToCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  Export to CSV
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-outline-primary flex items-center gap-2 justify-center text-sm sm:text-base"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Import</span>
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2 justify-center text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Add</span>
            <span className="hidden sm:inline">Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards - Single Line with Horizontal Scroll */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          <div className="card bg-gradient-to-br from-danger-500 to-danger-700 text-white min-w-[280px] flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-danger-100 text-sm font-medium">Total Approved</p>
                <h2 className="text-3xl font-bold mt-2">{formatCurrency(totalExpenses)}</h2>
                <p className="text-danger-100 mt-1 text-sm">{approvedCount} expenses</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <TrendingDown className="w-8 h-8" />
              </div>
            </div>
          </div>

          {isAdmin() && (
            <>
              <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white min-w-[280px] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Pending Approval</p>
                    <h2 className="text-3xl font-bold mt-2">{pendingCount}</h2>
                    <p className="text-yellow-100 mt-1 text-sm">Awaiting review</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Clock className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white min-w-[280px] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Approved</p>
                    <h2 className="text-3xl font-bold mt-2">{approvedCount}</h2>
                    <p className="text-green-100 mt-1 text-sm">Processed</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white min-w-[280px] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Rejected</p>
                    <h2 className="text-3xl font-bold mt-2">{rejectedCount}</h2>
                    <p className="text-red-100 mt-1 text-sm">Needs revision</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl">
                    <XCircle className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="card">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({(currentProject.paymentsOut || []).length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {statusFilter === 'pending' && isAdmin() ? 'Pending Approvals' : 'Expense History'}
        </h3>

        {/* Pending Approvals Table (Admin Only) */}
        {statusFilter === 'pending' && isAdmin() ? (
          <div className="overflow-auto -mx-6 px-6 border border-gray-200 rounded-lg" style={{ maxHeight: '600px', scrollBehavior: 'smooth' }}>
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Vendor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Submitted By</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {paginatedPayments.map((payment) => (
                  <PaymentOutApproval
                    key={payment.id}
                    payment={payment}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    getDepartmentName={getDepartmentName}
                  />
                ))}
                {paginatedPayments.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-400">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium text-gray-600">No pending approvals</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          /* Regular Expenses Table */
          <div className="overflow-auto -mx-6 px-6 border border-gray-200 rounded-lg" style={{ maxHeight: '600px', scrollBehavior: 'smooth' }}>
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Vendor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Files</th>
                    {isAdmin() && (
                      <>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Created By</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Last Modified</th>
                      </>
                    )}
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 whitespace-nowrap bg-gray-50">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className={`border-b border-gray-100 hover:bg-gray-50 ${
                    payment.approvalStatus === 'rejected' ? 'bg-red-50/30' : ''
                  }`}>
                    <td className="py-3 px-4 text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(payment.date)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {getDepartmentName(payment.departmentId)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.category === 'material'
                          ? 'bg-blue-100 text-blue-700'
                          : payment.category === 'labor'
                          ? 'bg-green-100 text-green-700'
                          : payment.category === 'equipment'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.category || 'Other'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm max-w-xs truncate">
                      {payment.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {payment.vendor || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.approvalStatus === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : payment.approvalStatus === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.approvalStatus === 'approved' ? 'Approved' :
                         payment.approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                      {payment.approvalStatus === 'rejected' && payment.rejectionReason && (
                        <div className="mt-1">
                          <div className="flex items-start gap-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{payment.rejectionReason}</span>
                          </div>
                        </div>
                      )}
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
                    <td className="py-3 px-4 text-right font-semibold text-danger-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {(payment.approvalStatus !== 'approved' || isAdmin()) && (
                          <button
                            onClick={() => handleEdit(payment)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                            aria-label="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {(payment.approvalStatus !== 'approved' || isAdmin()) && (
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Delete"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {paginatedPayments.length === 0 && (
                <tr>
                  <td colSpan={isAdmin() ? "11" : "8"} className="py-12 text-center text-gray-400">
                    <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No expenses recorded yet</p>
                    <p className="text-sm mt-1">Click "Add Expense" to record your first expense</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingPayment ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Department *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Department</option>
                    {currentProject.departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="material">Material</option>
                    <option value="labor">Labor</option>
                    <option value="equipment">Equipment</option>
                    <option value="transport">Transport</option>
                    <option value="other">Other</option>
                  </select>
                </div>

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
                  <label className="label">Vendor/Supplier</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="input"
                    placeholder="Enter vendor or supplier name"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Enter expense description"
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
                    {editingPayment ? 'Update Expense' : 'Add Expense'}
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

      {/* Import Modal */}
      {showImportModal && (
        <PaymentOutImport
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
          departments={currentProject.departments}
        />
      )}
    </div>
  );
};

export default PaymentsOut;

