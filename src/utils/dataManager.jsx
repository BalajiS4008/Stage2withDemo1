import pako from 'pako';
import { encryptData, decryptData, isEncrypted } from './encryption';
import { downloadBlob } from './downloadHelper';
import db, {
  getUsers,
  getProjects,
  getInvoices,
  getQuotations,
  getSettings,
  getDepartments,
  getPaymentsIn,
  getPaymentsOut,
  getParties,
  getSupplierTransactions,
  saveSettings as saveDexieSettings,
  clearAllData as clearDexieData,
  // Material/Inventory Management
  getMaterials,
  getStockTransactions,
  getPurchaseOrders,
  getMaterialAllocations,
  // Labor/Time Tracking & Payroll
  getWorkers,
  getAttendance,
  getTimeSheets,
  getPayroll,
  getLeaves,
  getWorkerAdvances,
  // Budget Planning & Forecasting
  getProjectBudgets,
  getBudgetLineItems,
  getBudgetAlerts,
  getBudgetRevisions,
  getCostForecasts,
  // Retention Management
  getRetentionPolicies,
  getRetentionAccounts,
  getRetentionReleases,
  getRetentionAlerts,
  // Change Orders
  getChangeOrders,
  getChangeOrderLineItems,
  getChangeOrderHistory,
  getChangeOrderImpacts,
  // Document Management
  getDocuments,
  getDocumentVersions,
  getDocumentSharings,
  getDocumentActivities
} from '../db/dexieDB';

const STORAGE_KEY = 'bycodez_data';
const BACKUP_FILE_EXTENSION = '.ttf';
const ENCRYPTED_BACKUP_EXTENSION = '.ttfe'; // TTF Encrypted
const CURRENT_PROJECT_KEY = 'bycodez_current_project';

// Default data structure (kept for backward compatibility)
export const getDefaultData = () => ({
  users: [],
  projects: [],
  currentProjectId: null,
  invoices: [],
  quotations: [],
  parties: [],
  supplierTransactions: [],
  settings: {
    currency: '₹',
    dateFormat: 'DD/MM/YYYY',
    autoBackup: false,
    backupFrequency: 'weekly',
    invoiceSettings: {
      prefix: 'INV',
      nextNumber: 1,
      showGSTColumn: true,
      defaultGSTPercentage: 18,
      showQuantityColumn: true
    },
    quotationSettings: {
      prefix: 'QUO',
      nextNumber: 1
    },
    measurementUnits: ['sq.ft', 'kg', 'piece', 'meter', 'ft']
  },
  metadata: {
    version: '2.0.0',
    lastModified: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
});

// Default project structure
export const getDefaultProject = (name, totalCommittedAmount = 0) => ({
  id: generateId(),
  name: name,
  totalCommittedAmount: parseFloat(totalCommittedAmount) || 0,
  description: '',
  startDate: new Date().toISOString(),
  status: 'active', // active, completed, on-hold
  departments: [
    { id: generateId(), name: 'Mason', isDefault: true },
    { id: generateId(), name: 'Plumbing', isDefault: true },
    { id: generateId(), name: 'Electrical', isDefault: true },
    { id: generateId(), name: 'Interior', isDefault: true },
    { id: generateId(), name: 'Painting', isDefault: true },
    { id: generateId(), name: 'Miscellaneous', isDefault: true }
  ],
  milestones: [], // Array of project milestones/stages
  paymentsIn: [],
  paymentsOut: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Helper function to create a milestone
export const createMilestone = (name, amountType, value, order) => ({
  id: generateId(),
  name: name,
  amountType: amountType, // 'fixed' or 'percentage'
  value: parseFloat(value) || 0, // Either fixed amount or percentage value
  order: order || 0,
  status: 'pending', // pending, completed, paid
  completedDate: null,
  createdAt: new Date().toISOString()
});

// Calculate milestone amount based on type
export const calculateMilestoneAmount = (milestone, totalProjectValue) => {
  if (milestone.amountType === 'percentage') {
    return (parseFloat(totalProjectValue) * parseFloat(milestone.value)) / 100;
  }
  return parseFloat(milestone.value) || 0;
};

// Load data from Dexie (async version)
// Supports role-based access: admin users see all data, regular users see only their data
export const loadDataFromDexie = async (userId, userRole = 'user') => {
  try {
    if (!userId) {
      console.warn('⚠️ No userId provided to loadDataFromDexie');
      return getDefaultData();
    }

    const isAdmin = userRole === 'admin';
    console.log('📊 Loading data from Dexie for userId:', userId, '| Role:', userRole, '| Admin:', isAdmin);

    const [
      users, projects, invoices, quotations, settings, departments, paymentsIn, paymentsOut, parties, supplierTransactions,
      // Material/Inventory Management
      materials, stockTransactions, purchaseOrders, materialAllocation,
      // Labor/Time Tracking & Payroll
      workers, attendance, timeSheets, payroll, leaveManagement, workerAdvances,
      // Budget Planning & Forecasting
      projectBudgets, budgetLineItems, budgetAlerts, budgetRevisions, costForecasts,
      // Retention Management
      retentionPolicies, retentionAccounts, retentionReleases, retentionAlerts,
      // Change Orders
      changeOrders, changeOrderLineItems, changeOrderHistory, changeOrderImpacts,
      // Document Management
      documents, documentVersions, documentSharings, documentActivities
    ] = await Promise.all([
      getUsers(),
      getProjects(userId, isAdmin),
      getInvoices(userId, isAdmin),
      getQuotations(userId, isAdmin),
      getSettings(userId, isAdmin),
      getDepartments(userId, null, isAdmin),
      getPaymentsIn(userId, isAdmin),
      getPaymentsOut(userId, isAdmin),
      getParties(userId, isAdmin),
      getSupplierTransactions(userId, isAdmin),
      // Material/Inventory Management
      getMaterials(userId, isAdmin),
      getStockTransactions(userId, isAdmin),
      getPurchaseOrders(userId, isAdmin),
      getMaterialAllocations(userId, isAdmin),
      // Labor/Time Tracking & Payroll
      getWorkers(userId, isAdmin),
      getAttendance(userId, isAdmin),
      getTimeSheets(userId, isAdmin),
      getPayroll(userId, isAdmin),
      getLeaves(userId, isAdmin),
      getWorkerAdvances(userId, isAdmin),
      // Budget Planning & Forecasting
      getProjectBudgets(userId, isAdmin),
      getBudgetLineItems(userId, isAdmin),
      getBudgetAlerts(userId, isAdmin),
      getBudgetRevisions(userId, isAdmin),
      getCostForecasts(userId, isAdmin),
      // Retention Management
      getRetentionPolicies(userId, isAdmin),
      getRetentionAccounts(userId, isAdmin),
      getRetentionReleases(userId, isAdmin),
      getRetentionAlerts(userId, isAdmin),
      // Change Orders
      getChangeOrders(userId, isAdmin),
      getChangeOrderLineItems(userId, isAdmin),
      getChangeOrderHistory(userId, isAdmin),
      getChangeOrderImpacts(userId, isAdmin),
      // Document Management
      getDocuments(userId, isAdmin),
      getDocumentVersions(userId, isAdmin),
      getDocumentSharings(userId, isAdmin),
      getDocumentActivities(userId, isAdmin)
    ]);

    console.log('📊 Dexie data loaded:', {
      users: users?.length || 0,
      projects: projects?.length || 0,
      invoices: invoices?.length || 0,
      quotations: quotations?.length || 0,
      departments: departments?.length || 0,
      paymentsIn: paymentsIn?.length || 0,
      paymentsOut: paymentsOut?.length || 0,
      parties: parties?.length || 0,
      supplierTransactions: supplierTransactions?.length || 0,
      // Material/Inventory
      materials: materials?.length || 0,
      stockTransactions: stockTransactions?.length || 0,
      purchaseOrders: purchaseOrders?.length || 0,
      materialAllocation: materialAllocation?.length || 0,
      // Labor/Payroll
      workers: workers?.length || 0,
      attendance: attendance?.length || 0,
      timeSheets: timeSheets?.length || 0,
      payroll: payroll?.length || 0,
      leaveManagement: leaveManagement?.length || 0,
      workerAdvances: workerAdvances?.length || 0,
      // Budget
      projectBudgets: projectBudgets?.length || 0,
      budgetLineItems: budgetLineItems?.length || 0,
      budgetAlerts: budgetAlerts?.length || 0,
      budgetRevisions: budgetRevisions?.length || 0,
      costForecasts: costForecasts?.length || 0,
      // Retention
      retentionPolicies: retentionPolicies?.length || 0,
      retentionAccounts: retentionAccounts?.length || 0,
      retentionReleases: retentionReleases?.length || 0,
      retentionAlerts: retentionAlerts?.length || 0,
      // Change Orders
      changeOrders: changeOrders?.length || 0,
      changeOrderLineItems: changeOrderLineItems?.length || 0,
      changeOrderHistory: changeOrderHistory?.length || 0,
      changeOrderImpacts: changeOrderImpacts?.length || 0,
      // Documents
      documents: documents?.length || 0,
      documentVersions: documentVersions?.length || 0,
      documentSharings: documentSharings?.length || 0,
      documentActivities: documentActivities?.length || 0,
      hasSettings: !!settings,
      isAdmin
    });

    // Merge payments into their respective projects
    const projectsWithPayments = projects.map(project => {
      const projectPaymentsIn = paymentsIn.filter(p => p.projectId === project.id);
      const projectPaymentsOut = paymentsOut.filter(p => p.projectId === project.id);
      const projectDepartments = departments.filter(d => d.projectId === project.id);

      return {
        ...project,
        paymentsIn: projectPaymentsIn,
        paymentsOut: projectPaymentsOut,
        departments: projectDepartments.length > 0 ? projectDepartments : project.departments || []
      };
    });

    // Get current project ID from localStorage (temporary storage)
    const currentProjectId = localStorage.getItem(CURRENT_PROJECT_KEY);

    return {
      users,
      projects: projectsWithPayments,
      currentProjectId,
      invoices,
      quotations,
      parties: parties || [],
      supplierTransactions: supplierTransactions || [],
      // Material/Inventory Management
      materials: materials || [],
      stockTransactions: stockTransactions || [],
      purchaseOrders: purchaseOrders || [],
      materialAllocation: materialAllocation || [],
      // Labor/Time Tracking & Payroll
      workers: workers || [],
      attendance: attendance || [],
      timeSheets: timeSheets || [],
      payroll: payroll || [],
      leaveManagement: leaveManagement || [],
      workerAdvances: workerAdvances || [],
      // Budget Planning & Forecasting
      projectBudgets: projectBudgets || [],
      budgetLineItems: budgetLineItems || [],
      budgetAlerts: budgetAlerts || [],
      budgetRevisions: budgetRevisions || [],
      costForecasts: costForecasts || [],
      // Retention Management
      retentionPolicies: retentionPolicies || [],
      retentionAccounts: retentionAccounts || [],
      retentionReleases: retentionReleases || [],
      retentionAlerts: retentionAlerts || [],
      // Change Orders
      changeOrders: changeOrders || [],
      changeOrderLineItems: changeOrderLineItems || [],
      changeOrderHistory: changeOrderHistory || [],
      changeOrderImpacts: changeOrderImpacts || [],
      // Document Management
      documents: documents || [],
      documentVersions: documentVersions || [],
      documentSharings: documentSharings || [],
      documentActivities: documentActivities || [],
      settings: settings || getDefaultData().settings,
      metadata: {
        version: '2.0.0',
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ Error loading data from Dexie:', error);
    return getDefaultData();
  }
};

// Load data from localStorage (kept for backward compatibility during migration)
export const loadData = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const data = JSON.parse(storedData);
      return { ...getDefaultData(), ...data };
    }
    return getDefaultData();
  } catch (error) {
    console.error('Error loading data:', error);
    return getDefaultData();
  }
};

// Save data to localStorage (kept for backward compatibility)
export const saveData = (data) => {
  try {
    const dataToSave = {
      ...data,
      metadata: {
        ...data.metadata,
        lastModified: new Date().toISOString()
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    // Handle QuotaExceededError gracefully
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage quota exceeded. Skipping localStorage backup. Data is safely stored in IndexedDB.');
      // Clear old localStorage to free up space
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
    } else {
      console.error('Error saving data:', error);
    }
    return false;
  }
};

// Save current project ID
export const saveCurrentProjectId = (projectId) => {
  try {
    if (projectId) {
      localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
    return true;
  } catch (error) {
    console.error('Error saving current project ID:', error);
    return false;
  }
};

// Get current project ID
export const getCurrentProjectId = () => {
  try {
    return localStorage.getItem(CURRENT_PROJECT_KEY);
  } catch (error) {
    console.error('Error getting current project ID:', error);
    return null;
  }
};

// Export all Dexie data for backup
export const exportDexieData = async (userId) => {
  try {
    const [users, projects, invoices, quotations, settings, departments, paymentsIn, paymentsOut] = await Promise.all([
      getUsers(),
      getProjects(userId),
      getInvoices(userId),
      getQuotations(userId),
      getSettings(userId),
      getDepartments(userId),
      getPaymentsIn(userId),
      getPaymentsOut(userId)
    ]);

    return {
      users,
      projects,
      invoices,
      quotations,
      settings,
      departments,
      paymentsIn,
      paymentsOut,
      currentProjectId: getCurrentProjectId(),
      metadata: {
        version: '2.0.0',
        backupDate: new Date().toISOString(),
        source: 'dexie'
      }
    };
  } catch (error) {
    console.error('Error exporting Dexie data:', error);
    throw error;
  }
};

// Create backup file (.ttf format) - Updated to support Dexie
export const createBackup = async (data, userId = null) => {
  try {
    let backupData;

    // If userId is provided, export from Dexie
    if (userId) {
      backupData = await exportDexieData(userId);
    } else {
      // Otherwise use provided data (backward compatibility)
      backupData = {
        ...data,
        metadata: {
          ...data.metadata,
          backupDate: new Date().toISOString()
        }
      };
    }

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    downloadBlob(blob, `bycodez_backup_${timestamp}${BACKUP_FILE_EXTENSION}`);

    return true;
  } catch (error) {
    console.error('Error creating backup:', error);
    return false;
  }
};

// Create compressed backup (.json.gz format) - Updated to support Dexie
export const createCompressedBackup = async (data, userId = null) => {
  try {
    let backupData;

    // If userId is provided, export from Dexie
    if (userId) {
      backupData = await exportDexieData(userId);
    } else {
      // Otherwise use provided data (backward compatibility)
      backupData = {
        ...data,
        metadata: {
          ...data.metadata,
          backupDate: new Date().toISOString()
        }
      };
    }

    const jsonString = JSON.stringify(backupData);
    const compressed = pako.gzip(jsonString);
    const blob = new Blob([compressed], { type: 'application/gzip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.href = url;
    link.download = `bycodez_backup_${timestamp}.json.gz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error creating compressed backup:', error);
    return false;
  }
};

// Create encrypted backup (.ttfe format) - Password-protected backup
export const createEncryptedBackup = async (data, password, userId = null) => {
  try {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    let backupData;

    // If userId is provided, export from Dexie
    if (userId) {
      backupData = await exportDexieData(userId);
    } else {
      // Otherwise use provided data (backward compatibility)
      backupData = {
        ...data,
        metadata: {
          ...data.metadata,
          backupDate: new Date().toISOString(),
          encrypted: true
        }
      };
    }

    const jsonString = JSON.stringify(backupData);

    // Encrypt the data
    const encryptedBuffer = await encryptData(jsonString, password);

    const blob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.href = url;
    link.download = `bycodez_backup_${timestamp}${ENCRYPTED_BACKUP_EXTENSION}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error creating encrypted backup:', error);
    throw error;
  }
};

// Restore data to Dexie database
export const restoreToDexie = async (data) => {
  try {
    console.log('🔄 Starting Dexie restore...');

    // Clear existing data first
    await db.users.clear();
    await db.projects.clear();
    await db.invoices.clear();
    await db.quotations.clear();
    await db.paymentsIn.clear();
    await db.paymentsOut.clear();
    await db.departments.clear();
    await db.settings.clear();

    console.log('✅ Cleared existing Dexie data');

    // Restore users
    if (data.users && Array.isArray(data.users)) {
      await db.users.bulkAdd(data.users);
      console.log(`✅ Restored ${data.users.length} users`);
    }

    // Restore projects
    if (data.projects && Array.isArray(data.projects)) {
      await db.projects.bulkAdd(data.projects);
      console.log(`✅ Restored ${data.projects.length} projects`);
    }

    // Restore invoices
    if (data.invoices && Array.isArray(data.invoices)) {
      await db.invoices.bulkAdd(data.invoices);
      console.log(`✅ Restored ${data.invoices.length} invoices`);
    }

    // Restore quotations
    if (data.quotations && Array.isArray(data.quotations)) {
      await db.quotations.bulkAdd(data.quotations);
      console.log(`✅ Restored ${data.quotations.length} quotations`);
    }

    // Restore payments in
    if (data.paymentsIn && Array.isArray(data.paymentsIn)) {
      await db.paymentsIn.bulkAdd(data.paymentsIn);
      console.log(`✅ Restored ${data.paymentsIn.length} payments in`);
    }

    // Restore payments out
    if (data.paymentsOut && Array.isArray(data.paymentsOut)) {
      await db.paymentsOut.bulkAdd(data.paymentsOut);
      console.log(`✅ Restored ${data.paymentsOut.length} payments out`);
    }

    // Restore departments
    if (data.departments && Array.isArray(data.departments)) {
      await db.departments.bulkAdd(data.departments);
      console.log(`✅ Restored ${data.departments.length} departments`);
    }

    // Restore settings
    if (data.settings) {
      // Settings might be an object or array
      if (Array.isArray(data.settings)) {
        await db.settings.bulkAdd(data.settings);
        console.log(`✅ Restored ${data.settings.length} settings`);
      } else {
        // Single settings object - add with userId if available
        await db.settings.add(data.settings);
        console.log('✅ Restored settings');
      }
    }

    // Restore current project ID
    if (data.currentProjectId) {
      saveCurrentProjectId(data.currentProjectId);
      console.log('✅ Restored current project ID');
    }

    console.log('✅ Dexie restore completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error restoring to Dexie:', error);
    throw error;
  }
};

// Restore from backup file (supports .ttf, .json.gz, and .ttfe encrypted files)
export const restoreFromBackup = (file, password = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        let jsonString = e.target.result;

        // Check if file is encrypted (.ttfe)
        if (file.name.endsWith('.ttfe') || file.name.endsWith(ENCRYPTED_BACKUP_EXTENSION)) {
          if (!password) {
            reject(new Error('Password required for encrypted backup'));
            return;
          }

          try {
            // Decrypt the data
            jsonString = await decryptData(e.target.result, password);
          } catch (decryptError) {
            console.error('Decryption error:', decryptError);
            reject(new Error('Incorrect password or corrupted encrypted backup'));
            return;
          }
        }
        // Check if file is compressed (.gz)
        else if (file.name.endsWith('.gz')) {
          const compressed = new Uint8Array(e.target.result);
          jsonString = pako.ungzip(compressed, { to: 'string' });
        }
        // Check if buffer might be encrypted (auto-detect)
        else if (e.target.result instanceof ArrayBuffer) {
          const buffer = e.target.result;
          if (isEncrypted(buffer)) {
            if (!password) {
              reject(new Error('This backup is encrypted. Please provide a password.'));
              return;
            }

            try {
              jsonString = await decryptData(buffer, password);
            } catch (decryptError) {
              console.error('Decryption error:', decryptError);
              reject(new Error('Incorrect password or corrupted encrypted backup'));
              return;
            }
          } else {
            // Not encrypted, try to read as text
            const decoder = new TextDecoder();
            jsonString = decoder.decode(buffer);
          }
        }

        const data = JSON.parse(jsonString);

        // Validate data structure - check for at least users array
        if (!data.users || !Array.isArray(data.users)) {
          throw new Error('Invalid backup file structure - missing users data');
        }

        // Restore to Dexie database
        await restoreToDexie(data);

        // Merge with default data to ensure all fields exist
        const restoredData = { ...getDefaultData(), ...data };

        // Save to localStorage for backward compatibility
        saveData(restoredData);

        resolve(restoredData);
      } catch (error) {
        console.error('Restore error:', error);
        reject(new Error('Failed to restore backup: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };

    // Always read as ArrayBuffer to support all formats
    reader.readAsArrayBuffer(file);
  });
};

// Clear all data - Updated to clear both Dexie and localStorage
export const clearAllData = async () => {
  try {
    // Clear Dexie database
    await clearDexieData();

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_PROJECT_KEY);
    localStorage.removeItem('bycodez_current_user');
    localStorage.removeItem('bycodez_migration_completed');

    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// File handling utilities
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

// Convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Validate file
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Get file extension
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Check if file is image
export const isImageFile = (fileType) => {
  return fileType.startsWith('image/');
};

// Check if file is PDF
export const isPDFFile = (fileType) => {
  return fileType === 'application/pdf';
};

// Format currency
export const formatCurrency = (amount, currency = '₹') => {
  return `${currency}${parseFloat(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Format date
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '-';

  const d = new Date(date);

  // Check if date is invalid
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  } else if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  } else if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }

  return `${day}/${month}/${year}`;
};

// Format date and time
export const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';

  const d = new Date(dateTime);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Calculate total payments in
export const calculateTotalPaymentsIn = (paymentsIn) => {
  return paymentsIn.reduce((total, payment) => total + parseFloat(payment.amount || 0), 0);
};

// Calculate total payments out (only approved expenses)
export const calculateTotalPaymentsOut = (paymentsOut) => {
  // Filter to only include approved payments
  const approvedPayments = paymentsOut.filter(p => p.approvalStatus === 'approved');
  return approvedPayments.reduce((total, payment) => total + parseFloat(payment.amount || 0), 0);
};

// Calculate balance
export const calculateBalance = (paymentsIn, paymentsOut) => {
  const totalIn = calculateTotalPaymentsIn(paymentsIn);
  const totalOut = calculateTotalPaymentsOut(paymentsOut);
  return totalIn - totalOut;
};

// Check if payment reminder needed
export const needsPaymentReminder = (paymentsIn, paymentsOut) => {
  const balance = calculateBalance(paymentsIn, paymentsOut);
  return balance < 0;
};

// Get expenses by department (only approved expenses)
export const getExpensesByDepartment = (paymentsOut, departments) => {
  const expenseMap = {};

  departments.forEach(dept => {
    expenseMap[dept.id] = {
      name: dept.name,
      total: 0,
      count: 0
    };
  });

  // Filter to only include approved payments
  const approvedPayments = paymentsOut.filter(p => p.approvalStatus === 'approved');

  approvedPayments.forEach(payment => {
    if (expenseMap[payment.departmentId]) {
      expenseMap[payment.departmentId].total += parseFloat(payment.amount || 0);
      expenseMap[payment.departmentId].count += 1;
    }
  });

  return Object.values(expenseMap);
};

// Get current project
export const getCurrentProject = (data) => {
  if (!data.currentProjectId || !data.projects) return null;
  return data.projects.find(p => p.id === data.currentProjectId) || null;
};

// Calculate payment progress for a project
export const calculatePaymentProgress = (project) => {
  if (!project || !project.totalCommittedAmount) {
    return {
      totalCommitted: 0,
      totalReceived: 0,
      remainingBalance: 0,
      percentageReceived: 0,
      percentageRemaining: 100
    };
  }

  const totalCommitted = parseFloat(project.totalCommittedAmount) || 0;
  const totalReceived = calculateTotalPaymentsIn(project.paymentsIn || []);
  const remainingBalance = totalCommitted - totalReceived;
  const percentageReceived = totalCommitted > 0 ? (totalReceived / totalCommitted) * 100 : 0;
  const percentageRemaining = 100 - percentageReceived;

  return {
    totalCommitted,
    totalReceived,
    remainingBalance,
    percentageReceived: Math.min(percentageReceived, 100),
    percentageRemaining: Math.max(percentageRemaining, 0)
  };
};

// Get project summary
export const getProjectSummary = (project) => {
  if (!project) return null;

  const totalIn = calculateTotalPaymentsIn(project.paymentsIn || []);
  const totalOut = calculateTotalPaymentsOut(project.paymentsOut || []);
  const balance = totalIn - totalOut;
  const progress = calculatePaymentProgress(project);

  return {
    ...progress,
    totalExpenses: totalOut,
    netBalance: balance,
    needsPaymentReminder: balance < 0
  };
};

