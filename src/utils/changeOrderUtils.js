/**
 * Change Orders Utilities
 * Functions for change order management, impact analysis, and approval workflows
 */

// Change order status
export const CHANGE_ORDER_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IMPLEMENTED: 'IMPLEMENTED'
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

// Change reasons
export const CHANGE_REASONS = {
  DESIGN_CHANGE: 'DESIGN_CHANGE',
  SITE_CONDITION: 'SITE_CONDITION',
  CLIENT_REQUEST: 'CLIENT_REQUEST',
  ERROR_CORRECTION: 'ERROR_CORRECTION',
  REGULATORY_REQUIREMENT: 'REGULATORY_REQUIREMENT',
  UNFORESEEN_CIRCUMSTANCES: 'UNFORESEEN_CIRCUMSTANCES'
};

// Change categories
export const CHANGE_CATEGORIES = {
  ADDITION: 'ADDITION',
  DELETION: 'DELETION',
  MODIFICATION: 'MODIFICATION'
};

// Item types
export const ITEM_TYPES = {
  MATERIAL: 'MATERIAL',
  LABOR: 'LABOR',
  EQUIPMENT: 'EQUIPMENT',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  OTHER: 'OTHER'
};

// Impact types
export const IMPACT_TYPES = {
  BUDGET: 'BUDGET',
  SCHEDULE: 'SCHEDULE',
  SCOPE: 'SCOPE',
  QUALITY: 'QUALITY',
  RISK: 'RISK'
};

// Impact severity
export const IMPACT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Generate change order number
 * Format: CO-PROJ-XXX
 */
export const generateChangeOrderNumber = (existingChangeOrders = [], projectCode = 'PROJ') => {
  const prefix = `CO-${projectCode}-`;

  const existingNumbers = existingChangeOrders
    .map(co => co.changeOrderNumber)
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
 * Calculate change order amount from line items
 */
export const calculateChangeOrderAmount = (lineItems = []) => {
  return lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitRate || 0));
  }, 0);
};

/**
 * Calculate revised contract amount
 */
export const calculateRevisedContractAmount = (originalAmount, changeOrderAmount) => {
  return parseFloat(originalAmount || 0) + parseFloat(changeOrderAmount || 0);
};

/**
 * Calculate time impact in days
 */
export const calculateTimeImpact = (originalCompletionDate, revisedCompletionDate) => {
  const original = new Date(originalCompletionDate);
  const revised = new Date(revisedCompletionDate);

  const diffTime = revised - original;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Calculate total cost impact
 */
export const calculateTotalCostImpact = (impacts = {}) => {
  return (
    parseFloat(impacts.materialCostImpact || 0) +
    parseFloat(impacts.laborCostImpact || 0) +
    parseFloat(impacts.equipmentCostImpact || 0) +
    parseFloat(impacts.overheadCostImpact || 0)
  );
};

// Alias for backward compatibility
export const calculateCostImpact = calculateTotalCostImpact;
export const calculateScheduleImpact = calculateTimeImpact;

/**
 * Get change order status color
 */
export const getChangeOrderStatusColor = (status) => {
  const colors = {
    [CHANGE_ORDER_STATUS.DRAFT]: 'secondary',
    [CHANGE_ORDER_STATUS.SUBMITTED]: 'info',
    [CHANGE_ORDER_STATUS.UNDER_REVIEW]: 'warning',
    [CHANGE_ORDER_STATUS.APPROVED]: 'success',
    [CHANGE_ORDER_STATUS.REJECTED]: 'danger',
    [CHANGE_ORDER_STATUS.IMPLEMENTED]: 'primary'
  };
  return colors[status] || 'secondary';
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority) => {
  const colors = {
    [PRIORITY_LEVELS.LOW]: 'success',
    [PRIORITY_LEVELS.MEDIUM]: 'info',
    [PRIORITY_LEVELS.HIGH]: 'warning',
    [PRIORITY_LEVELS.URGENT]: 'danger'
  };
  return colors[priority] || 'secondary';
};

/**
 * Get impact severity color
 */
export const getImpactSeverityColor = (severity) => {
  const colors = {
    [IMPACT_SEVERITY.LOW]: 'success',
    [IMPACT_SEVERITY.MEDIUM]: 'info',
    [IMPACT_SEVERITY.HIGH]: 'warning',
    [IMPACT_SEVERITY.CRITICAL]: 'danger'
  };
  return colors[severity] || 'secondary';
};

/**
 * Determine overall impact severity
 */
export const determineOverallImpactSeverity = (changeOrderAmount, originalContractAmount, timeImpactDays) => {
  const amount = parseFloat(changeOrderAmount || 0);
  const original = parseFloat(originalContractAmount || 0);
  const days = parseInt(timeImpactDays || 0);

  const percentageImpact = original > 0 ? (Math.abs(amount) / original) * 100 : 0;

  if (percentageImpact > 20 || Math.abs(days) > 30) {
    return IMPACT_SEVERITY.CRITICAL;
  } else if (percentageImpact > 10 || Math.abs(days) > 14) {
    return IMPACT_SEVERITY.HIGH;
  } else if (percentageImpact > 5 || Math.abs(days) > 7) {
    return IMPACT_SEVERITY.MEDIUM;
  } else {
    return IMPACT_SEVERITY.LOW;
  }
};

/**
 * Validate change order
 */
export const validateChangeOrder = (changeOrder) => {
  const errors = [];

  if (!changeOrder.title || changeOrder.title.trim() === '') {
    errors.push('Title is required');
  }
  if (!changeOrder.description || changeOrder.description.trim() === '') {
    errors.push('Description is required');
  }
  if (!changeOrder.reason) {
    errors.push('Change reason is required');
  }
  if (!changeOrder.category) {
    errors.push('Change category is required');
  }
  if (!changeOrder.requestDate) {
    errors.push('Request date is required');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate change order line item
 */
export const validateLineItem = (lineItem) => {
  const errors = [];

  if (!lineItem.itemType) errors.push('Item type is required');
  if (!lineItem.description || lineItem.description.trim() === '') {
    errors.push('Description is required');
  }
  if (!lineItem.quantity || lineItem.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  if (!lineItem.unitRate || lineItem.unitRate <= 0) {
    errors.push('Unit rate must be greater than 0');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Calculate change order summary
 */
export const calculateChangeOrderSummary = (changeOrders = []) => {
  const summary = {
    totalChangeOrders: changeOrders.length,
    totalValueAdded: 0,
    totalValueReduced: 0,
    netChange: 0,
    averageApprovalTime: 0,
    byStatus: {},
    byCategory: {},
    byPriority: {}
  };

  let totalApprovalTime = 0;
  let approvedCount = 0;

  changeOrders.forEach(co => {
    const amount = parseFloat(co.changeOrderAmount || 0);

    if (amount > 0) {
      summary.totalValueAdded += amount;
    } else if (amount < 0) {
      summary.totalValueReduced += Math.abs(amount);
    }
    summary.netChange += amount;

    // By status
    const status = co.status || 'UNKNOWN';
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

    // By category
    const category = co.category || 'UNKNOWN';
    summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;

    // By priority
    const priority = co.priority || 'UNKNOWN';
    summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;

    // Approval time
    if (co.status === CHANGE_ORDER_STATUS.APPROVED && co.requestDate && co.approvedDate) {
      const request = new Date(co.requestDate);
      const approved = new Date(co.approvedDate);
      const days = Math.ceil((approved - request) / (1000 * 60 * 60 * 24));
      totalApprovalTime += days;
      approvedCount++;
    }
  });

  if (approvedCount > 0) {
    summary.averageApprovalTime = totalApprovalTime / approvedCount;
  }

  return summary;
};

/**
 * Calculate cumulative budget impact
 */
export const calculateCumulativeBudgetImpact = (changeOrders = [], originalBudget = 0) => {
  const approvedCOs = changeOrders.filter(co =>
    co.status === CHANGE_ORDER_STATUS.APPROVED ||
    co.status === CHANGE_ORDER_STATUS.IMPLEMENTED
  );

  const totalImpact = approvedCOs.reduce((sum, co) => {
    return sum + parseFloat(co.changeOrderAmount || 0);
  }, 0);

  const revisedBudget = parseFloat(originalBudget || 0) + totalImpact;
  const impactPercentage = originalBudget > 0 ? (totalImpact / originalBudget) * 100 : 0;

  return {
    originalBudget,
    totalImpact,
    revisedBudget,
    impactPercentage,
    approvedCount: approvedCOs.length
  };
};

/**
 * Calculate cumulative schedule impact
 */
export const calculateCumulativeScheduleImpact = (changeOrders = [], originalEndDate) => {
  const approvedCOs = changeOrders.filter(co =>
    co.status === CHANGE_ORDER_STATUS.APPROVED ||
    co.status === CHANGE_ORDER_STATUS.IMPLEMENTED
  );

  const totalDaysImpact = approvedCOs.reduce((sum, co) => {
    return sum + parseInt(co.timeImpact || 0);
  }, 0);

  const original = new Date(originalEndDate);
  const revised = new Date(original);
  revised.setDate(revised.getDate() + totalDaysImpact);

  return {
    originalEndDate: original,
    revisedEndDate: revised,
    totalDaysImpact,
    approvedCount: approvedCOs.length
  };
};

/**
 * Check if approval is required
 */
export const isApprovalRequired = (changeOrderAmount, threshold = 10000) => {
  return Math.abs(parseFloat(changeOrderAmount || 0)) >= parseFloat(threshold);
};

/**
 * Get required approvers based on amount
 */
export const getRequiredApprovers = (changeOrderAmount) => {
  const amount = Math.abs(parseFloat(changeOrderAmount || 0));

  if (amount >= 100000) {
    return ['Project Manager', 'Director', 'CFO'];
  } else if (amount >= 50000) {
    return ['Project Manager', 'Director'];
  } else if (amount >= 10000) {
    return ['Project Manager'];
  } else {
    return ['Supervisor'];
  }
};

/**
 * Calculate impact on project margin
 */
export const calculateMarginImpact = (changeOrderAmount, originalRevenue, originalCost) => {
  const revenue = parseFloat(originalRevenue || 0);
  const cost = parseFloat(originalCost || 0);
  const coAmount = parseFloat(changeOrderAmount || 0);

  const originalMargin = revenue - cost;
  const originalMarginPercentage = revenue > 0 ? (originalMargin / revenue) * 100 : 0;

  // Assume 70% of change order is revenue, 30% is cost (typical markup)
  const revenueImpact = coAmount;
  const costImpact = coAmount * 0.7;

  const newRevenue = revenue + revenueImpact;
  const newCost = cost + costImpact;
  const newMargin = newRevenue - newCost;
  const newMarginPercentage = newRevenue > 0 ? (newMargin / newRevenue) * 100 : 0;

  return {
    originalMargin,
    originalMarginPercentage,
    newMargin,
    newMarginPercentage,
    marginChange: newMargin - originalMargin,
    marginChangePercentage: newMarginPercentage - originalMarginPercentage
  };
};

/**
 * Generate change order history entry
 */
export const createHistoryEntry = (changeOrderId, action, userId, previousStatus, newStatus, comments = '') => {
  return {
    changeOrderId,
    action,
    actionBy: userId,
    actionDate: new Date().toISOString(),
    previousStatus,
    newStatus,
    comments
  };
};

/**
 * Format currency in Indian Rupee format
 */
export const formatCurrency = (amount) => {
  const value = parseFloat(amount || 0);
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format change order for PDF export
 */
export const formatChangeOrderForPDF = (changeOrder, lineItems = [], project = {}, customer = {}) => {
  return {
    ...changeOrder,
    lineItems,
    project,
    customer,
    formattedAmount: formatCurrency(changeOrder.changeOrderAmount),
    formattedDate: new Date(changeOrder.requestDate).toLocaleDateString('en-IN'),
    statusLabel: CHANGE_ORDER_STATUS[changeOrder.status] || changeOrder.status
  };
};

export default {
  CHANGE_ORDER_STATUS,
  PRIORITY_LEVELS,
  CHANGE_REASONS,
  CHANGE_CATEGORIES,
  ITEM_TYPES,
  IMPACT_TYPES,
  IMPACT_SEVERITY,
  generateChangeOrderNumber,
  calculateChangeOrderAmount,
  calculateRevisedContractAmount,
  calculateTimeImpact,
  calculateTotalCostImpact,
  calculateCostImpact,
  calculateScheduleImpact,
  getChangeOrderStatusColor,
  getPriorityColor,
  getImpactSeverityColor,
  determineOverallImpactSeverity,
  validateChangeOrder,
  validateLineItem,
  calculateChangeOrderSummary,
  calculateCumulativeBudgetImpact,
  calculateCumulativeScheduleImpact,
  isApprovalRequired,
  getRequiredApprovers,
  calculateMarginImpact,
  createHistoryEntry,
  formatCurrency,
  formatChangeOrderForPDF
};
