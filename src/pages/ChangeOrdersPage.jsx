import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  GitBranch,
  Search,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import {
  CHANGE_ORDER_STATUS,
  PRIORITY_LEVELS,
  CHANGE_REASONS,
  CHANGE_CATEGORIES,
  calculateCostImpact,
  calculateScheduleImpact,
  calculateCumulativeBudgetImpact,
  calculateCumulativeScheduleImpact,
  formatCurrency
} from '../utils/changeOrderUtils';
import { deleteChangeOrder } from '../db/dexieDB';
import ChangeOrderFormModal from '../components/changeOrders/ChangeOrderFormModal';

const ChangeOrdersPage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedChangeOrder, setSelectedChangeOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allChangeOrders = useMemo(() => data.changeOrders || [], [data.changeOrders]);
  const allProjects = useMemo(() => data.projects || [], [data.projects]);
  const changeOrderLineItems = useMemo(() => data.changeOrderLineItems || [], [data.changeOrderLineItems]);

  // Get project name
  const getProjectName = (projectId) => {
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Get line items for a change order
  const getLineItems = (changeOrderId) => {
    return changeOrderLineItems.filter(item => item.changeOrderId === changeOrderId);
  };

  // Calculate total cost impact for a change order
  const getTotalCostImpact = (changeOrderId) => {
    const items = getLineItems(changeOrderId);
    return items.reduce((sum, item) => sum + (parseFloat(item.totalCost) || 0), 0);
  };

  // Filter and sort change orders
  const filteredChangeOrders = useMemo(() => {
    let filtered = allChangeOrders;

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(co => co.projectId === parseInt(selectedProject));
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(co => co.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(co => co.priority === selectedPriority);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(co => {
        const projectName = getProjectName(co.projectId).toLowerCase();
        const coNumber = (co.changeOrderNumber || '').toLowerCase();
        const title = (co.title || '').toLowerCase();
        return (
          projectName.includes(searchQuery.toLowerCase()) ||
          coNumber.includes(searchQuery.toLowerCase()) ||
          title.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort by created date descending
    return [...filtered].sort((a, b) =>
      new Date(b.createdDate) - new Date(a.createdDate)
    );
  }, [allChangeOrders, selectedProject, selectedStatus, selectedPriority, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredChangeOrders.length / itemsPerPage);
  const paginatedChangeOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredChangeOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredChangeOrders, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalChangeOrders = allChangeOrders.length;
    const pendingApproval = allChangeOrders.filter(co =>
      co.status === CHANGE_ORDER_STATUS.SUBMITTED ||
      co.status === CHANGE_ORDER_STATUS.UNDER_REVIEW
    ).length;
    const approved = allChangeOrders.filter(co => co.status === CHANGE_ORDER_STATUS.APPROVED).length;
    const totalCostImpact = allChangeOrders.reduce((sum, co) => {
      const impact = getTotalCostImpact(co.id);
      return sum + impact;
    }, 0);

    return { totalChangeOrders, pendingApproval, approved, totalCostImpact };
  }, [allChangeOrders, changeOrderLineItems]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add change order
  const handleAddChangeOrder = () => {
    setSelectedChangeOrder(null);
    setShowAddModal(true);
  };

  // Handle edit change order
  const handleEditChangeOrder = (changeOrder) => {
    setSelectedChangeOrder(changeOrder);
    setShowAddModal(true);
  };

  // Handle delete change order
  const handleDeleteChangeOrder = async (changeOrderId) => {
    if (window.confirm('Are you sure you want to delete this change order?')) {
      try {
        await deleteChangeOrder(changeOrderId);
        showToast('Change order deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting change order:', error);
        showToast('Failed to delete change order', 'danger');
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
      [CHANGE_ORDER_STATUS.DRAFT]: { bg: 'secondary', icon: FileText, text: 'Draft' },
      [CHANGE_ORDER_STATUS.SUBMITTED]: { bg: 'info', icon: Clock, text: 'Submitted' },
      [CHANGE_ORDER_STATUS.UNDER_REVIEW]: { bg: 'warning', icon: AlertCircle, text: 'Under Review' },
      [CHANGE_ORDER_STATUS.APPROVED]: { bg: 'success', icon: CheckCircle, text: 'Approved' },
      [CHANGE_ORDER_STATUS.REJECTED]: { bg: 'danger', icon: XCircle, text: 'Rejected' },
      [CHANGE_ORDER_STATUS.IMPLEMENTED]: { bg: 'primary', icon: CheckCircle, text: 'Implemented' }
    };

    const badge = badges[status] || { bg: 'secondary', icon: FileText, text: status };
    const Icon = badge.icon;

    return (
      <span className={`badge bg-${badge.bg} d-inline-flex align-items-center gap-1`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const colors = {
      [PRIORITY_LEVELS.LOW]: 'secondary',
      [PRIORITY_LEVELS.MEDIUM]: 'info',
      [PRIORITY_LEVELS.HIGH]: 'warning',
      [PRIORITY_LEVELS.URGENT]: 'danger'
    };

    return (
      <span className={`badge bg-${colors[priority] || 'secondary'}`}>
        {priority}
      </span>
    );
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
                  <GitBranch className="text-primary" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Change Orders</h6>
                <h3 className="mb-0">{summaryStats.totalChangeOrders}</h3>
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
                <h6 className="text-muted mb-1">Pending Approval</h6>
                <h3 className="mb-0">{summaryStats.pendingApproval}</h3>
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
                <h6 className="text-muted mb-1">Approved</h6>
                <h3 className="mb-0">{summaryStats.approved}</h3>
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
                  <DollarSign className="text-info" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Cost Impact</h6>
                <h3 className="mb-0">{formatCurrency(summaryStats.totalCostImpact)}</h3>
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
                placeholder="Search change orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Project Filter */}
          <div className="col-md-3">
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

          {/* Status Filter */}
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.values(CHANGE_ORDER_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {Object.values(PRIORITY_LEVELS).map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Render change orders table
  const renderChangeOrdersTable = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Change Orders</h5>
        <button className="btn btn-primary btn-sm" onClick={handleAddChangeOrder}>
          <Plus size={16} className="me-1" />
          New Change Order
        </button>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>CO Number</th>
                <th>Project</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Cost Impact</th>
                <th>Schedule Impact</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedChangeOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No change orders found. Click "New Change Order" to get started.
                  </td>
                </tr>
              ) : (
                paginatedChangeOrders.map(changeOrder => {
                  const costImpact = getTotalCostImpact(changeOrder.id);
                  const scheduleImpact = changeOrder.scheduleImpactDays || 0;

                  return (
                    <tr key={changeOrder.id}>
                      <td className="fw-semibold">
                        {changeOrder.changeOrderNumber || 'N/A'}
                      </td>
                      <td>{getProjectName(changeOrder.projectId)}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">{changeOrder.title}</span>
                          {changeOrder.description && (
                            <small className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
                              {changeOrder.description}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>{getPriorityBadge(changeOrder.priority)}</td>
                      <td className={costImpact >= 0 ? 'text-danger' : 'text-success'}>
                        {formatCurrency(Math.abs(costImpact))}
                        {costImpact >= 0 ? ' ↑' : ' ↓'}
                      </td>
                      <td className={scheduleImpact > 0 ? 'text-warning' : 'text-success'}>
                        {scheduleImpact > 0 ? `+${scheduleImpact}` : scheduleImpact} days
                      </td>
                      <td>
                        {changeOrder.submittedDate ? (
                          new Date(changeOrder.submittedDate).toLocaleDateString('en-IN')
                        ) : (
                          <span className="text-muted">Not submitted</span>
                        )}
                      </td>
                      <td>{getStatusBadge(changeOrder.status)}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEditChangeOrder(changeOrder)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteChangeOrder(changeOrder.id)}
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredChangeOrders.length)} of {filteredChangeOrders.length} change orders
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
          <h2 className="mb-1">Change Orders</h2>
          <p className="text-muted mb-0">Manage project changes and track impact on budget and schedule</p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Change Orders Table */}
      {renderChangeOrdersTable()}

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

      {/* Change Order Form Modal */}
      <ChangeOrderFormModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        changeOrder={selectedChangeOrder}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default ChangeOrdersPage;
