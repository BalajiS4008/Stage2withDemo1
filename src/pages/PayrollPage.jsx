import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  Wallet,
  Search,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import {
  PAYROLL_STATUS,
  PAYMENT_METHODS,
  getPayrollStatusColor,
  calculateNetPay,
  formatDate
} from '../utils/laborUtils';
import { deletePayroll } from '../db/dexieDB';
import ProcessPayrollModal from '../components/payroll/ProcessPayrollModal';

const PayrollPage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allPayroll = useMemo(() => data.payroll || [], [data.payroll]);
  const allWorkers = useMemo(() => data.workers || [], [data.workers]);
  const allProjects = useMemo(() => data.projects || [], [data.projects]);

  // Get worker name
  const getWorkerName = (workerId) => {
    const worker = allWorkers.find(w => w.id === workerId);
    return worker ? worker.name : 'Unknown Worker';
  };

  // Get worker code
  const getWorkerCode = (workerId) => {
    const worker = allWorkers.find(w => w.id === workerId);
    return worker ? worker.workerCode : '';
  };

  // Get project name
  const getProjectName = (projectId) => {
    if (!projectId) return 'N/A';
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Filter and sort payroll
  const filteredPayroll = useMemo(() => {
    let filtered = allPayroll;

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.paymentStatus === selectedStatus);
    }

    // Worker filter
    if (selectedWorker !== 'all') {
      filtered = filtered.filter(p => p.workerId === parseInt(selectedWorker));
    }

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(p => p.projectId === parseInt(selectedProject));
    }

    // Month filter
    if (selectedMonth) {
      filtered = filtered.filter(p => {
        const payPeriodStart = new Date(p.payPeriodStart);
        const selectedDate = new Date(selectedMonth);
        return payPeriodStart.getMonth() === selectedDate.getMonth() &&
               payPeriodStart.getFullYear() === selectedDate.getFullYear();
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => {
        const workerName = getWorkerName(p.workerId).toLowerCase();
        const workerCode = getWorkerCode(p.workerId).toLowerCase();
        const payrollNumber = (p.payrollNumber || '').toLowerCase();
        return (
          workerName.includes(searchQuery.toLowerCase()) ||
          workerCode.includes(searchQuery.toLowerCase()) ||
          payrollNumber.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort by pay period start descending
    return [...filtered].sort((a, b) =>
      new Date(b.payPeriodStart) - new Date(a.payPeriodStart)
    );
  }, [allPayroll, selectedStatus, selectedWorker, selectedProject, selectedMonth, searchQuery, allWorkers]);

  // Pagination
  const totalPages = Math.ceil(filteredPayroll.length / itemsPerPage);
  const paginatedPayroll = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPayroll.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayroll, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalPayroll = allPayroll.length;
    const pendingPayroll = allPayroll.filter(p => p.paymentStatus === PAYROLL_STATUS.PENDING).length;
    const processedPayroll = allPayroll.filter(p => p.paymentStatus === PAYROLL_STATUS.PROCESSED).length;
    const paidPayroll = allPayroll.filter(p => p.paymentStatus === PAYROLL_STATUS.PAID).length;
    const totalPayout = allPayroll
      .filter(p => p.paymentStatus === PAYROLL_STATUS.PAID)
      .reduce((sum, p) => sum + (parseFloat(p.netPay) || 0), 0);

    return { totalPayroll, pendingPayroll, processedPayroll, paidPayroll, totalPayout };
  }, [allPayroll]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add payroll
  const handleAddPayroll = () => {
    setSelectedPayroll(null);
    setShowAddModal(true);
  };

  // Handle edit payroll
  const handleEditPayroll = (payroll) => {
    setSelectedPayroll(payroll);
    setShowAddModal(true);
  };

  // Handle delete payroll
  const handleDeletePayroll = async (payrollId) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      try {
        await deletePayroll(payrollId);
        showToast('Payroll deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting payroll:', error);
        showToast('Failed to delete payroll', 'danger');
      }
    }
  };

  // Handle modal success
  const handleModalSuccess = (message) => {
    showToast(message, 'success');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      [PAYROLL_STATUS.PENDING]: { bg: 'warning', icon: Clock, text: 'Pending' },
      [PAYROLL_STATUS.PROCESSED]: { bg: 'info', icon: CheckCircle, text: 'Processed' },
      [PAYROLL_STATUS.PAID]: { bg: 'success', icon: CheckCircle, text: 'Paid' },
      [PAYROLL_STATUS.FAILED]: { bg: 'danger', icon: XCircle, text: 'Failed' }
    };

    const badge = badges[status] || { bg: 'secondary', icon: Clock, text: status };
    const Icon = badge.icon;

    return (
      <span className={`badge bg-${badge.bg} d-inline-flex align-items-center gap-1`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="row g-3 mb-4">
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="bg-primary bg-opacity-10 rounded p-3">
                  <Wallet className="text-primary" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Payroll</h6>
                <h3 className="mb-0">{summaryStats.totalPayroll}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="bg-warning bg-opacity-10 rounded p-3">
                  <Clock className="text-warning" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Pending</h6>
                <h3 className="mb-0">{summaryStats.pendingPayroll}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="bg-success bg-opacity-10 rounded p-3">
                  <CheckCircle className="text-success" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Paid</h6>
                <h3 className="mb-0">{summaryStats.paidPayroll}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="bg-info bg-opacity-10 rounded p-3">
                  <TrendingUp className="text-info" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Payout</h6>
                <h3 className="mb-0">{formatCurrency(summaryStats.totalPayout)}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render filters
  const renderFilters = () => (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="row g-3">
          {/* Search */}
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search payroll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.values(PAYROLL_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Worker Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
            >
              <option value="all">All Workers</option>
              {allWorkers.map(worker => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {allProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="col-md-3">
            <input
              type="month"
              className="form-control"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              placeholder="Select month"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render payroll table
  const renderPayrollTable = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Payroll Records</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm">
            <FileSpreadsheet size={16} className="me-1" />
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAddPayroll}>
            <Plus size={16} className="me-1" />
            Process Payroll
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Payroll #</th>
                <th>Pay Period</th>
                <th>Worker</th>
                <th>Project</th>
                <th>Gross Pay</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayroll.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    No payroll records found. Click "Process Payroll" to get started.
                  </td>
                </tr>
              ) : (
                paginatedPayroll.map(payroll => {
                  const totalDeductions = (parseFloat(payroll.pfDeduction || 0) +
                                          parseFloat(payroll.esiDeduction || 0) +
                                          parseFloat(payroll.tdsDeduction || 0) +
                                          parseFloat(payroll.advanceDeduction || 0) +
                                          parseFloat(payroll.otherDeductions || 0));

                  return (
                    <tr key={payroll.id}>
                      <td className="fw-semibold">{payroll.payrollNumber}</td>
                      <td>
                        <div>
                          <div className="fw-medium">
                            {formatDate(payroll.payPeriodStart)} - {formatDate(payroll.payPeriodEnd)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{getWorkerName(payroll.workerId)}</div>
                          <small className="text-muted">{getWorkerCode(payroll.workerId)}</small>
                        </div>
                      </td>
                      <td>{getProjectName(payroll.projectId)}</td>
                      <td className="fw-semibold text-success">
                        {formatCurrency(payroll.grossPay)}
                      </td>
                      <td className="text-danger">
                        {formatCurrency(totalDeductions)}
                      </td>
                      <td className="fw-bold text-primary">
                        {formatCurrency(payroll.netPay)}
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {payroll.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      <td>{getStatusBadge(payroll.paymentStatus)}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-info"
                            title="Download Payslip"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEditPayroll(payroll)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeletePayroll(payroll.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-footer bg-white border-top">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayroll.length)} of {filteredPayroll.length} records
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(totalPages)].map((_, index) => (
                  <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Payroll Management</h2>
          <p className="text-muted mb-0">Process worker payments and manage payroll records</p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Payroll Table */}
      {renderPayrollTable()}

      {/* Toast Notification */}
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`alert alert-${toast.type} alert-dismissible fade show`} role="alert">
            {toast.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setToast({ ...toast, show: false })}
            />
          </div>
        </div>
      )}

      {/* Process Payroll Modal */}
      <ProcessPayrollModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        payroll={selectedPayroll}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default PayrollPage;
