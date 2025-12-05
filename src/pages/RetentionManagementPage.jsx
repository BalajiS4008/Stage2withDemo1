import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import {
  RETENTION_STATUS,
  calculateRetentionAmount,
  calculateReleasedAmount,
  getRetentionStatusColor,
  formatCurrency
} from '../utils/retentionUtils';
import { deleteRetentionAccount } from '../db/dexieDB';
import AddRetentionModal from '../components/retention/AddRetentionModal';

const RetentionManagementPage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRetention, setSelectedRetention] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allRetentions = useMemo(() => data.retentionAccounts || [], [data.retentionAccounts]);
  const allProjects = useMemo(() => data.projects || [], [data.projects]);
  const retentionReleases = useMemo(() => data.retentionReleases || [], [data.retentionReleases]);

  // Get project name
  const getProjectName = (projectId) => {
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Calculate total released amount for a retention
  const getTotalReleased = (retentionId) => {
    const releases = retentionReleases.filter(r => r.retentionAccountId === retentionId);
    return releases.reduce((sum, r) => sum + (parseFloat(r.releaseAmount) || 0), 0);
  };

  // Filter and sort retentions
  const filteredRetentions = useMemo(() => {
    let filtered = allRetentions;

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(r => r.projectId === parseInt(selectedProject));
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.status === selectedStatus);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(r => {
        const projectName = getProjectName(r.projectId).toLowerCase();
        const invoiceNumber = (r.invoiceNumber || '').toLowerCase();
        return (
          projectName.includes(searchQuery.toLowerCase()) ||
          invoiceNumber.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort by created date descending
    return [...filtered].sort((a, b) =>
      new Date(b.createdDate) - new Date(a.createdDate)
    );
  }, [allRetentions, selectedProject, selectedStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredRetentions.length / itemsPerPage);
  const paginatedRetentions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRetentions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRetentions, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalRetentions = allRetentions.length;
    const totalRetained = allRetentions.reduce((sum, r) => sum + (parseFloat(r.retentionAmount) || 0), 0);
    const totalReleased = allRetentions.reduce((sum, r) => {
      const released = getTotalReleased(r.id);
      return sum + released;
    }, 0);
    const totalPending = totalRetained - totalReleased;
    const activeRetentions = allRetentions.filter(r => r.status === RETENTION_STATUS.ACTIVE).length;

    return { totalRetentions, totalRetained, totalReleased, totalPending, activeRetentions };
  }, [allRetentions, retentionReleases]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add retention
  const handleAddRetention = () => {
    setSelectedRetention(null);
    setShowAddModal(true);
  };

  // Handle edit retention
  const handleEditRetention = (retention) => {
    setSelectedRetention(retention);
    setShowAddModal(true);
  };

  // Handle delete retention
  const handleDeleteRetention = async (retentionId) => {
    if (window.confirm('Are you sure you want to delete this retention record?')) {
      try {
        await deleteRetentionAccount(retentionId);
        showToast('Retention deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting retention:', error);
        showToast('Failed to delete retention', 'danger');
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
      [RETENTION_STATUS.ACTIVE]: { bg: 'success', icon: CheckCircle, text: 'Active' },
      [RETENTION_STATUS.PARTIAL_RELEASE]: { bg: 'info', icon: TrendingUp, text: 'Partial Release' },
      [RETENTION_STATUS.FULLY_RELEASED]: { bg: 'primary', icon: CheckCircle, text: 'Fully Released' },
      [RETENTION_STATUS.EXPIRED]: { bg: 'danger', icon: AlertTriangle, text: 'Expired' }
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

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="row g-3 mb-4">
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="bg-primary bg-opacity-10 rounded p-3">
                  <Shield className="text-primary" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Retentions</h6>
                <h3 className="mb-0">{summaryStats.totalRetentions}</h3>
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
                  <DollarSign className="text-warning" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Retained</h6>
                <h3 className="mb-0">{formatCurrency(summaryStats.totalRetained)}</h3>
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
                  <TrendingUp className="text-success" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Released</h6>
                <h3 className="mb-0">{formatCurrency(summaryStats.totalReleased)}</h3>
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
                  <Clock className="text-info" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Pending Release</h6>
                <h3 className="mb-0">{formatCurrency(summaryStats.totalPending)}</h3>
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
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search retentions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Project Filter */}
          <div className="col-md-4">
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
          <div className="col-md-4">
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.values(RETENTION_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Render retentions table
  const renderRetentionsTable = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Retention Accounts</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm">
            <FileSpreadsheet size={16} className="me-1" />
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAddRetention}>
            <Plus size={16} className="me-1" />
            Add Retention
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Project</th>
                <th>Invoice #</th>
                <th>Invoice Amount</th>
                <th>Retention %</th>
                <th>Retention Amount</th>
                <th>Released</th>
                <th>Pending</th>
                <th>Release Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRetentions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    No retention records found. Click "Add Retention" to get started.
                  </td>
                </tr>
              ) : (
                paginatedRetentions.map(retention => {
                  const totalReleased = getTotalReleased(retention.id);
                  const pending = parseFloat(retention.retentionAmount) - totalReleased;

                  return (
                    <tr key={retention.id}>
                      <td className="fw-semibold">{getProjectName(retention.projectId)}</td>
                      <td>{retention.invoiceNumber || 'N/A'}</td>
                      <td className="fw-semibold">
                        {formatCurrency(retention.invoiceAmount)}
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {retention.retentionPercentage}%
                        </span>
                      </td>
                      <td className="fw-semibold text-warning">
                        {formatCurrency(retention.retentionAmount)}
                      </td>
                      <td className="text-success">
                        {formatCurrency(totalReleased)}
                      </td>
                      <td className="fw-semibold text-primary">
                        {formatCurrency(pending)}
                      </td>
                      <td>
                        {retention.scheduledReleaseDate ? (
                          new Date(retention.scheduledReleaseDate).toLocaleDateString('en-IN')
                        ) : (
                          <span className="text-muted">Not scheduled</span>
                        )}
                      </td>
                      <td>{getStatusBadge(retention.status)}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEditRetention(retention)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteRetention(retention.id)}
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRetentions.length)} of {filteredRetentions.length} retentions
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
          <h2 className="mb-1">Retention Management</h2>
          <p className="text-muted mb-0">Track retention money and release schedules</p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Retentions Table */}
      {renderRetentionsTable()}

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

      {/* Add Retention Modal */}
      <AddRetentionModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        retention={selectedRetention}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default RetentionManagementPage;
