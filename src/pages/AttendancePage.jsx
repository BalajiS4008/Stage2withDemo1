import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  Calendar,
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  Filter,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  ATTENDANCE_STATUS,
  getAttendanceStatusColor,
  calculateMonthlyAttendance,
  formatDate,
  getWeekRange
} from '../utils/laborUtils';
import { deleteAttendance } from '../db/dexieDB';
import MarkAttendanceModal from '../components/attendance/MarkAttendanceModal';

const AttendancePage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allAttendance = useMemo(() => data.attendance || [], [data.attendance]);
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

  // Filter and sort attendance
  const filteredAttendance = useMemo(() => {
    let filtered = allAttendance;

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(a => a.status === selectedStatus);
    }

    // Worker filter
    if (selectedWorker !== 'all') {
      filtered = filtered.filter(a => a.workerId === parseInt(selectedWorker));
    }

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(a => a.projectId === parseInt(selectedProject));
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(a => {
        const attDate = new Date(a.attendanceDate);
        const startDate = new Date(dateRange.start);
        return attDate >= startDate;
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(a => {
        const attDate = new Date(a.attendanceDate);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59);
        return attDate <= endDate;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(a => {
        const workerName = getWorkerName(a.workerId).toLowerCase();
        const workerCode = getWorkerCode(a.workerId).toLowerCase();
        const projectName = getProjectName(a.projectId).toLowerCase();
        return (
          workerName.includes(searchQuery.toLowerCase()) ||
          workerCode.includes(searchQuery.toLowerCase()) ||
          projectName.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort by date descending
    return [...filtered].sort((a, b) =>
      new Date(b.attendanceDate) - new Date(a.attendanceDate)
    );
  }, [allAttendance, selectedStatus, selectedWorker, selectedProject, dateRange, searchQuery, allWorkers, allProjects]);

  // Pagination
  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const paginatedAttendance = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAttendance.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAttendance, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalRecords = allAttendance.length;
    const presentToday = allAttendance.filter(a =>
      a.attendanceDate === new Date().toISOString().split('T')[0] &&
      a.status === ATTENDANCE_STATUS.PRESENT
    ).length;
    const absentToday = allAttendance.filter(a =>
      a.attendanceDate === new Date().toISOString().split('T')[0] &&
      a.status === ATTENDANCE_STATUS.ABSENT
    ).length;
    const halfDayToday = allAttendance.filter(a =>
      a.attendanceDate === new Date().toISOString().split('T')[0] &&
      a.status === ATTENDANCE_STATUS.HALF_DAY
    ).length;

    return { totalRecords, presentToday, absentToday, halfDayToday };
  }, [allAttendance]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add attendance
  const handleAddAttendance = () => {
    setSelectedAttendance(null);
    setShowAddModal(true);
  };

  // Handle edit attendance
  const handleEditAttendance = (attendance) => {
    setSelectedAttendance(attendance);
    setShowAddModal(true);
  };

  // Handle delete attendance
  const handleDeleteAttendance = async (attendanceId) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await deleteAttendance(attendanceId);
        showToast('Attendance record deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting attendance:', error);
        showToast('Failed to delete attendance record', 'danger');
      }
    }
  };

  // Handle modal success
  const handleModalSuccess = (message) => {
    showToast(message, 'success');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const color = getAttendanceStatusColor(status);

    const iconMap = {
      [ATTENDANCE_STATUS.PRESENT]: CheckCircle,
      [ATTENDANCE_STATUS.ABSENT]: XCircle,
      [ATTENDANCE_STATUS.HALF_DAY]: Clock,
      [ATTENDANCE_STATUS.LEAVE]: UserX,
      [ATTENDANCE_STATUS.HOLIDAY]: Calendar
    };

    const Icon = iconMap[status] || AlertCircle;

    return (
      <span className={`badge bg-${color} d-inline-flex align-items-center gap-1`}>
        <Icon size={14} />
        {status}
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
                  <Calendar className="text-primary" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Records</h6>
                <h3 className="mb-0">{summaryStats.totalRecords}</h3>
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
                <h6 className="text-muted mb-1">Present Today</h6>
                <h3 className="mb-0">{summaryStats.presentToday}</h3>
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
                <div className="bg-danger bg-opacity-10 rounded p-3">
                  <XCircle className="text-danger" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Absent Today</h6>
                <h3 className="mb-0">{summaryStats.absentToday}</h3>
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
                <h6 className="text-muted mb-1">Half Day Today</h6>
                <h3 className="mb-0">{summaryStats.halfDayToday}</h3>
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
                placeholder="Search attendance..."
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
              {Object.values(ATTENDANCE_STATUS).map(status => (
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

  // Render attendance table
  const renderAttendanceTable = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Attendance Records</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm">
            <FileSpreadsheet size={16} className="me-1" />
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAddAttendance}>
            <Plus size={16} className="me-1" />
            Mark Attendance
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Worker</th>
                <th>Project</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours Worked</th>
                <th>Overtime</th>
                <th>Remarks</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAttendance.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    No attendance records found. Click "Mark Attendance" to get started.
                  </td>
                </tr>
              ) : (
                paginatedAttendance.map(attendance => (
                  <tr key={attendance.id}>
                    <td className="fw-semibold">
                      {formatDate(attendance.attendanceDate)}
                    </td>
                    <td>
                      <div>
                        <div className="fw-medium">{getWorkerName(attendance.workerId)}</div>
                        <small className="text-muted">{getWorkerCode(attendance.workerId)}</small>
                      </div>
                    </td>
                    <td>{getProjectName(attendance.projectId)}</td>
                    <td>{getStatusBadge(attendance.status)}</td>
                    <td>{attendance.checkInTime || '-'}</td>
                    <td>{attendance.checkOutTime || '-'}</td>
                    <td>
                      {attendance.hoursWorked ? (
                        <span className="fw-semibold">
                          {parseFloat(attendance.hoursWorked).toFixed(2)} hrs
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {attendance.overtimeHours ? (
                        <span className="badge bg-info">
                          {parseFloat(attendance.overtimeHours).toFixed(2)} hrs
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {attendance.remarks ? (
                        <small className="text-muted">{attendance.remarks}</small>
                      ) : '-'}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleEditAttendance(attendance)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteAttendance(attendance.id)}
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAttendance.length)} of {filteredAttendance.length} records
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
          <h2 className="mb-1">Attendance Management</h2>
          <p className="text-muted mb-0">Track worker attendance and work hours</p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Attendance Table */}
      {renderAttendanceTable()}

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

      {/* Mark Attendance Modal */}
      <MarkAttendanceModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedDate={selectedDate}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default AttendancePage;
