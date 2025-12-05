import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  Clock,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';
import {
  TIMESHEET_STATUS,
  getWeekRange,
  calculateWorkHours,
  formatDate
} from '../utils/laborUtils';
import { deleteTimeSheet } from '../db/dexieDB';
import TimesheetFormModal from '../components/timesheets/TimesheetFormModal';

const TimesheetsPage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allTimesheets = useMemo(() => data.timeSheets || [], [data.timeSheets]);
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

  // Filter and sort timesheets
  const filteredTimesheets = useMemo(() => {
    let filtered = allTimesheets;

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    // Worker filter
    if (selectedWorker !== 'all') {
      filtered = filtered.filter(t => t.workerId === parseInt(selectedWorker));
    }

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === parseInt(selectedProject));
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(t => {
        const weekStart = new Date(t.weekStartDate);
        const rangeStart = new Date(dateRange.start);
        return weekStart >= rangeStart;
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => {
        const weekStart = new Date(t.weekStartDate);
        const rangeEnd = new Date(dateRange.end);
        rangeEnd.setHours(23, 59, 59);
        return weekStart <= rangeEnd;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => {
        const workerName = getWorkerName(t.workerId).toLowerCase();
        const workerCode = getWorkerCode(t.workerId).toLowerCase();
        const projectName = getProjectName(t.projectId).toLowerCase();
        return (
          workerName.includes(searchQuery.toLowerCase()) ||
          workerCode.includes(searchQuery.toLowerCase()) ||
          projectName.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort by week start date descending
    return [...filtered].sort((a, b) =>
      new Date(b.weekStartDate) - new Date(a.weekStartDate)
    );
  }, [allTimesheets, selectedStatus, selectedWorker, selectedProject, dateRange, searchQuery, allWorkers, allProjects]);

  // Pagination
  const totalPages = Math.ceil(filteredTimesheets.length / itemsPerPage);
  const paginatedTimesheets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTimesheets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTimesheets, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalTimesheets = allTimesheets.length;
    const draftTimesheets = allTimesheets.filter(t => t.status === TIMESHEET_STATUS.DRAFT).length;
    const submittedTimesheets = allTimesheets.filter(t => t.status === TIMESHEET_STATUS.SUBMITTED).length;
    const approvedTimesheets = allTimesheets.filter(t => t.status === TIMESHEET_STATUS.APPROVED).length;
    const totalHours = allTimesheets
      .filter(t => t.status === TIMESHEET_STATUS.APPROVED)
      .reduce((sum, t) => sum + (parseFloat(t.totalHours) || 0), 0);

    return { totalTimesheets, draftTimesheets, submittedTimesheets, approvedTimesheets, totalHours };
  }, [allTimesheets]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add timesheet
  const handleAddTimesheet = () => {
    setSelectedTimesheet(null);
    setShowAddModal(true);
  };

  // Handle edit timesheet
  const handleEditTimesheet = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setShowAddModal(true);
  };

  // Handle delete timesheet
  const handleDeleteTimesheet = async (timesheetId) => {
    if (window.confirm('Are you sure you want to delete this timesheet?')) {
      try {
        await deleteTimeSheet(timesheetId);
        showToast('Timesheet deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting timesheet:', error);
        showToast('Failed to delete timesheet', 'danger');
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
      [TIMESHEET_STATUS.DRAFT]: { bg: 'secondary', icon: AlertCircle, text: 'Draft' },
      [TIMESHEET_STATUS.SUBMITTED]: { bg: 'info', icon: Clock, text: 'Submitted' },
      [TIMESHEET_STATUS.APPROVED]: { bg: 'success', icon: CheckCircle, text: 'Approved' },
      [TIMESHEET_STATUS.REJECTED]: { bg: 'danger', icon: XCircle, text: 'Rejected' }
    };

    const badge = badges[status] || { bg: 'secondary', icon: AlertCircle, text: status };
    const Icon = badge.icon;

    return (
      <span className={`badge bg-${badge.bg} d-inline-flex align-items-center gap-1`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  // Calculate week end date
  const getWeekEndDate = (weekStartDate) => {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end.toISOString().split('T')[0];
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
                  <Clock className="text-primary" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Timesheets</h6>
                <h3 className="mb-0">{summaryStats.totalTimesheets}</h3>
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
                  <AlertCircle className="text-info" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Pending Approval</h6>
                <h3 className="mb-0">{summaryStats.submittedTimesheets}</h3>
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
                <h3 className="mb-0">{summaryStats.approvedTimesheets}</h3>
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
                  <TrendingUp className="text-warning" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Hours</h6>
                <h3 className="mb-0">{summaryStats.totalHours.toFixed(1)}</h3>
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
                placeholder="Search timesheets..."
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
              {Object.values(TIMESHEET_STATUS).map(status => (
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

          {/* Date Range */}
          <div className="col-md-3">
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="date"
                  className="form-control"
                  placeholder="From"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="col-6">
                <input
                  type="date"
                  className="form-control"
                  placeholder="To"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render timesheets table
  const renderTimesheetsTable = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Timesheets</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm">
            <FileSpreadsheet size={16} className="me-1" />
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAddTimesheet}>
            <Plus size={16} className="me-1" />
            New Timesheet
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Week Period</th>
                <th>Worker</th>
                <th>Project</th>
                <th>Regular Hours</th>
                <th>Overtime Hours</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTimesheets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No timesheets found. Click "New Timesheet" to get started.
                  </td>
                </tr>
              ) : (
                paginatedTimesheets.map(timesheet => (
                  <tr key={timesheet.id}>
                    <td>
                      <div>
                        <div className="fw-semibold">
                          {formatDate(timesheet.weekStartDate)} - {formatDate(getWeekEndDate(timesheet.weekStartDate))}
                        </div>
                        <small className="text-muted">Week {timesheet.weekNumber || 'N/A'}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-medium">{getWorkerName(timesheet.workerId)}</div>
                        <small className="text-muted">{getWorkerCode(timesheet.workerId)}</small>
                      </div>
                    </td>
                    <td>{getProjectName(timesheet.projectId)}</td>
                    <td>
                      <span className="fw-semibold">
                        {parseFloat(timesheet.regularHours || 0).toFixed(1)} hrs
                      </span>
                    </td>
                    <td>
                      {timesheet.overtimeHours ? (
                        <span className="badge bg-info">
                          {parseFloat(timesheet.overtimeHours).toFixed(1)} hrs
                        </span>
                      ) : (
                        <span className="text-muted">0.0 hrs</span>
                      )}
                    </td>
                    <td className="fw-semibold text-primary">
                      {parseFloat(timesheet.totalHours || 0).toFixed(1)} hrs
                    </td>
                    <td>{getStatusBadge(timesheet.status)}</td>
                    <td>
                      {timesheet.submittedDate ? (
                        formatDate(timesheet.submittedDate)
                      ) : (
                        <span className="text-muted">Not submitted</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleEditTimesheet(timesheet)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteTimesheet(timesheet.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTimesheets.length)} of {filteredTimesheets.length} timesheets
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
          <h2 className="mb-1">Timesheet Management</h2>
          <p className="text-muted mb-0">Track weekly work hours and overtime</p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Timesheets Table */}
      {renderTimesheetsTable()}

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

      {/* Timesheet Form Modal */}
      <TimesheetFormModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        timesheet={selectedTimesheet}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default TimesheetsPage;
