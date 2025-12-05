/**
 * Budget Planning & Forecasting Utilities
 * Functions for budget management, variance analysis, and EVM calculations
 */

// Budget status
export const BUDGET_STATUS = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED'
};

// Category types
export const CATEGORY_TYPES = {
  MATERIAL: 'MATERIAL',
  LABOR: 'LABOR',
  EQUIPMENT: 'EQUIPMENT',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  OVERHEAD: 'OVERHEAD',
  OTHER: 'OTHER'
};

// Alert types
export const ALERT_TYPES = {
  THRESHOLD_EXCEEDED: 'THRESHOLD_EXCEEDED',
  OVERBUDGET: 'OVERBUDGET',
  FORECAST_OVERRUN: 'FORECAST_OVERRUN'
};

// Alert severity
export const ALERT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Forecast methods
export const FORECAST_METHODS = {
  LINEAR: 'LINEAR',
  WEIGHTED_AVERAGE: 'WEIGHTED_AVERAGE',
  EARNED_VALUE: 'EARNED_VALUE'
};

/**
 * Calculate available amount
 */
export const calculateAvailableAmount = (budgeted, allocated = 0, committed = 0, spent = 0) => {
  return parseFloat(budgeted || 0) - parseFloat(allocated || 0) - parseFloat(committed || 0) - parseFloat(spent || 0);
};

/**
 * Calculate variance
 */
export const calculateVariance = (budgeted, actual) => {
  return parseFloat(budgeted || 0) - parseFloat(actual || 0);
};

/**
 * Calculate variance percentage
 */
export const calculateVariancePercentage = (budgeted, actual) => {
  const budget = parseFloat(budgeted || 0);
  if (budget === 0) return 0;

  const variance = calculateVariance(budgeted, actual);
  return (variance / budget) * 100;
};

/**
 * Calculate budget utilization percentage
 */
export const calculateUtilization = (spent, budgeted) => {
  const budget = parseFloat(budgeted || 0);
  if (budget === 0) return 0;

  return (parseFloat(spent || 0) / budget) * 100;
};

/**
 * Get utilization status color
 */
export const getUtilizationColor = (utilizationPercentage) => {
  const util = parseFloat(utilizationPercentage);

  if (util >= 100) return 'danger';
  if (util >= 90) return 'warning';
  if (util >= 80) return 'info';
  return 'success';
};

/**
 * Get variance color (positive = green, negative = red)
 */
export const getVarianceColor = (variance) => {
  const val = parseFloat(variance || 0);
  if (val > 0) return 'success'; // Under budget
  if (val < 0) return 'danger';  // Over budget
  return 'secondary';
};

/**
 * Check if budget alert should be triggered
 */
export const shouldTriggerAlert = (utilized, threshold) => {
  return parseFloat(utilized) >= parseFloat(threshold);
};

/**
 * Determine alert severity based on utilization
 */
export const determineAlertSeverity = (utilizationPercentage) => {
  const util = parseFloat(utilizationPercentage);

  if (util >= 100) return ALERT_SEVERITY.CRITICAL;
  if (util >= 95) return ALERT_SEVERITY.HIGH;
  if (util >= 90) return ALERT_SEVERITY.MEDIUM;
  return ALERT_SEVERITY.LOW;
};

/**
 * Earned Value Management (EVM) Calculations
 */

/**
 * Calculate Planned Value (PV)
 * PV = Total Budget × Planned % Complete
 */
export const calculatePlannedValue = (totalBudget, plannedPercentage) => {
  return (parseFloat(totalBudget || 0) * parseFloat(plannedPercentage || 0)) / 100;
};

/**
 * Calculate Earned Value (EV)
 * EV = Total Budget × Actual % Complete
 */
export const calculateEarnedValue = (totalBudget, actualPercentage) => {
  return (parseFloat(totalBudget || 0) * parseFloat(actualPercentage || 0)) / 100;
};

/**
 * Calculate Actual Cost (AC)
 * AC = Sum of all actual costs incurred
 */
export const calculateActualCost = (expenses = []) => {
  return expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
};

/**
 * Calculate Cost Variance (CV)
 * CV = EV - AC
 * Positive = Under budget, Negative = Over budget
 */
export const calculateCostVariance = (earnedValue, actualCost) => {
  return parseFloat(earnedValue || 0) - parseFloat(actualCost || 0);
};

/**
 * Calculate Schedule Variance (SV)
 * SV = EV - PV
 * Positive = Ahead of schedule, Negative = Behind schedule
 */
export const calculateScheduleVariance = (earnedValue, plannedValue) => {
  return parseFloat(earnedValue || 0) - parseFloat(plannedValue || 0);
};

/**
 * Calculate Cost Performance Index (CPI)
 * CPI = EV / AC
 * > 1 = Under budget, < 1 = Over budget
 */
export const calculateCPI = (earnedValue, actualCost) => {
  const ac = parseFloat(actualCost || 0);
  if (ac === 0) return 0;

  return parseFloat(earnedValue || 0) / ac;
};

/**
 * Calculate Schedule Performance Index (SPI)
 * SPI = EV / PV
 * > 1 = Ahead of schedule, < 1 = Behind schedule
 */
export const calculateSPI = (earnedValue, plannedValue) => {
  const pv = parseFloat(plannedValue || 0);
  if (pv === 0) return 0;

  return parseFloat(earnedValue || 0) / pv;
};

/**
 * Calculate Estimate at Completion (EAC)
 * EAC = Budget at Completion / CPI
 */
export const calculateEAC = (totalBudget, cpi) => {
  const cpiValue = parseFloat(cpi || 0);
  if (cpiValue === 0) return 0;

  return parseFloat(totalBudget || 0) / cpiValue;
};

/**
 * Calculate Estimate to Complete (ETC)
 * ETC = EAC - AC
 */
export const calculateETC = (eac, actualCost) => {
  return parseFloat(eac || 0) - parseFloat(actualCost || 0);
};

/**
 * Calculate Variance at Completion (VAC)
 * VAC = BAC - EAC
 */
export const calculateVAC = (totalBudget, eac) => {
  return parseFloat(totalBudget || 0) - parseFloat(eac || 0);
};

/**
 * Calculate To Complete Performance Index (TCPI)
 * TCPI = (BAC - EV) / (BAC - AC)
 */
export const calculateTCPI = (totalBudget, earnedValue, actualCost) => {
  const denominator = parseFloat(totalBudget || 0) - parseFloat(actualCost || 0);
  if (denominator === 0) return 0;

  const numerator = parseFloat(totalBudget || 0) - parseFloat(earnedValue || 0);
  return numerator / denominator;
};

/**
 * Perform complete EVM analysis
 */
export const performEVMAnalysis = (totalBudget, actualPercentage, plannedPercentage, actualCost) => {
  const pv = calculatePlannedValue(totalBudget, plannedPercentage);
  const ev = calculateEarnedValue(totalBudget, actualPercentage);
  const ac = parseFloat(actualCost || 0);

  const cv = calculateCostVariance(ev, ac);
  const sv = calculateScheduleVariance(ev, pv);
  const cpi = calculateCPI(ev, ac);
  const spi = calculateSPI(ev, pv);
  const eac = calculateEAC(totalBudget, cpi);
  const etc = calculateETC(eac, ac);
  const vac = calculateVAC(totalBudget, eac);
  const tcpi = calculateTCPI(totalBudget, ev, ac);

  return {
    plannedValue: pv,
    earnedValue: ev,
    actualCost: ac,
    costVariance: cv,
    scheduleVariance: sv,
    costPerformanceIndex: cpi,
    schedulePerformanceIndex: spi,
    estimateAtCompletion: eac,
    estimateToComplete: etc,
    varianceAtCompletion: vac,
    toCompletePerformanceIndex: tcpi,
    status: {
      costStatus: cv > 0 ? 'Under Budget' : cv < 0 ? 'Over Budget' : 'On Budget',
      scheduleStatus: sv > 0 ? 'Ahead of Schedule' : sv < 0 ? 'Behind Schedule' : 'On Schedule',
      cpiStatus: cpi > 1 ? 'Good' : cpi < 1 ? 'Poor' : 'Fair',
      spiStatus: spi > 1 ? 'Good' : spi < 1 ? 'Poor' : 'Fair'
    }
  };
};

/**
 * Linear forecast
 */
export const linearForecast = (totalBudget, percentComplete, actualCost) => {
  const complete = parseFloat(percentComplete || 0);
  if (complete === 0) return 0;

  const ac = parseFloat(actualCost || 0);
  const burnRate = ac / (complete / 100);

  return burnRate;
};

/**
 * Weighted average forecast
 */
export const weightedAverageForecast = (totalBudget, actualCost, cpi, weight = 0.7) => {
  const linearPart = linearForecast(totalBudget, cpi * 100, actualCost);
  const evmPart = calculateEAC(totalBudget, cpi);

  return (linearPart * weight) + (evmPart * (1 - weight));
};

/**
 * Calculate budget summary
 */
export const calculateBudgetSummary = (lineItems = []) => {
  const summary = {
    totalBudgeted: 0,
    totalAllocated: 0,
    totalCommitted: 0,
    totalSpent: 0,
    totalAvailable: 0,
    categories: {}
  };

  lineItems.forEach(item => {
    const budgeted = parseFloat(item.budgetedAmount || 0);
    const allocated = parseFloat(item.allocatedAmount || 0);
    const committed = parseFloat(item.committedAmount || 0);
    const spent = parseFloat(item.spentAmount || 0);
    const available = calculateAvailableAmount(budgeted, allocated, committed, spent);

    summary.totalBudgeted += budgeted;
    summary.totalAllocated += allocated;
    summary.totalCommitted += committed;
    summary.totalSpent += spent;
    summary.totalAvailable += available;

    // Category breakdown
    const category = item.categoryType || 'OTHER';
    if (!summary.categories[category]) {
      summary.categories[category] = {
        budgeted: 0,
        spent: 0,
        variance: 0
      };
    }

    summary.categories[category].budgeted += budgeted;
    summary.categories[category].spent += spent;
    summary.categories[category].variance = calculateVariance(
      summary.categories[category].budgeted,
      summary.categories[category].spent
    );
  });

  return summary;
};

/**
 * Get budget health status
 */
export const getBudgetHealthStatus = (utilizationPercentage, variancePercentage) => {
  const util = parseFloat(utilizationPercentage);
  const variance = parseFloat(variancePercentage);

  if (util >= 100 || variance < -10) return 'Critical';
  if (util >= 90 || variance < -5) return 'Warning';
  if (util >= 80) return 'Caution';
  return 'Healthy';
};

/**
 * Get budget status color
 */
export const getBudgetStatusColor = (status) => {
  const colors = {
    [BUDGET_STATUS.DRAFT]: 'secondary',
    [BUDGET_STATUS.APPROVED]: 'info',
    [BUDGET_STATUS.ACTIVE]: 'success',
    [BUDGET_STATUS.CLOSED]: 'danger'
  };
  return colors[status] || 'secondary';
};

/**
 * Format currency in Indian Rupee format
 */
export const formatCurrency = (amount) => {
  const value = parseFloat(amount || 0);
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Validate budget line item
 */
export const validateBudgetLineItem = (lineItem) => {
  const errors = [];

  if (!lineItem.categoryType) errors.push('Category is required');
  if (!lineItem.description || lineItem.description.trim() === '') {
    errors.push('Description is required');
  }
  if (!lineItem.budgetedAmount || lineItem.budgetedAmount <= 0) {
    errors.push('Budgeted amount must be greater than 0');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Calculate cash flow projection
 */
export const calculateCashFlowProjection = (lineItems = [], months = 12) => {
  const projection = [];
  const monthlyBurn = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.budgetedAmount || 0) / months);
  }, 0);

  let remainingBudget = lineItems.reduce((sum, item) => {
    return sum + parseFloat(item.budgetedAmount || 0);
  }, 0);

  for (let i = 0; i < months; i++) {
    remainingBudget -= monthlyBurn;
    projection.push({
      month: i + 1,
      expectedSpend: monthlyBurn,
      remainingBudget: Math.max(0, remainingBudget)
    });
  }

  return projection;
};

export default {
  BUDGET_STATUS,
  CATEGORY_TYPES,
  ALERT_TYPES,
  ALERT_SEVERITY,
  FORECAST_METHODS,
  calculateAvailableAmount,
  calculateVariance,
  calculateVariancePercentage,
  calculateUtilization,
  getUtilizationColor,
  getVarianceColor,
  shouldTriggerAlert,
  determineAlertSeverity,
  calculatePlannedValue,
  calculateEarnedValue,
  calculateActualCost,
  calculateCostVariance,
  calculateScheduleVariance,
  calculateCPI,
  calculateSPI,
  calculateEAC,
  calculateETC,
  calculateVAC,
  calculateTCPI,
  performEVMAnalysis,
  linearForecast,
  weightedAverageForecast,
  calculateBudgetSummary,
  getBudgetHealthStatus,
  getBudgetStatusColor,
  formatCurrency,
  validateBudgetLineItem,
  calculateCashFlowProjection
};
