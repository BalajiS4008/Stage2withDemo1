/**
 * Supplier Balance Calculation Utilities
 *
 * This file contains helper functions for calculating supplier balances
 * based on purchase/payment transactions.
 *
 * TERMINOLOGY:
 * - 'purchase': Material purchased on credit (increases what we owe to supplier)
 * - 'payment': Payment made to supplier (decreases what we owe)
 *
 * BALANCE LOGIC:
 * - Positive balance = We OWE the supplier (PAYABLE)
 * - Negative balance = Supplier owes us / Overpaid (OVERPAID)
 * - Zero balance = Settled
 */

/**
 * Calculate balance for a specific supplier and project
 * @param {Array} transactions - Array of supplier transactions
 * @param {string} supplierId - Supplier ID
 * @param {string} projectId - Project ID (optional, if null calculates total balance)
 * @returns {Object} - { totalPurchases, totalPayments, outstandingBalance, balanceType, rawBalance }
 */
export const calculateSupplierBalance = (transactions, supplierId, projectId = null) => {
  // Filter transactions for this supplier
  let filteredTransactions = transactions.filter(t => t.supplierId === supplierId);

  // If projectId is provided, filter by project
  if (projectId) {
    filteredTransactions = filteredTransactions.filter(t => t.projectId === projectId);
  }

  // Calculate totals
  // PURCHASES increase what we OWE (positive balance)
  // Support both new 'purchase' and old 'credit' types for backward compatibility
  const totalPurchases = filteredTransactions
    .filter(t => t.type === 'purchase' || t.type === 'credit')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  // PAYMENTS decrease what we OWE (reduces balance)
  // Support both new 'payment' and old 'debit' types for backward compatibility
  const totalPayments = filteredTransactions
    .filter(t => t.type === 'payment' || t.type === 'debit')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  // Outstanding balance = Purchases - Payments
  const rawBalance = totalPurchases - totalPayments;
  const balanceType = rawBalance > 0 ? 'payable' : rawBalance < 0 ? 'overpaid' : 'settled';

  return {
    totalPurchases,
    totalPayments,
    outstandingBalance: Math.abs(rawBalance),
    balanceType,
    rawBalance // Positive = We Owe, Negative = Overpaid, Zero = Settled
  };
};

/**
 * Get project-wise breakdown for a supplier
 * @param {Array} transactions - Array of supplier transactions
 * @param {string} supplierId - Supplier ID
 * @param {Array} projects - Array of all projects
 * @returns {Array} - Array of project balances
 */
export const getProjectWiseBreakdown = (transactions, supplierId, projects) => {
  // Get unique project IDs for this supplier
  const projectIds = [...new Set(
    transactions
      .filter(t => t.supplierId === supplierId)
      .map(t => t.projectId)
  )];
  
  // Calculate balance for each project
  return projectIds.map(projectId => {
    const project = projects.find(p => p.id === projectId);
    const balance = calculateSupplierBalance(transactions, supplierId, projectId);
    
    return {
      projectId,
      projectName: project?.name || 'Unknown Project',
      projectStatus: project?.status || 'unknown',
      ...balance
    };
  }).filter(p => p.rawBalance !== 0); // Only show projects with non-zero balance
};

/**
 * Get overall supplier balance (across all projects)
 * @param {Array} transactions - Array of supplier transactions
 * @param {string} supplierId - Supplier ID
 * @returns {Object} - Overall balance summary
 */
export const getOverallSupplierBalance = (transactions, supplierId) => {
  return calculateSupplierBalance(transactions, supplierId, null);
};

/**
 * Validate payment amount against current balance
 * @param {Array} transactions - Array of supplier transactions
 * @param {string} supplierId - Supplier ID
 * @param {string} projectId - Project ID
 * @param {number} paymentAmount - Payment amount to validate
 * @returns {Object} - { isValid, currentBalance, message }
 */
export const validatePaymentAmount = (transactions, supplierId, projectId, paymentAmount) => {
  const { rawBalance } = calculateSupplierBalance(transactions, supplierId, projectId);
  
  if (rawBalance <= 0) {
    return {
      isValid: false,
      currentBalance: 0,
      message: 'No outstanding balance for this project'
    };
  }
  
  if (paymentAmount <= 0) {
    return {
      isValid: false,
      currentBalance: rawBalance,
      message: 'Payment amount must be greater than zero'
    };
  }
  
  if (paymentAmount > rawBalance) {
    return {
      isValid: false,
      currentBalance: rawBalance,
      message: `Payment amount cannot exceed current balance of ₹${rawBalance.toFixed(2)}`
    };
  }
  
  return {
    isValid: true,
    currentBalance: rawBalance,
    message: 'Valid payment amount'
  };
};

/**
 * Get projects with outstanding balance for a supplier
 * @param {Array} transactions - Array of supplier transactions
 * @param {string} supplierId - Supplier ID
 * @param {Array} projects - Array of all projects
 * @returns {Array} - Projects with outstanding balance
 */
export const getProjectsWithBalance = (transactions, supplierId, projects) => {
  const breakdown = getProjectWiseBreakdown(transactions, supplierId, projects);
  return breakdown.filter(p => p.rawBalance > 0); // Only projects where supplier needs to be paid
};

/**
 * Calculate running balance for transaction history
 * Sorts transactions by date (oldest first) and calculates running balance
 * @param {Array} transactions - Array of supplier transactions (already filtered)
 * @returns {Array} - Transactions with running balance
 */
export const calculateRunningBalance = (transactions) => {
  // Sort by date (oldest first) for running balance calculation
  const sortedTransactions = [...transactions].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  let runningBalance = 0;

  const transactionsWithBalance = sortedTransactions.map(transaction => {
    // PURCHASE increases balance (We Owe More)
    // PAYMENT decreases balance (We Owe Less)
    // Support both new and old transaction types for backward compatibility
    if (transaction.type === 'purchase' || transaction.type === 'credit') {
      runningBalance += parseFloat(transaction.amount) || 0;
    } else if (transaction.type === 'payment' || transaction.type === 'debit') {
      runningBalance -= parseFloat(transaction.amount) || 0;
    }

    return {
      ...transaction,
      runningBalance: runningBalance
    };
  });

  // Return in reverse order (newest first) for display
  return transactionsWithBalance.reverse();
};
