/**
 * Labor/Time Tracking & Payroll Utilities
 * Functions for worker management, attendance, and payroll calculations
 */

// Worker types
export const WORKER_TYPES = {
  PERMANENT: 'PERMANENT',
  CONTRACT: 'CONTRACT',
  DAILY_WAGE: 'DAILY_WAGE',
  PIECE_RATE: 'PIECE_RATE'
};

// Skill categories
export const SKILL_CATEGORIES = [
  'Mason',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Steel Fixer',
  'Helper',
  'Equipment Operator',
  'Supervisor',
  'Foreman',
  'Other'
];

// Skill levels
export const SKILL_LEVELS = {
  SKILLED: 'SKILLED',
  SEMI_SKILLED: 'SEMI_SKILLED',
  UNSKILLED: 'UNSKILLED'
};

// Wage types
export const WAGE_TYPES = {
  HOURLY: 'HOURLY',
  DAILY: 'DAILY',
  MONTHLY: 'MONTHLY',
  PIECE_RATE: 'PIECE_RATE'
};

// Worker status
export const WORKER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  TERMINATED: 'TERMINATED',
  ON_LEAVE: 'ON_LEAVE'
};

// Attendance status
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  HALF_DAY: 'HALF_DAY',
  LEAVE: 'LEAVE',
  HOLIDAY: 'HOLIDAY',
  OVERTIME: 'OVERTIME'
};

// Leave types
export const LEAVE_TYPES = {
  SICK: 'SICK',
  CASUAL: 'CASUAL',
  ANNUAL: 'ANNUAL',
  UNPAID: 'UNPAID'
};

// Timesheet status
export const TIMESHEET_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

// Payroll status
export const PAYROLL_STATUS = {
  PENDING: 'PENDING',
  PROCESSED: 'PROCESSED',
  PAID: 'PAID',
  FAILED: 'FAILED'
};

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE'
};

/**
 * Generate worker code
 * Format: WKR-XXX
 */
export const generateWorkerCode = (existingWorkers = []) => {
  const prefix = 'WKR-';

  const existingCodes = existingWorkers
    .map(w => w.workerCode)
    .filter(code => code && code.startsWith(prefix));

  let maxNum = 0;
  existingCodes.forEach(code => {
    const num = parseInt(code.split('-')[1]);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}${nextNum}`;
};

/**
 * Generate payroll number
 * Format: PAY-YYYYMM-XXX
 */
export const generatePayrollNumber = (existingPayrolls = []) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
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

/**
 * Calculate work hours from check-in and check-out times
 */
export const calculateWorkHours = (checkInTime, checkOutTime, breakHours = 0) => {
  if (!checkInTime || !checkOutTime) return 0;

  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);

  const diffMs = checkOut - checkIn;
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.max(0, diffHours - parseFloat(breakHours || 0));
};

/**
 * Calculate overtime hours
 */
export const calculateOvertimeHours = (workHours, standardHours = 8) => {
  return Math.max(0, parseFloat(workHours || 0) - parseFloat(standardHours));
};

/**
 * Calculate basic wage based on wage type
 */
export const calculateBasicWage = (wageType, wageRate, workDays = 0, workHours = 0, pieces = 0) => {
  const rate = parseFloat(wageRate || 0);

  switch (wageType) {
    case WAGE_TYPES.MONTHLY:
      return rate;
    case WAGE_TYPES.DAILY:
      return rate * parseFloat(workDays || 0);
    case WAGE_TYPES.HOURLY:
      return rate * parseFloat(workHours || 0);
    case WAGE_TYPES.PIECE_RATE:
      return rate * parseFloat(pieces || 0);
    default:
      return 0;
  }
};

/**
 * Calculate overtime pay
 */
export const calculateOvertimePay = (overtimeHours, overtimeRate) => {
  return parseFloat(overtimeHours || 0) * parseFloat(overtimeRate || 0);
};

/**
 * Calculate gross pay
 */
export const calculateGrossPay = (basicWage, overtimePay, bonuses = 0, allowances = 0) => {
  return (
    parseFloat(basicWage || 0) +
    parseFloat(overtimePay || 0) +
    parseFloat(bonuses || 0) +
    parseFloat(allowances || 0)
  );
};

/**
 * Calculate total deductions
 */
export const calculateTotalDeductions = (deductions = {}) => {
  return (
    parseFloat(deductions.pf || 0) +
    parseFloat(deductions.esi || 0) +
    parseFloat(deductions.tax || 0) +
    parseFloat(deductions.advance || 0) +
    parseFloat(deductions.other || 0)
  );
};

/**
 * Calculate net pay
 */
export const calculateNetPay = (grossPay, deductions) => {
  const totalDeductions = calculateTotalDeductions(deductions);
  return Math.max(0, parseFloat(grossPay || 0) - totalDeductions);
};

/**
 * Calculate PF (Provident Fund) - typically 12% of basic wage
 */
export const calculatePF = (basicWage, pfPercentage = 12) => {
  return (parseFloat(basicWage || 0) * parseFloat(pfPercentage)) / 100;
};

/**
 * Calculate ESI (Employee State Insurance) - typically 0.75% of gross pay
 */
export const calculateESI = (grossPay, esiPercentage = 0.75) => {
  return (parseFloat(grossPay || 0) * parseFloat(esiPercentage)) / 100;
};

/**
 * Get attendance status color
 */
export const getAttendanceStatusColor = (status) => {
  const colors = {
    [ATTENDANCE_STATUS.PRESENT]: 'success',
    [ATTENDANCE_STATUS.ABSENT]: 'danger',
    [ATTENDANCE_STATUS.HALF_DAY]: 'warning',
    [ATTENDANCE_STATUS.LEAVE]: 'info',
    [ATTENDANCE_STATUS.HOLIDAY]: 'secondary',
    [ATTENDANCE_STATUS.OVERTIME]: 'primary'
  };
  return colors[status] || 'secondary';
};

/**
 * Get payroll status color
 */
export const getPayrollStatusColor = (status) => {
  const colors = {
    [PAYROLL_STATUS.PENDING]: 'warning',
    [PAYROLL_STATUS.PROCESSED]: 'info',
    [PAYROLL_STATUS.PAID]: 'success',
    [PAYROLL_STATUS.FAILED]: 'danger'
  };
  return colors[status] || 'secondary';
};

/**
 * Get worker status color
 */
export const getWorkerStatusColor = (status) => {
  const colors = {
    [WORKER_STATUS.ACTIVE]: 'success',
    [WORKER_STATUS.INACTIVE]: 'secondary',
    [WORKER_STATUS.TERMINATED]: 'danger',
    [WORKER_STATUS.ON_LEAVE]: 'warning'
  };
  return colors[status] || 'secondary';
};

/**
 * Get worker type color
 */
export const getWorkerTypeColor = (type) => {
  const colors = {
    [WORKER_TYPES.PERMANENT]: 'primary',
    [WORKER_TYPES.CONTRACT]: 'info',
    [WORKER_TYPES.DAILY_WAGE]: 'warning',
    [WORKER_TYPES.PIECE_RATE]: 'secondary'
  };
  return colors[type] || 'secondary';
};

/**
 * Format phone number (Indian format)
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  return phone;
};

/**
 * Format date to DD/MM/YYYY
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Get week date range
 */
export const getWeekRange = (date = new Date()) => {
  const current = new Date(date);
  const first = current.getDate() - current.getDay();
  const last = first + 6;

  const firstDay = new Date(current.setDate(first));
  const lastDay = new Date(current.setDate(last));

  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0]
  };
};

/**
 * Calculate monthly attendance summary
 */
export const calculateMonthlyAttendance = (attendanceRecords = [], workerId, month, year) => {
  const filtered = attendanceRecords.filter(record => {
    const recordDate = new Date(record.attendanceDate);
    return record.workerId === workerId &&
           recordDate.getMonth() === month &&
           recordDate.getFullYear() === year;
  });

  const present = filtered.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
  const absent = filtered.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length;
  const halfDay = filtered.filter(r => r.status === ATTENDANCE_STATUS.HALF_DAY).length;
  const leave = filtered.filter(r => r.status === ATTENDANCE_STATUS.LEAVE).length;
  const totalDays = present + (halfDay * 0.5);

  return {
    present,
    absent,
    halfDay,
    leave,
    totalDays,
    totalRecords: filtered.length
  };
};

/**
 * Calculate worker statistics
 */
export const calculateWorkerStats = (workers = [], attendanceRecords = [], payrollRecords = []) => {
  const activeWorkers = workers.filter(w => w.status === WORKER_STATUS.ACTIVE);
  const inactiveWorkers = workers.filter(w => w.status === WORKER_STATUS.INACTIVE);
  const onLeaveWorkers = workers.filter(w => w.status === WORKER_STATUS.ON_LEAVE);

  // Calculate today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceRecords.filter(a =>
    a.attendanceDate && a.attendanceDate.startsWith(today)
  );
  const presentToday = todayAttendance.filter(a =>
    a.status === ATTENDANCE_STATUS.PRESENT || a.status === ATTENDANCE_STATUS.OVERTIME
  ).length;

  // Calculate this month's payroll
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthPayroll = payrollRecords.filter(p =>
    p.payPeriodStart && p.payPeriodStart.startsWith(currentMonth)
  );
  const totalPayrollThisMonth = thisMonthPayroll.reduce((sum, p) =>
    sum + parseFloat(p.netPay || 0), 0
  );

  return {
    totalWorkers: workers.length,
    activeWorkers: activeWorkers.length,
    inactiveWorkers: inactiveWorkers.length,
    onLeaveWorkers: onLeaveWorkers.length,
    presentToday,
    totalPayrollThisMonth,
    // By worker type
    permanent: workers.filter(w => w.workerType === WORKER_TYPES.PERMANENT).length,
    contract: workers.filter(w => w.workerType === WORKER_TYPES.CONTRACT).length,
    dailyWage: workers.filter(w => w.workerType === WORKER_TYPES.DAILY_WAGE).length,
    pieceRate: workers.filter(w => w.workerType === WORKER_TYPES.PIECE_RATE).length,
    // By skill level
    skilled: workers.filter(w => w.skillLevel === SKILL_LEVELS.SKILLED).length,
    semiSkilled: workers.filter(w => w.skillLevel === SKILL_LEVELS.SEMI_SKILLED).length,
    unskilled: workers.filter(w => w.skillLevel === SKILL_LEVELS.UNSKILLED).length
  };
};

/**
 * Calculate attendance summary for a period
 */
export const calculateAttendanceSummary = (attendanceRecords = []) => {
  const summary = {
    totalDays: attendanceRecords.length,
    presentDays: 0,
    absentDays: 0,
    halfDays: 0,
    leaveDays: 0,
    holidays: 0,
    overtimeDays: 0,
    totalWorkHours: 0,
    totalOvertimeHours: 0
  };

  attendanceRecords.forEach(record => {
    switch (record.status) {
      case ATTENDANCE_STATUS.PRESENT:
        summary.presentDays += 1;
        break;
      case ATTENDANCE_STATUS.ABSENT:
        summary.absentDays += 1;
        break;
      case ATTENDANCE_STATUS.HALF_DAY:
        summary.halfDays += 1;
        summary.presentDays += 0.5;
        break;
      case ATTENDANCE_STATUS.LEAVE:
        summary.leaveDays += 1;
        break;
      case ATTENDANCE_STATUS.HOLIDAY:
        summary.holidays += 1;
        break;
      case ATTENDANCE_STATUS.OVERTIME:
        summary.overtimeDays += 1;
        break;
    }

    summary.totalWorkHours += parseFloat(record.workHours || 0);
    summary.totalOvertimeHours += parseFloat(record.overtimeHours || 0);
  });

  return summary;
};

/**
 * Validate worker data
 */
export const validateWorkerData = (worker) => {
  const errors = [];

  if (!worker.name || worker.name.trim() === '') errors.push('Name is required');
  if (!worker.phone || worker.phone.trim() === '') errors.push('Phone is required');
  if (!worker.workerType) errors.push('Worker type is required');
  if (!worker.skillCategory) errors.push('Skill category is required');
  if (!worker.wageType) errors.push('Wage type is required');
  if (!worker.wageRate || worker.wageRate <= 0) errors.push('Valid wage rate is required');

  return { valid: errors.length === 0, errors };
};

/**
 * Calculate leave balance
 */
export const calculateLeaveBalance = (totalLeaves = 0, usedLeaves = 0) => {
  return Math.max(0, parseFloat(totalLeaves) - parseFloat(usedLeaves));
};

/**
 * Get days in a date range
 */
export const getDaysInRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

/**
 * Get week start and end dates
 */
export const getWeekDates = (date = new Date()) => {
  const currentDate = new Date(date);
  const day = currentDate.getDay();
  const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);

  const weekStart = new Date(currentDate.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
};

/**
 * Calculate advance repayment schedule
 */
export const calculateAdvanceRepayment = (advanceAmount, deductionPerPayroll, alreadyRepaid = 0) => {
  const remaining = parseFloat(advanceAmount) - parseFloat(alreadyRepaid);
  const deduction = parseFloat(deductionPerPayroll);

  if (remaining <= 0) return { installmentsRemaining: 0, amountPerInstallment: 0 };

  const installments = Math.ceil(remaining / deduction);

  return {
    installmentsRemaining: installments,
    amountPerInstallment: deduction,
    finalInstallmentAmount: remaining - (deduction * (installments - 1))
  };
};

export default {
  WORKER_TYPES,
  SKILL_CATEGORIES,
  SKILL_LEVELS,
  WAGE_TYPES,
  WORKER_STATUS,
  ATTENDANCE_STATUS,
  LEAVE_TYPES,
  TIMESHEET_STATUS,
  PAYROLL_STATUS,
  PAYMENT_METHODS,
  generateWorkerCode,
  generatePayrollNumber,
  calculateWorkHours,
  calculateOvertimeHours,
  calculateBasicWage,
  calculateOvertimePay,
  calculateGrossPay,
  calculateTotalDeductions,
  calculateNetPay,
  calculatePF,
  calculateESI,
  getAttendanceStatusColor,
  getPayrollStatusColor,
  getWorkerStatusColor,
  getWorkerTypeColor,
  formatPhoneNumber,
  formatDate,
  getWeekRange,
  calculateMonthlyAttendance,
  calculateWorkerStats,
  calculateAttendanceSummary,
  validateWorkerData,
  calculateLeaveBalance,
  getDaysInRange,
  getWeekDates,
  calculateAdvanceRepayment
};
