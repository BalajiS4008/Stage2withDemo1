/**
 * Material/Inventory Management Utilities
 * Functions for material calculations, stock management, and validations
 */

// Material categories
export const MATERIAL_CATEGORIES = [
  'Cement',
  'Steel',
  'Sand',
  'Aggregate',
  'Bricks',
  'Concrete Blocks',
  'Paint',
  'Wood/Timber',
  'Electrical',
  'Plumbing',
  'Hardware',
  'Tiles',
  'Glass',
  'Aluminum',
  'Other'
];

// Units of measurement
export const MATERIAL_UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'ton', label: 'Ton' },
  { value: 'bag', label: 'Bag' },
  { value: 'm3', label: 'Cubic Meter (m³)' },
  { value: 'm2', label: 'Square Meter (m²)' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'ft', label: 'Feet' },
  { value: 'ltr', label: 'Liter' },
  { value: 'box', label: 'Box' },
  { value: 'roll', label: 'Roll' }
];

// Transaction types
export const TRANSACTION_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN: 'RETURN'
};

// PO status
export const PO_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  SENT: 'SENT',
  APPROVED: 'APPROVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
};

/**
 * Generate material code
 * Format: MAT-YYYYMM-XXX
 */
export const generateMaterialCode = (existingMaterials = []) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `MAT-${year}${month}-`;

  // Find the highest number for this month
  const existingCodes = existingMaterials
    .map(m => m.materialCode)
    .filter(code => code && code.startsWith(prefix));

  let maxNum = 0;
  existingCodes.forEach(code => {
    const num = parseInt(code.split('-')[2]);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}${nextNum}`;
};

/**
 * Generate purchase order number
 * Format: PO-YYYYMM-XXX
 */
export const generatePONumber = (existingPOs = []) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `PO-${year}${month}-`;

  const existingNumbers = existingPOs
    .map(po => po.poNumber)
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
 * Generate transaction number
 * Format: TXN-YYYYMM-XXX
 */
export const generateTransactionNumber = (existingTransactions = []) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `TXN-${year}${month}-`;

  const existingNumbers = existingTransactions
    .map(txn => txn.transactionNumber)
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
 * Calculate transaction amount
 * Amount = Quantity × Rate
 */
export const calculateTransactionAmount = (quantity, rate) => {
  const qty = parseFloat(quantity) || 0;
  const r = parseFloat(rate) || 0;
  return parseFloat((qty * r).toFixed(2));
};

/**
 * Calculate running balance after a transaction
 */
export const calculateRunningBalance = (currentStock, transactionType, quantity) => {
  const qty = parseFloat(quantity) || 0;
  const stock = parseFloat(currentStock) || 0;

  switch (transactionType) {
    case TRANSACTION_TYPES.IN:
      return stock + qty;
    case TRANSACTION_TYPES.OUT:
      return stock - qty;
    case TRANSACTION_TYPES.ADJUSTMENT:
      return qty; // Direct set
    case TRANSACTION_TYPES.RETURN:
      return stock + qty;
    default:
      return stock;
  }
};

/**
 * Check if material is below reorder level
 */
export const isBelowReorderLevel = (currentStock, reorderLevel) => {
  return parseFloat(currentStock) <= parseFloat(reorderLevel);
};

/**
 * Calculate stock value
 */
export const calculateStockValue = (currentStock, unitPrice) => {
  return parseFloat(currentStock || 0) * parseFloat(unitPrice || 0);
};

/**
 * Validate stock transaction
 */
export const validateStockTransaction = (transaction, currentStock) => {
  const errors = [];

  // Check required fields
  if (!transaction.materialId) errors.push('Material is required');
  if (!transaction.transactionType) errors.push('Transaction type is required');
  if (!transaction.quantity || transaction.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  if (!transaction.transactionDate) errors.push('Transaction date is required');

  // Check sufficient stock for OUT transactions
  if (transaction.transactionType === TRANSACTION_TYPES.OUT) {
    if (transaction.quantity > currentStock) {
      errors.push('Insufficient stock available');
    }
  }

  // Check rate for IN transactions
  if (transaction.transactionType === TRANSACTION_TYPES.IN) {
    if (!transaction.rate || transaction.rate <= 0) {
      errors.push('Rate is required for stock IN transactions');
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Calculate PO totals
 */
export const calculatePOTotals = (items = [], taxPercentage = 0) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0));
  }, 0);

  const taxAmount = (subtotal * parseFloat(taxPercentage || 0)) / 100;
  const totalAmount = subtotal + taxAmount;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};

/**
 * Get material status color
 */
export const getMaterialStatusColor = (currentStock, reorderLevel) => {
  if (currentStock === 0) return 'danger';
  if (isBelowReorderLevel(currentStock, reorderLevel)) return 'warning';
  return 'success';
};

/**
 * Get PO status badge color
 */
export const getPOStatusColor = (status) => {
  const colors = {
    [PO_STATUS.DRAFT]: 'secondary',
    [PO_STATUS.PENDING]: 'warning',
    [PO_STATUS.SENT]: 'info',
    [PO_STATUS.APPROVED]: 'primary',
    [PO_STATUS.RECEIVED]: 'success',
    [PO_STATUS.CANCELLED]: 'danger'
  };
  return colors[status] || 'secondary';
};

/**
 * Get PO status icon component
 * Note: Returns string identifier for icon, actual icon component imported in page
 */
export const getPOStatusIcon = (status) => {
  // Return icon identifier to be used with lucide-react imports
  const icons = {
    [PO_STATUS.DRAFT]: 'FileText',
    [PO_STATUS.SENT]: 'Clock',
    [PO_STATUS.APPROVED]: 'CheckCircle',
    [PO_STATUS.RECEIVED]: 'Package',
    [PO_STATUS.CANCELLED]: 'XCircle'
  };
  return icons[status] || 'FileText';
};

/**
 * Calculate PO total from items
 */
export const calculatePOTotal = (items = []) => {
  return items.reduce((total, item) => {
    const quantity = parseFloat(item.quantity || 0);
    const rate = parseFloat(item.rate || 0);
    return total + (quantity * rate);
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
 * Format stock quantity with unit
 */
export const formatStockQuantity = (quantity, unit) => {
  const qty = parseFloat(quantity || 0);
  return `${qty.toFixed(2)} ${unit}`;
};

/**
 * Get low stock materials
 */
export const getLowStockMaterials = (materials = []) => {
  return materials.filter(m =>
    m.isActive && isBelowReorderLevel(m.currentStock, m.reorderLevel)
  );
};

/**
 * Calculate total inventory value
 */
export const calculateTotalInventoryValue = (materials = []) => {
  return materials
    .filter(m => m.isActive)
    .reduce((total, m) => total + calculateStockValue(m.currentStock, m.unitPrice), 0);
};

/**
 * Get material usage by project
 */
export const getMaterialUsageByProject = (stockTransactions = [], projectId) => {
  return stockTransactions
    .filter(t => t.projectId === projectId && t.transactionType === TRANSACTION_TYPES.OUT)
    .reduce((total, t) => total + (parseFloat(t.quantity || 0) * parseFloat(t.rate || 0)), 0);
};

/**
 * ABC Analysis - Categorize materials by value
 * A: Top 20% of materials by value (high value)
 * B: Next 30% (medium value)
 * C: Remaining 50% (low value)
 */
export const performABCAnalysis = (materials = []) => {
  const activeMaterials = materials.filter(m => m.isActive);

  // Calculate value for each material
  const materialsWithValue = activeMaterials.map(m => ({
    ...m,
    totalValue: calculateStockValue(m.currentStock, m.unitPrice)
  }));

  // Sort by value descending
  materialsWithValue.sort((a, b) => b.totalValue - a.totalValue);

  const totalValue = materialsWithValue.reduce((sum, m) => sum + m.totalValue, 0);
  let cumulativeValue = 0;

  return materialsWithValue.map(m => {
    cumulativeValue += m.totalValue;
    const cumulativePercentage = (cumulativeValue / totalValue) * 100;

    let category;
    if (cumulativePercentage <= 20) {
      category = 'A';
    } else if (cumulativePercentage <= 50) {
      category = 'B';
    } else {
      category = 'C';
    }

    return { ...m, abcCategory: category };
  });
};

export default {
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  TRANSACTION_TYPES,
  PO_STATUS,
  generateMaterialCode,
  generatePONumber,
  generateTransactionNumber,
  calculateTransactionAmount,
  calculateRunningBalance,
  isBelowReorderLevel,
  calculateStockValue,
  validateStockTransaction,
  calculatePOTotals,
  getMaterialStatusColor,
  getPOStatusColor,
  getPOStatusIcon,
  calculatePOTotal,
  formatCurrency,
  formatStockQuantity,
  getLowStockMaterials,
  calculateTotalInventoryValue,
  getMaterialUsageByProject,
  performABCAnalysis
};
