import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  X,
  Calendar,
  Clock,
  User,
  Building2,
  Save,
  Send,
  AlertCircle,
  Info,
  Plus,
  Minus
} from 'lucide-react';
import {
  TIMESHEET_STATUS,
  getWeekRange,
  calculateWorkHours
} from '../../utils/laborUtils';

const TimesheetFormModal = ({ show, onClose, timesheet, onSuccess }) => {
  const { data, user, addTimeSheet, updateTimeSheet } = useData();

  // Get current week start (Monday)
  const getCurrentWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  // Initial form data
  const initialFormData = {
    workerId: '',
    projectId: '',
    weekStartDate: getCurrentWeekStart(),
    status: TIMESHEET_STATUS.DRAFT,
    dailyEntries: {
      monday: { hours: 0, overtime: 0, notes: '' },
      tuesday: { hours: 0, overtime: 0, notes: '' },
      wednesday: { hours: 0, overtime: 0, notes: '' },
      thursday: { hours: 0, overtime: 0, notes: '' },
      friday: { hours: 0, overtime: 0, notes: '' },
      saturday: { hours: 0, overtime: 0, notes: '' },
      sunday: { hours: 0, overtime: 0, notes: '' }
    },
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [expandedDay, setExpandedDay] = useState(null);

  // Get active workers and projects
  const activeWorkers = useMemo(() =>
    (data.workers || []).filter(w => w.isActive !== false),
    [data.workers]
  );

  const activeProjects = useMemo(() =>
    (data.projects || []).filter(p => p.status && p.status.toLowerCase() === 'active'),
    [data.projects]
  );

  // Load timesheet data when editing
  useEffect(() => {
    if (show && timesheet) {
      setFormData({
        workerId: timesheet.workerId || '',
        projectId: timesheet.projectId || '',
        weekStartDate: timesheet.weekStartDate || getCurrentWeekStart(),
        status: timesheet.status || TIMESHEET_STATUS.DRAFT,
        dailyEntries: timesheet.dailyEntries || initialFormData.dailyEntries,
        notes: timesheet.notes || ''
      });
    } else if (show && !timesheet) {
      setFormData(initialFormData);
    }
  }, [show, timesheet]);

  // Calculate totals
  const totals = useMemo(() => {
    const regularHours = Object.values(formData.dailyEntries).reduce(
      (sum, entry) => sum + (parseFloat(entry.hours) || 0), 0
    );
    const overtimeHours = Object.values(formData.dailyEntries).reduce(
      (sum, entry) => sum + (parseFloat(entry.overtime) || 0), 0
    );
    const totalHours = regularHours + overtimeHours;

    return { regularHours, overtimeHours, totalHours };
  }, [formData.dailyEntries]);

  // Get date for each day of the week
  const getDateForDay = (dayIndex) => {
    const weekStart = new Date(formData.weekStartDate);
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  // Get week number
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle daily entry change
  const handleDailyEntryChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      dailyEntries: {
        ...prev.dailyEntries,
        [day]: {
          ...prev.dailyEntries[day],
          [field]: value
        }
      }
    }));
  };

  // Quick fill hours
  const quickFillHours = (hours) => {
    const updated = {};
    Object.keys(formData.dailyEntries).forEach(day => {
      // Skip Sunday for standard 8-hour fill
      if (hours === 8 && day === 'sunday') {
        updated[day] = { ...formData.dailyEntries[day], hours: 0 };
      } else {
        updated[day] = { ...formData.dailyEntries[day], hours };
      }
    });
    setFormData(prev => ({ ...prev, dailyEntries: updated }));
  };

  // Clear all entries
  const clearAllEntries = () => {
    if (window.confirm('Clear all time entries? This cannot be undone.')) {
      setFormData(prev => ({
        ...prev,
        dailyEntries: initialFormData.dailyEntries
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.workerId) {
      newErrors.workerId = 'Please select a worker';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Please select a project';
    }

    if (!formData.weekStartDate) {
      newErrors.weekStartDate = 'Please select week start date';
    }

    if (totals.totalHours === 0) {
      newErrors.hours = 'Please enter at least some hours worked';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (submitStatus = TIMESHEET_STATUS.DRAFT) => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const timesheetData = {
        workerId: parseInt(formData.workerId),
        projectId: parseInt(formData.projectId),
        weekStartDate: formData.weekStartDate,
        weekNumber: getWeekNumber(formData.weekStartDate),
        dailyEntries: formData.dailyEntries,
        regularHours: totals.regularHours,
        overtimeHours: totals.overtimeHours,
        totalHours: totals.totalHours,
        status: submitStatus,
        submittedDate: submitStatus === TIMESHEET_STATUS.SUBMITTED ? new Date().toISOString() : null,
        notes: formData.notes || ''
      };

      if (timesheet?.id) {
        // Update existing
        await updateTimeSheet(timesheet.id, timesheetData);
        onSuccess('Timesheet updated successfully');
      } else {
        // Add new
        await addTimeSheet(timesheetData);
        onSuccess('Timesheet created successfully');
      }

      handleClose();
    } catch (error) {
      console.error('Error saving timesheet:', error);
      alert('Failed to save timesheet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setExpandedDay(null);
    onClose();
  };

  if (!show) return null;

  const daysOfWeek = [
    { key: 'monday', label: 'Monday', index: 0 },
    { key: 'tuesday', label: 'Tuesday', index: 1 },
    { key: 'wednesday', label: 'Wednesday', index: 2 },
    { key: 'thursday', label: 'Thursday', index: 3 },
    { key: 'friday', label: 'Friday', index: 4 },
    { key: 'saturday', label: 'Saturday', index: 5 },
    { key: 'sunday', label: 'Sunday', index: 6 }
  ];

  const weekEndDate = new Date(formData.weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

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
                  <Clock className="me-2" size={20} />
                  {timesheet ? 'Edit Timesheet' : 'New Timesheet'}
                </h5>
                <small>
                  <Calendar size={14} className="me-1" />
                  Week {getWeekNumber(formData.weekStartDate)} ({new Date(formData.weekStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} - {weekEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})
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
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {/* Worker & Project Selection */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">
                      <User size={16} className="me-1" />
                      Worker <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.workerId ? 'is-invalid' : ''}`}
                      value={formData.workerId}
                      onChange={(e) => handleChange('workerId', e.target.value)}
                      disabled={loading || !!timesheet}
                    >
                      <option value="">Select Worker</option>
                      {activeWorkers.map(worker => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name} ({worker.workerCode})
                        </option>
                      ))}
                    </select>
                    {errors.workerId && (
                      <div className="invalid-feedback">{errors.workerId}</div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold">
                      <Building2 size={16} className="me-1" />
                      Project <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.projectId ? 'is-invalid' : ''}`}
                      value={formData.projectId}
                      onChange={(e) => handleChange('projectId', e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Select Project</option>
                      {activeProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {errors.projectId && (
                      <div className="invalid-feedback">{errors.projectId}</div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold">
                      <Calendar size={16} className="me-1" />
                      Week Start Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.weekStartDate ? 'is-invalid' : ''}`}
                      value={formData.weekStartDate}
                      onChange={(e) => handleChange('weekStartDate', e.target.value)}
                      disabled={loading || !!timesheet}
                    />
                    {errors.weekStartDate && (
                      <div className="invalid-feedback">{errors.weekStartDate}</div>
                    )}
                    <small className="text-muted">Select Monday of the week</small>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Quick Fill</h6>
                        <small className="text-muted">Fill all weekdays with same hours</small>
                      </div>
                      <div className="btn-group" role="group">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => quickFillHours(8)}
                        >
                          8 Hours (Mon-Sat)
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => quickFillHours(9)}
                        >
                          9 Hours (All Days)
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={clearAllEntries}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Time Entries */}
                <div className="mb-4">
                  <h6 className="mb-3">Daily Time Entries</h6>

                  {errors.hours && (
                    <div className="alert alert-danger d-flex align-items-center">
                      <AlertCircle size={20} className="me-2" />
                      {errors.hours}
                    </div>
                  )}

                  <div className="row g-3">
                    {daysOfWeek.map(({ key, label, index }) => {
                      const entry = formData.dailyEntries[key];
                      const isWeekend = key === 'saturday' || key === 'sunday';
                      const hasHours = entry.hours > 0 || entry.overtime > 0;

                      return (
                        <div key={key} className="col-12">
                          <div className={`card ${isWeekend ? 'border-warning' : 'border-primary'} ${hasHours ? 'shadow-sm' : ''}`}>
                            <div className="card-header bg-white border-bottom">
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                  <strong className={isWeekend ? 'text-warning' : 'text-primary'}>
                                    {label}
                                  </strong>
                                  <span className="badge bg-light text-dark">
                                    {getDateForDay(index)}
                                  </span>
                                  {hasHours && (
                                    <span className="badge bg-success">
                                      {(parseFloat(entry.hours) + parseFloat(entry.overtime)).toFixed(1)} hrs
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link"
                                  onClick={() => setExpandedDay(expandedDay === key ? null : key)}
                                >
                                  {expandedDay === key ? <Minus size={16} /> : <Plus size={16} />}
                                </button>
                              </div>
                            </div>

                            <div className={`card-body ${expandedDay === key ? '' : 'd-none'}`}>
                              <div className="row g-3">
                                <div className="col-md-4">
                                  <label className="form-label small">Regular Hours</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={entry.hours}
                                    onChange={(e) => handleDailyEntryChange(key, 'hours', e.target.value)}
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    disabled={loading}
                                  />
                                </div>

                                <div className="col-md-4">
                                  <label className="form-label small">Overtime Hours</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={entry.overtime}
                                    onChange={(e) => handleDailyEntryChange(key, 'overtime', e.target.value)}
                                    min="0"
                                    max="12"
                                    step="0.5"
                                    disabled={loading}
                                  />
                                </div>

                                <div className="col-md-4">
                                  <label className="form-label small">Total for Day</label>
                                  <input
                                    type="text"
                                    className="form-control bg-light"
                                    value={`${(parseFloat(entry.hours) + parseFloat(entry.overtime)).toFixed(1)} hrs`}
                                    readOnly
                                  />
                                </div>

                                <div className="col-12">
                                  <label className="form-label small">Notes (Optional)</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Add notes for this day..."
                                    value={entry.notes}
                                    onChange={(e) => handleDailyEntryChange(key, 'notes', e.target.value)}
                                    disabled={loading}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="card bg-primary text-white mb-4">
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="fs-2 fw-bold">{totals.regularHours.toFixed(1)}</div>
                        <div className="small">Regular Hours</div>
                      </div>
                      <div className="col-4">
                        <div className="fs-2 fw-bold">{totals.overtimeHours.toFixed(1)}</div>
                        <div className="small">Overtime Hours</div>
                      </div>
                      <div className="col-4">
                        <div className="fs-2 fw-bold">{totals.totalHours.toFixed(1)}</div>
                        <div className="small">Total Hours</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* General Notes */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <Info size={16} className="me-1" />
                    General Notes (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Add any general notes for this timesheet..."
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    disabled={loading}
                  />
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
                type="button"
                className="btn btn-outline-primary"
                onClick={() => handleSubmit(TIMESHEET_STATUS.DRAFT)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="me-2" />
                    Save as Draft
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSubmit(TIMESHEET_STATUS.SUBMITTED)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} className="me-2" />
                    Submit for Approval
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

export default TimesheetFormModal;
