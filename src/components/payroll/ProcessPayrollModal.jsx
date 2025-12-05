import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  X,
  Wallet,
  Calendar,
  User,
  Building2,
  DollarSign,
  Minus,
  Plus,
  Calculator,
  CreditCard,
  AlertCircle,
  Info,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react';
import {
  PAYROLL_STATUS,
  PAYMENT_METHODS,
  TIMESHEET_STATUS
} from '../../utils/laborUtils';

const ProcessPayrollModal = ({ show, onClose, payroll, onSuccess }) => {
  const { data, user, addPayroll, updatePayroll } = useData();

  // Generate payroll number
  const generatePayrollNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const existingPayrolls = data.payroll || [];
    const prefix = `PAY-${year}${month}-`;

    const existingNumbers = existingPayrolls
      .map(p => p.payrollNumber)
      .filter(num => num && num.startsWith(prefix));

    let maxNum = 0;
    existingNumbers.forEach(num => {
      const n = parseInt(num.split('-')[2]);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    });

    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
  };

  // Get current month dates
  const getCurrentMonthDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const currentMonth = getCurrentMonthDates();

  // Initial form data
  const initialFormData = {
    payrollNumber: generatePayrollNumber(),
    workerId: '',
    projectId: '',
    payPeriodStart: currentMonth.start,
    payPeriodEnd: currentMonth.end,

    // Earnings
    basicSalary: 0,
    hoursWorked: 0,
    hourlyRate: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    allowances: 0,
    bonuses: 0,

    // Deductions
    pfDeduction: 0,
    esiDeduction: 0,
    tdsDeduction: 0,
    advanceDeduction: 0,
    otherDeductions: 0,

    // Payment
    paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
    paymentStatus: PAYROLL_STATUS.PENDING,
    paymentDate: '',
    transactionRef: '',

    // Notes
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingTimesheets, setLoadingTimesheets] = useState(false);
  const [workerTimesheets, setWorkerTimesheets] = useState([]);

  // Get active workers and projects
  const activeWorkers = useMemo(() =>
    (data.workers || []).filter(w => w.isActive !== false),
    [data.workers]
  );

  const activeProjects = useMemo(() =>
    (data.projects || []).filter(p => p.status && p.status.toLowerCase() === 'active'),
    [data.projects]
  );

  // Get selected worker details
  const selectedWorker = useMemo(() => {
    if (!formData.workerId) return null;
    return activeWorkers.find(w => w.id === parseInt(formData.workerId));
  }, [formData.workerId, activeWorkers]);

  // Calculate earnings
  const earnings = useMemo(() => {
    const basicPay = parseFloat(formData.basicSalary) || 0;
    const regularPay = (parseFloat(formData.hoursWorked) || 0) * (parseFloat(formData.hourlyRate) || 0);
    const overtimePay = (parseFloat(formData.overtimeHours) || 0) * (parseFloat(formData.overtimeRate) || 0);
    const allowances = parseFloat(formData.allowances) || 0;
    const bonuses = parseFloat(formData.bonuses) || 0;

    const grossPay = basicPay + regularPay + overtimePay + allowances + bonuses;

    return {
      basicPay,
      regularPay,
      overtimePay,
      allowances,
      bonuses,
      grossPay
    };
  }, [formData.basicSalary, formData.hoursWorked, formData.hourlyRate,
      formData.overtimeHours, formData.overtimeRate, formData.allowances, formData.bonuses]);

  // Calculate deductions
  const deductions = useMemo(() => {
    const pf = parseFloat(formData.pfDeduction) || 0;
    const esi = parseFloat(formData.esiDeduction) || 0;
    const tds = parseFloat(formData.tdsDeduction) || 0;
    const advance = parseFloat(formData.advanceDeduction) || 0;
    const other = parseFloat(formData.otherDeductions) || 0;

    const totalDeductions = pf + esi + tds + advance + other;

    return {
      pf,
      esi,
      tds,
      advance,
      other,
      totalDeductions
    };
  }, [formData.pfDeduction, formData.esiDeduction, formData.tdsDeduction,
      formData.advanceDeduction, formData.otherDeductions]);

  // Calculate net pay
  const netPay = useMemo(() => {
    return Math.max(0, earnings.grossPay - deductions.totalDeductions);
  }, [earnings.grossPay, deductions.totalDeductions]);

  // Load payroll data when editing
  useEffect(() => {
    if (show && payroll) {
      setFormData({
        payrollNumber: payroll.payrollNumber || generatePayrollNumber(),
        workerId: payroll.workerId || '',
        projectId: payroll.projectId || '',
        payPeriodStart: payroll.payPeriodStart || currentMonth.start,
        payPeriodEnd: payroll.payPeriodEnd || currentMonth.end,

        basicSalary: payroll.basicSalary || 0,
        hoursWorked: payroll.hoursWorked || 0,
        hourlyRate: payroll.hourlyRate || 0,
        overtimeHours: payroll.overtimeHours || 0,
        overtimeRate: payroll.overtimeRate || 0,
        allowances: payroll.allowances || 0,
        bonuses: payroll.bonuses || 0,

        pfDeduction: payroll.pfDeduction || 0,
        esiDeduction: payroll.esiDeduction || 0,
        tdsDeduction: payroll.tdsDeduction || 0,
        advanceDeduction: payroll.advanceDeduction || 0,
        otherDeductions: payroll.otherDeductions || 0,

        paymentMethod: payroll.paymentMethod || PAYMENT_METHODS.BANK_TRANSFER,
        paymentStatus: payroll.paymentStatus || PAYROLL_STATUS.PENDING,
        paymentDate: payroll.paymentDate || '',
        transactionRef: payroll.transactionRef || '',

        notes: payroll.notes || ''
      });
    } else if (show && !payroll) {
      setFormData({ ...initialFormData, payrollNumber: generatePayrollNumber() });
    }
  }, [show, payroll]);

  // Load timesheets when worker is selected
  useEffect(() => {
    if (formData.workerId && formData.payPeriodStart && formData.payPeriodEnd) {
      loadWorkerTimesheets();
    }
  }, [formData.workerId, formData.payPeriodStart, formData.payPeriodEnd]);

  // Load worker default rate when worker selected
  useEffect(() => {
    if (selectedWorker) {
      setFormData(prev => ({
        ...prev,
        basicSalary: selectedWorker.basicSalary || selectedWorker.monthlySalary || 0,
        hourlyRate: selectedWorker.hourlyRate || selectedWorker.dailyWage / 8 || 0,
        overtimeRate: selectedWorker.overtimeRate || (selectedWorker.hourlyRate || selectedWorker.dailyWage / 8) * 1.5 || 0
      }));
    }
  }, [selectedWorker]);

  // Load timesheets for worker in pay period
  const loadWorkerTimesheets = async () => {
    if (!formData.workerId || !formData.payPeriodStart || !formData.payPeriodEnd) return;

    setLoadingTimesheets(true);
    try {
      const allTimesheets = data.timeSheets || [];
      const workerSheets = allTimesheets.filter(ts => {
        if (ts.workerId !== parseInt(formData.workerId)) return false;
        if (ts.status !== TIMESHEET_STATUS.APPROVED) return false;

        const weekStart = new Date(ts.weekStartDate);
        const periodStart = new Date(formData.payPeriodStart);
        const periodEnd = new Date(formData.payPeriodEnd);

        return weekStart >= periodStart && weekStart <= periodEnd;
      });

      setWorkerTimesheets(workerSheets);

      // Calculate total hours from approved timesheets
      if (workerSheets.length > 0) {
        const totalRegular = workerSheets.reduce((sum, ts) => sum + (parseFloat(ts.regularHours) || 0), 0);
        const totalOvertime = workerSheets.reduce((sum, ts) => sum + (parseFloat(ts.overtimeHours) || 0), 0);

        setFormData(prev => ({
          ...prev,
          hoursWorked: totalRegular,
          overtimeHours: totalOvertime
        }));
      }
    } catch (error) {
      console.error('Error loading timesheets:', error);
    } finally {
      setLoadingTimesheets(false);
    }
  };

  // Auto-calculate statutory deductions
  const calculateStatutoryDeductions = () => {
    const grossPay = earnings.grossPay;

    // PF: 12% of basic (if basic > 15000, then 12% of 15000)
    const pfBase = Math.min(parseFloat(formData.basicSalary) || 0, 15000);
    const pf = pfBase * 0.12;

    // ESI: 0.75% of gross pay (if gross < 21000)
    const esi = grossPay < 21000 ? grossPay * 0.0075 : 0;

    // TDS: Basic calculation (can be more complex)
    let tds = 0;
    if (grossPay > 50000) {
      tds = (grossPay - 50000) * 0.1; // Simplified TDS
    }

    setFormData(prev => ({
      ...prev,
      pfDeduction: pf.toFixed(2),
      esiDeduction: esi.toFixed(2),
      tdsDeduction: tds.toFixed(2)
    }));
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.workerId) {
      newErrors.workerId = 'Please select a worker';
    }

    if (!formData.payPeriodStart) {
      newErrors.payPeriodStart = 'Please select pay period start date';
    }

    if (!formData.payPeriodEnd) {
      newErrors.payPeriodEnd = 'Please select pay period end date';
    }

    if (earnings.grossPay === 0) {
      newErrors.earnings = 'Gross pay cannot be zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payrollData = {
        payrollNumber: formData.payrollNumber,
        workerId: parseInt(formData.workerId),
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
        payPeriodStart: formData.payPeriodStart,
        payPeriodEnd: formData.payPeriodEnd,

        // Earnings
        basicSalary: parseFloat(formData.basicSalary) || 0,
        hoursWorked: parseFloat(formData.hoursWorked) || 0,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        overtimeHours: parseFloat(formData.overtimeHours) || 0,
        overtimeRate: parseFloat(formData.overtimeRate) || 0,
        allowances: parseFloat(formData.allowances) || 0,
        bonuses: parseFloat(formData.bonuses) || 0,
        grossPay: earnings.grossPay,

        // Deductions
        pfDeduction: deductions.pf,
        esiDeduction: deductions.esi,
        tdsDeduction: deductions.tds,
        advanceDeduction: deductions.advance,
        otherDeductions: deductions.other,
        totalDeductions: deductions.totalDeductions,

        // Net Pay
        netPay: netPay,

        // Payment
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        paymentDate: formData.paymentDate || null,
        transactionRef: formData.transactionRef || '',

        // Notes
        notes: formData.notes || ''
      };

      if (payroll?.id) {
        // Update existing
        await updatePayroll(payroll.id, payrollData);
        onSuccess('Payroll updated successfully');
      } else {
        // Add new
        await addPayroll(payrollData);
        onSuccess('Payroll processed successfully');
      }

      handleClose();
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Failed to process payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setWorkerTimesheets([]);
    onClose();
  };

  if (!show) return null;

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
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
                  <Wallet className="me-2" size={20} />
                  {payroll ? 'Edit Payroll' : 'Process Payroll'}
                </h5>
                <small>
                  <FileText size={14} className="me-1" />
                  Payroll #{formData.payrollNumber}
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
              <form onSubmit={handleSubmit}>
                {/* Worker & Period Selection */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <User size={16} className="me-1" />
                      Worker <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.workerId ? 'is-invalid' : ''}`}
                      value={formData.workerId}
                      onChange={(e) => handleChange('workerId', e.target.value)}
                      disabled={loading || !!payroll}
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
                    {selectedWorker && (
                      <small className="text-muted">
                        {selectedWorker.skillCategory} • {selectedWorker.workerType}
                      </small>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <Building2 size={16} className="me-1" />
                      Project (Optional)
                    </label>
                    <select
                      className="form-select"
                      value={formData.projectId}
                      onChange={(e) => handleChange('projectId', e.target.value)}
                      disabled={loading}
                    >
                      <option value="">No Specific Project</option>
                      {activeProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Link to specific project (optional)</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <Calendar size={16} className="me-1" />
                      Pay Period Start <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.payPeriodStart ? 'is-invalid' : ''}`}
                      value={formData.payPeriodStart}
                      onChange={(e) => handleChange('payPeriodStart', e.target.value)}
                      disabled={loading}
                    />
                    {errors.payPeriodStart && (
                      <div className="invalid-feedback">{errors.payPeriodStart}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <Calendar size={16} className="me-1" />
                      Pay Period End <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.payPeriodEnd ? 'is-invalid' : ''}`}
                      value={formData.payPeriodEnd}
                      onChange={(e) => handleChange('payPeriodEnd', e.target.value)}
                      disabled={loading}
                    />
                    {errors.payPeriodEnd && (
                      <div className="invalid-feedback">{errors.payPeriodEnd}</div>
                    )}
                  </div>
                </div>

                {/* Timesheet Info */}
                {workerTimesheets.length > 0 && (
                  <div className="alert alert-info d-flex align-items-start mb-4">
                    <Clock size={20} className="me-2 flex-shrink-0 mt-1" />
                    <div>
                      <strong>Approved Timesheets Found:</strong>
                      <p className="mb-0">
                        {workerTimesheets.length} timesheet(s) • {' '}
                        {workerTimesheets.reduce((sum, ts) => sum + (parseFloat(ts.regularHours) || 0), 0).toFixed(1)} regular hours • {' '}
                        {workerTimesheets.reduce((sum, ts) => sum + (parseFloat(ts.overtimeHours) || 0), 0).toFixed(1)} overtime hours
                      </p>
                    </div>
                  </div>
                )}

                {errors.earnings && (
                  <div className="alert alert-danger d-flex align-items-center mb-4">
                    <AlertCircle size={20} className="me-2" />
                    {errors.earnings}
                  </div>
                )}

                {/* Earnings Section */}
                <div className="card border-success mb-4">
                  <div className="card-header bg-success bg-opacity-10 border-success">
                    <h6 className="mb-0 text-success">
                      <TrendingUp size={18} className="me-2" />
                      Earnings
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Basic Salary</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.basicSalary}
                            onChange={(e) => handleChange('basicSalary', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">Monthly basic salary</small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Hours Worked</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.hoursWorked}
                          onChange={(e) => handleChange('hoursWorked', e.target.value)}
                          min="0"
                          step="0.5"
                          disabled={loading || loadingTimesheets}
                        />
                        <small className="text-muted">Regular hours</small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Hourly Rate</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.hourlyRate}
                            onChange={(e) => handleChange('hourlyRate', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">Per hour rate</small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Overtime Hours</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.overtimeHours}
                          onChange={(e) => handleChange('overtimeHours', e.target.value)}
                          min="0"
                          step="0.5"
                          disabled={loading || loadingTimesheets}
                        />
                        <small className="text-muted">OT hours</small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Overtime Rate</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.overtimeRate}
                            onChange={(e) => handleChange('overtimeRate', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">OT rate (usually 1.5x)</small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Allowances</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.allowances}
                            onChange={(e) => handleChange('allowances', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">DA, HRA, etc.</small>
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">Bonuses</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.bonuses}
                            onChange={(e) => handleChange('bonuses', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">Performance bonus, incentives</small>
                      </div>
                    </div>

                    {/* Earnings Breakdown */}
                    <div className="mt-3 p-3 bg-light rounded">
                      <div className="row small">
                        <div className="col-6 mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Basic Salary:</span>
                            <strong>{formatCurrency(earnings.basicPay)}</strong>
                          </div>
                        </div>
                        <div className="col-6 mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Regular Hours Pay:</span>
                            <strong>{formatCurrency(earnings.regularPay)}</strong>
                          </div>
                        </div>
                        <div className="col-6 mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Overtime Pay:</span>
                            <strong>{formatCurrency(earnings.overtimePay)}</strong>
                          </div>
                        </div>
                        <div className="col-6 mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Allowances:</span>
                            <strong>{formatCurrency(earnings.allowances)}</strong>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="d-flex justify-content-between">
                            <span>Bonuses:</span>
                            <strong>{formatCurrency(earnings.bonuses)}</strong>
                          </div>
                        </div>
                        <div className="col-12 mt-2 pt-2 border-top">
                          <div className="d-flex justify-content-between">
                            <strong className="text-success">Gross Pay:</strong>
                            <strong className="text-success fs-5">{formatCurrency(earnings.grossPay)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="card border-danger mb-4">
                  <div className="card-header bg-danger bg-opacity-10 border-danger d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 text-danger">
                      <Minus size={18} className="me-2" />
                      Deductions
                    </h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={calculateStatutoryDeductions}
                      disabled={loading || earnings.grossPay === 0}
                    >
                      <Calculator size={14} className="me-1" />
                      Auto-Calculate
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">PF Deduction (12%)</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.pfDeduction}
                            onChange={(e) => handleChange('pfDeduction', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">Provident Fund (12% of basic up to ₹15,000)</small>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">ESI Deduction (0.75%)</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.esiDeduction}
                            onChange={(e) => handleChange('esiDeduction', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">ESI (if gross &lt; ₹21,000)</small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">TDS Deduction</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.tdsDeduction}
                            onChange={(e) => handleChange('tdsDeduction', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">Tax Deducted at Source</small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Advance Deduction</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.advanceDeduction}
                            onChange={(e) => handleChange('advanceDeduction', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">Advance/loan recovery</small>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Other Deductions</label>
                        <div className="input-group">
                          <span className="input-group-text">₹</span>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.otherDeductions}
                            onChange={(e) => handleChange('otherDeductions', e.target.value)}
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <small className="text-muted">Any other deductions</small>
                      </div>
                    </div>

                    {/* Deductions Summary */}
                    <div className="mt-3 p-3 bg-light rounded">
                      <div className="d-flex justify-content-between">
                        <strong className="text-danger">Total Deductions:</strong>
                        <strong className="text-danger fs-5">{formatCurrency(deductions.totalDeductions)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Summary */}
                <div className="card bg-primary text-white mb-4">
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="fs-4 fw-bold">{formatCurrency(earnings.grossPay)}</div>
                        <div className="small">Gross Pay</div>
                      </div>
                      <div className="col-4">
                        <div className="fs-4 fw-bold">- {formatCurrency(deductions.totalDeductions)}</div>
                        <div className="small">Total Deductions</div>
                      </div>
                      <div className="col-4">
                        <div className="fs-2 fw-bold">{formatCurrency(netPay)}</div>
                        <div className="small">Net Pay</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="card border-info mb-4">
                  <div className="card-header bg-info bg-opacity-10 border-info">
                    <h6 className="mb-0 text-info">
                      <CreditCard size={18} className="me-2" />
                      Payment Details
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Payment Method</label>
                        <select
                          className="form-select"
                          value={formData.paymentMethod}
                          onChange={(e) => handleChange('paymentMethod', e.target.value)}
                          disabled={loading}
                        >
                          {Object.values(PAYMENT_METHODS).map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Payment Status</label>
                        <select
                          className="form-select"
                          value={formData.paymentStatus}
                          onChange={(e) => handleChange('paymentStatus', e.target.value)}
                          disabled={loading}
                        >
                          {Object.values(PAYROLL_STATUS).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Payment Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.paymentDate}
                          onChange={(e) => handleChange('paymentDate', e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">Transaction Reference</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Cheque number, transaction ID, etc."
                          value={formData.transactionRef}
                          onChange={(e) => handleChange('transactionRef', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <Info size={16} className="me-1" />
                    Notes (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Add any notes about this payroll..."
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
                type="submit"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading || earnings.grossPay === 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign size={16} className="me-2" />
                    {payroll ? 'Update Payroll' : 'Process Payroll'}
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

export default ProcessPayrollModal;
