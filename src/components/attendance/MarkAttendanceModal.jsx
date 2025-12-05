import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  X,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Calendar
} from 'lucide-react';
import {
  ATTENDANCE_STATUS,
  getAttendanceStatusColor
} from '../../utils/laborUtils';

const MarkAttendanceModal = ({ show, onClose, selectedDate, onSuccess }) => {
  const { data, user, addAttendance, updateAttendance } = useData();
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [workerAttendance, setWorkerAttendance] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Get active workers and projects
  const activeWorkers = useMemo(() =>
    (data.workers || []).filter(w => w.isActive !== false),
    [data.workers]
  );

  const activeProjects = useMemo(() =>
    (data.projects || []).filter(p => p.status && p.status.toLowerCase() === 'active'),
    [data.projects]
  );

  // Get existing attendance for the selected date
  const existingAttendance = useMemo(() => {
    const dateStr = selectedDate;
    return (data.attendance || []).filter(a => a.attendanceDate === dateStr);
  }, [data.attendance, selectedDate]);

  // Initialize worker attendance state
  useEffect(() => {
    if (show && activeWorkers.length > 0) {
      const initialState = {};
      activeWorkers.forEach(worker => {
        const existing = existingAttendance.find(a => a.workerId === worker.id);
        initialState[worker.id] = {
          status: existing?.status || ATTENDANCE_STATUS.PRESENT,
          hours: existing?.hoursWorked || 8,
          overtime: existing?.overtime || 0,
          notes: existing?.notes || '',
          existingId: existing?.id || null
        };
      });
      setWorkerAttendance(initialState);
    }
  }, [show, activeWorkers, existingAttendance]);

  // Filter workers based on search
  const filteredWorkers = useMemo(() => {
    let filtered = activeWorkers;

    if (searchQuery) {
      filtered = filtered.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.workerCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(w =>
        workerAttendance[w.id]?.status === filterStatus
      );
    }

    return filtered;
  }, [activeWorkers, searchQuery, filterStatus, workerAttendance]);

  const handleWorkerStatusChange = (workerId, status) => {
    setWorkerAttendance(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        status,
        hours: status === ATTENDANCE_STATUS.ABSENT ? 0 :
               status === ATTENDANCE_STATUS.HALF_DAY ? 4 : 8
      }
    }));
  };

  const handleWorkerDataChange = (workerId, field, value) => {
    setWorkerAttendance(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: value
      }
    }));
  };

  const handleBulkAction = (status) => {
    const updated = {};
    filteredWorkers.forEach(worker => {
      updated[worker.id] = {
        ...workerAttendance[worker.id],
        status,
        hours: status === ATTENDANCE_STATUS.ABSENT ? 0 :
               status === ATTENDANCE_STATUS.HALF_DAY ? 4 : 8
      };
    });
    setWorkerAttendance(prev => ({ ...prev, ...updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      alert('Please select a project');
      return;
    }

    setLoading(true);

    try {
      const attendanceRecords = Object.entries(workerAttendance).map(([workerId, data]) => ({
        workerId: parseInt(workerId),
        projectId: parseInt(selectedProject),
        attendanceDate: selectedDate,
        status: data.status,
        hoursWorked: parseFloat(data.hours) || 0,
        overtime: parseFloat(data.overtime) || 0,
        notes: data.notes || ''
      }));

      // Save each attendance record
      for (const record of attendanceRecords) {
        const existingId = workerAttendance[record.workerId]?.existingId;
        if (existingId) {
          // Update existing
          await updateAttendance(existingId, record);
        } else {
          // Add new
          await addAttendance(record);
        }
      }

      onSuccess(`Attendance marked successfully for ${attendanceRecords.length} workers`);
      handleClose();
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setWorkerAttendance({});
    setSelectedProject('');
    setSearchQuery('');
    setFilterStatus('all');
    onClose();
  };

  if (!show) return null;

  const stats = {
    present: Object.values(workerAttendance).filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
    absent: Object.values(workerAttendance).filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length,
    halfDay: Object.values(workerAttendance).filter(a => a.status === ATTENDANCE_STATUS.HALF_DAY).length,
    leave: Object.values(workerAttendance).filter(a => a.status === ATTENDANCE_STATUS.LEAVE).length
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040 }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        style={{ zIndex: 1050 }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header bg-primary text-white">
              <div>
                <h5 className="modal-title mb-1">
                  <Users className="me-2" size={20} />
                  Mark Attendance
                </h5>
                <small>
                  <Calendar size={14} className="me-1" />
                  {new Date(selectedDate).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </small>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleClose}
                disabled={loading}
              />
            </div>

            {/* Body */}
            <div className="modal-body p-0">
              <form onSubmit={handleSubmit}>
                {/* Project Selection & Controls */}
                <div className="p-3 bg-light border-bottom">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        Project <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        required
                      >
                        <option value="">Select Project</option>
                        {activeProjects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Search Workers</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Filter by Status</label>
                      <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All Workers ({activeWorkers.length})</option>
                        <option value={ATTENDANCE_STATUS.PRESENT}>Present ({stats.present})</option>
                        <option value={ATTENDANCE_STATUS.ABSENT}>Absent ({stats.absent})</option>
                        <option value={ATTENDANCE_STATUS.HALF_DAY}>Half Day ({stats.halfDay})</option>
                        <option value={ATTENDANCE_STATUS.LEAVE}>Leave ({stats.leave})</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-3">
                    <label className="form-label fw-bold">Quick Actions (for filtered workers)</label>
                    <div className="btn-group w-100" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-success"
                        onClick={() => handleBulkAction(ATTENDANCE_STATUS.PRESENT)}
                      >
                        <CheckCircle size={16} className="me-1" />
                        Mark All Present
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => handleBulkAction(ATTENDANCE_STATUS.ABSENT)}
                      >
                        <XCircle size={16} className="me-1" />
                        Mark All Absent
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-warning"
                        onClick={() => handleBulkAction(ATTENDANCE_STATUS.HALF_DAY)}
                      >
                        <Clock size={16} className="me-1" />
                        Mark All Half Day
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-info"
                        onClick={() => handleBulkAction(ATTENDANCE_STATUS.LEAVE)}
                      >
                        <AlertCircle size={16} className="me-1" />
                        Mark All Leave
                      </button>
                    </div>
                  </div>
                </div>

                {/* Workers List */}
                <div className="p-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {filteredWorkers.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <Users size={48} className="mb-3" />
                      <p>No workers found</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {filteredWorkers.map(worker => {
                        const attendance = workerAttendance[worker.id] || {};
                        const statusColor = getAttendanceStatusColor(attendance.status);

                        return (
                          <div key={worker.id} className="col-md-6">
                            <div className={`card h-100 border-${statusColor}`}>
                              <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="mb-0">{worker.name}</h6>
                                    <small className="text-muted">{worker.workerCode}</small>
                                  </div>
                                  <span className={`badge bg-${statusColor}`}>
                                    {attendance.status}
                                  </span>
                                </div>

                                {/* Status Buttons */}
                                <div className="btn-group btn-group-sm w-100 mb-2" role="group">
                                  <button
                                    type="button"
                                    className={`btn ${attendance.status === ATTENDANCE_STATUS.PRESENT ? 'btn-success' : 'btn-outline-success'}`}
                                    onClick={() => handleWorkerStatusChange(worker.id, ATTENDANCE_STATUS.PRESENT)}
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn ${attendance.status === ATTENDANCE_STATUS.HALF_DAY ? 'btn-warning' : 'btn-outline-warning'}`}
                                    onClick={() => handleWorkerStatusChange(worker.id, ATTENDANCE_STATUS.HALF_DAY)}
                                  >
                                    <Clock size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn ${attendance.status === ATTENDANCE_STATUS.LEAVE ? 'btn-info' : 'btn-outline-info'}`}
                                    onClick={() => handleWorkerStatusChange(worker.id, ATTENDANCE_STATUS.LEAVE)}
                                  >
                                    <AlertCircle size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn ${attendance.status === ATTENDANCE_STATUS.ABSENT ? 'btn-danger' : 'btn-outline-danger'}`}
                                    onClick={() => handleWorkerStatusChange(worker.id, ATTENDANCE_STATUS.ABSENT)}
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </div>

                                {/* Hours Input */}
                                {attendance.status !== ATTENDANCE_STATUS.ABSENT && (
                                  <div className="row g-2">
                                    <div className="col-6">
                                      <label className="form-label small mb-1">Hours</label>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        value={attendance.hours || 0}
                                        onChange={(e) => handleWorkerDataChange(worker.id, 'hours', e.target.value)}
                                        min="0"
                                        max="24"
                                        step="0.5"
                                      />
                                    </div>
                                    <div className="col-6">
                                      <label className="form-label small mb-1">OT</label>
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        value={attendance.overtime || 0}
                                        onChange={(e) => handleWorkerDataChange(worker.id, 'overtime', e.target.value)}
                                        min="0"
                                        max="8"
                                        step="0.5"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Summary Footer */}
                <div className="p-3 bg-light border-top">
                  <div className="row text-center">
                    <div className="col-3">
                      <div className="fs-4 fw-bold text-success">{stats.present}</div>
                      <div className="small text-muted">Present</div>
                    </div>
                    <div className="col-3">
                      <div className="fs-4 fw-bold text-danger">{stats.absent}</div>
                      <div className="small text-muted">Absent</div>
                    </div>
                    <div className="col-3">
                      <div className="fs-4 fw-bold text-warning">{stats.halfDay}</div>
                      <div className="small text-muted">Half Day</div>
                    </div>
                    <div className="col-3">
                      <div className="fs-4 fw-bold text-info">{stats.leave}</div>
                      <div className="small text-muted">Leave</div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading || !selectedProject}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="me-2" />
                    Save Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarkAttendanceModal;
