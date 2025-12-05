/**
 * Retention Management Utilities
 * Functions for retention calculations, release schedules, and compliance
 */

// Retention types
export const RETENTION_TYPES = {
  RECEIVABLE: 'RECEIVABLE', // From customer
  PAYABLE: 'PAYABLE'        // To supplier
};

// Retention status
export const RETENTION_STATUS = {
  HELD: 'HELD',
  PARTIALLY_RELEASED: 'PARTIALLY_RELEASED',
  FULLY_RELEASED: 'FULLY_RELEASED',
  FORFEITED: 'FORFEITED'
};

// Release types
export const RELEASE_TYPES = {
  ON_COMPLETION: 'ON_COMPLETION',
  TIME_BASED: 'TIME_BASED',
  MILESTONE_BASED: 'MILESTONE_BASED',
  WARRANTY_END: 'WARRANTY_END'
};

// Policy types
export const POLICY_TYPES = {
  FIXED_PERCENTAGE: 'FIXED_PERCENTAGE',
  TIERED: 'TIERED',
  CUSTOM: 'CUSTOM'
};

// Alert types
export const RETENTION_ALERT_TYPES = {
  RELEASE_DUE: 'RELEASE_DUE',
  OVERDUE: 'OVERDUE',
  WARRANTY_EXPIRING: 'WARRANTY_EXPIRING'
};

/**
 * Calculate retention amount
 */
export const calculateRetentionAmount = (totalAmount, retentionPercentage) => {
  return (parseFloat(totalAmount || 0) * parseFloat(retentionPercentage || 0)) / 100;
};

/**
 * Calculate amount after retention
 */
export const calculateAmountAfterRetention = (totalAmount, retentionPercentage) => {
  const retention = calculateRetentionAmount(totalAmount, retentionPercentage);
  return parseFloat(totalAmount || 0) - retention;
};

/**
 * Calculate balance amount
 */
export const calculateBalanceAmount = (retentionAmount, releasedAmount) => {
  return parseFloat(retentionAmount || 0) - parseFloat(releasedAmount || 0);
};

/**
 * Calculate release percentage
 */
export const calculateReleasePercentage = (releasedAmount, totalRetention) => {
  const total = parseFloat(totalRetention || 0);
  if (total === 0) return 0;

  return (parseFloat(releasedAmount || 0) / total) * 100;
};

/**
 * Calculate scheduled release date
 */
export const calculateScheduledReleaseDate = (baseDate, releaseType, daysAfter = 0, monthsAfter = 0) => {
  const date = new Date(baseDate);

  switch (releaseType) {
    case RELEASE_TYPES.ON_COMPLETION:
      // Release immediately on completion
      return date;

    case RELEASE_TYPES.TIME_BASED:
      // Add days or months
      date.setDate(date.getDate() + parseInt(daysAfter || 0));
      date.setMonth(date.getMonth() + parseInt(monthsAfter || 0));
      return date;

    case RELEASE_TYPES.WARRANTY_END:
      // Add warranty period (typically 12-24 months)
      date.setMonth(date.getMonth() + parseInt(monthsAfter || 12));
      return date;

    default:
      return date;
  }
};

/**
 * Check if release is due
 */
export const isReleaseDue = (scheduledDate, gracePeriodDays = 0) => {
  const scheduled = new Date(scheduledDate);
  const today = new Date();
  const grace = new Date(scheduled);
  grace.setDate(grace.getDate() + parseInt(gracePeriodDays || 0));

  return today >= scheduled && today <= grace;
};

/**
 * Check if release is overdue
 */
export const isReleaseOverdue = (scheduledDate, gracePeriodDays = 0) => {
  const scheduled = new Date(scheduledDate);
  const today = new Date();
  const grace = new Date(scheduled);
  grace.setDate(grace.getDate() + parseInt(gracePeriodDays || 0));

  return today > grace;
};

/**
 * Get days until release
 */
export const getDaysUntilRelease = (scheduledDate) => {
  const scheduled = new Date(scheduledDate);
  const today = new Date();
  const diffTime = scheduled - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Get retention status color
 */
export const getRetentionStatusColor = (status) => {
  const colors = {
    [RETENTION_STATUS.HELD]: 'warning',
    [RETENTION_STATUS.PARTIALLY_RELEASED]: 'info',
    [RETENTION_STATUS.FULLY_RELEASED]: 'success',
    [RETENTION_STATUS.FORFEITED]: 'danger'
  };
  return colors[status] || 'secondary';
};

/**
 * Calculate total released amount from releases
 */
export const calculateReleasedAmount = (releases = []) => {
  return releases.reduce((total, release) => {
    return total + parseFloat(release.releaseAmount || 0);
  }, 0);
};

/**
 * Format currency in Indian Rupee format
 */
export const formatCurrency = (amount) => {
  const value = parseFloat(amount || 0);
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Determine retention status
 */
export const determineRetentionStatus = (retentionAmount, releasedAmount, balanceAmount) => {
  const retention = parseFloat(retentionAmount || 0);
  const released = parseFloat(releasedAmount || 0);
  const balance = parseFloat(balanceAmount || 0);

  if (balance <= 0 && released > 0) return RETENTION_STATUS.FULLY_RELEASED;
  if (released > 0 && balance > 0) return RETENTION_STATUS.PARTIALLY_RELEASED;
  if (released === 0 && retention > 0) return RETENTION_STATUS.HELD;

  return RETENTION_STATUS.HELD;
};

/**
 * Validate retention policy
 */
export const validateRetentionPolicy = (policy) => {
  const errors = [];

  if (!policy.policyName || policy.policyName.trim() === '') {
    errors.push('Policy name is required');
  }
  if (!policy.retentionPercentage || policy.retentionPercentage <= 0) {
    errors.push('Retention percentage must be greater than 0');
  }
  if (policy.retentionPercentage > 20) {
    errors.push('Retention percentage should not exceed 20%');
  }
  if (!policy.releaseType) {
    errors.push('Release type is required');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate retention release
 */
export const validateRetentionRelease = (release, retentionAccount) => {
  const errors = [];

  if (!release.releaseAmount || release.releaseAmount <= 0) {
    errors.push('Release amount must be greater than 0');
  }

  const balance = parseFloat(retentionAccount.balanceAmount || 0);
  const releaseAmount = parseFloat(release.releaseAmount || 0);

  if (releaseAmount > balance) {
    errors.push(`Release amount cannot exceed balance (${balance.toFixed(2)})`);
  }

  if (!release.releaseDate) {
    errors.push('Release date is required');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Calculate tiered retention
 * Example: 10% up to 1M, 5% from 1M to 5M, 3% above 5M
 */
export const calculateTieredRetention = (totalAmount, tiers = []) => {
  let remainingAmount = parseFloat(totalAmount || 0);
  let totalRetention = 0;

  // Sort tiers by threshold ascending
  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);

  sortedTiers.forEach((tier, index) => {
    const threshold = parseFloat(tier.threshold || 0);
    const percentage = parseFloat(tier.percentage || 0);

    let applicableAmount;
    if (index === sortedTiers.length - 1) {
      // Last tier applies to all remaining
      applicableAmount = remainingAmount;
    } else {
      const nextThreshold = parseFloat(sortedTiers[index + 1].threshold || 0);
      applicableAmount = Math.min(remainingAmount, nextThreshold - threshold);
    }

    const retentionForTier = (applicableAmount * percentage) / 100;
    totalRetention += retentionForTier;
    remainingAmount -= applicableAmount;
  });

  return totalRetention;
};

/**
 * Generate release schedule
 */
export const generateReleaseSchedule = (retentionAccount, policy) => {
  const schedule = [];

  if (!policy.releaseSchedule || policy.releaseSchedule.length === 0) {
    // Single release
    return [{
      percentage: 100,
      amount: retentionAccount.retentionAmount,
      releaseDate: calculateScheduledReleaseDate(
        retentionAccount.retentionDate,
        policy.releaseType,
        policy.defectLiabilityPeriod || 0
      )
    }];
  }

  // Multiple releases based on schedule
  policy.releaseSchedule.forEach((item, index) => {
    const percentage = parseFloat(item.percentage || 0);
    const amount = (parseFloat(retentionAccount.retentionAmount || 0) * percentage) / 100;
    const baseDate = index === 0 ? retentionAccount.retentionDate : schedule[index - 1].releaseDate;

    schedule.push({
      percentage,
      amount,
      releaseDate: calculateScheduledReleaseDate(
        baseDate,
        item.eventType || policy.releaseType,
        item.daysAfter || 0
      )
    });
  });

  return schedule;
};

/**
 * Calculate retention summary
 */
export const calculateRetentionSummary = (retentionAccounts = []) => {
  const summary = {
    totalRetentionHeld: 0,
    totalRetentionReleased: 0,
    totalRetentionBalance: 0,
    receivables: {
      held: 0,
      released: 0,
      balance: 0
    },
    payables: {
      held: 0,
      released: 0,
      balance: 0
    },
    byStatus: {
      [RETENTION_STATUS.HELD]: 0,
      [RETENTION_STATUS.PARTIALLY_RELEASED]: 0,
      [RETENTION_STATUS.FULLY_RELEASED]: 0,
      [RETENTION_STATUS.FORFEITED]: 0
    }
  };

  retentionAccounts.forEach(account => {
    const retention = parseFloat(account.retentionAmount || 0);
    const released = parseFloat(account.releasedAmount || 0);
    const balance = parseFloat(account.balanceAmount || 0);

    summary.totalRetentionHeld += retention;
    summary.totalRetentionReleased += released;
    summary.totalRetentionBalance += balance;

    if (account.retentionType === RETENTION_TYPES.RECEIVABLE) {
      summary.receivables.held += retention;
      summary.receivables.released += released;
      summary.receivables.balance += balance;
    } else if (account.retentionType === RETENTION_TYPES.PAYABLE) {
      summary.payables.held += retention;
      summary.payables.released += released;
      summary.payables.balance += balance;
    }

    if (account.status && summary.byStatus[account.status] !== undefined) {
      summary.byStatus[account.status] += balance;
    }
  });

  return summary;
};

/**
 * Get retention aging report
 */
export const getRetentionAging = (retentionAccounts = []) => {
  const today = new Date();
  const aging = {
    current: 0,      // 0-30 days
    thirtyDays: 0,   // 31-60 days
    sixtyDays: 0,    // 61-90 days
    ninetyDays: 0,   // 91+ days
    overdue: 0
  };

  retentionAccounts.forEach(account => {
    const retentionDate = new Date(account.retentionDate);
    const scheduledDate = new Date(account.scheduledReleaseDate);
    const daysSince = Math.floor((today - retentionDate) / (1000 * 60 * 60 * 24));
    const balance = parseFloat(account.balanceAmount || 0);

    if (balance <= 0) return; // Skip fully released

    if (today > scheduledDate) {
      aging.overdue += balance;
    } else if (daysSince <= 30) {
      aging.current += balance;
    } else if (daysSince <= 60) {
      aging.thirtyDays += balance;
    } else if (daysSince <= 90) {
      aging.sixtyDays += balance;
    } else {
      aging.ninetyDays += balance;
    }
  });

  return aging;
};

/**
 * Format retention release number
 * Format: REL-YYYYMM-XXX
 */
export const generateReleaseNumber = (existingReleases = []) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `REL-${year}${month}-`;

  const existingNumbers = existingReleases
    .map(r => r.releaseNumber)
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

export default {
  RETENTION_TYPES,
  RETENTION_STATUS,
  RELEASE_TYPES,
  POLICY_TYPES,
  RETENTION_ALERT_TYPES,
  calculateRetentionAmount,
  calculateAmountAfterRetention,
  calculateBalanceAmount,
  calculateReleasePercentage,
  calculateReleasedAmount,
  calculateScheduledReleaseDate,
  isReleaseDue,
  isReleaseOverdue,
  getDaysUntilRelease,
  getRetentionStatusColor,
  formatCurrency,
  determineRetentionStatus,
  validateRetentionPolicy,
  validateRetentionRelease,
  calculateTieredRetention,
  generateReleaseSchedule,
  calculateRetentionSummary,
  getRetentionAging,
  generateReleaseNumber
};
