import Dexie from 'dexie';

// Initialize Dexie database
export const db = new Dexie('ConstructionBillingDB');

// Define database schema
db.version(3).stores({
  // Users table
  users: '++id, username, email, role, firebaseUid, synced, lastUpdated',

  // Projects table
  projects: '++id, userId, name, status, customerId, synced, lastUpdated',

  // Invoices table
  invoices: '++id, userId, projectId, invoiceNumber, status, synced, lastUpdated',

  // Quotations table
  quotations: '++id, userId, quotationNumber, status, synced, lastUpdated',

  // Payments In table
  paymentsIn: '++id, userId, projectId, partyId, date, synced, lastUpdated',

  // Payments Out table
  paymentsOut: '++id, userId, projectId, partyId, date, synced, lastUpdated',

  // Departments table
  departments: '++id, userId, projectId, name, synced, lastUpdated',

  // Parties table (Customers and Suppliers) - Enhanced with new fields
  parties: '++id, userId, type, name, phone, alternateNumber, email, synced, lastUpdated',

  // Settings table (one record per user)
  settings: '++id, userId, synced, lastUpdated',

  // Signature Settings table (one record per user)
  signatureSettings: '++id, userId, type, synced, lastUpdated',

  // Sync metadata table (tracks sync status)
  syncMetadata: '++id, userId, tableName, recordId, lastSyncedAt, syncStatus'
});

// Upgrade to version 4 - Add Supplier Transactions table
db.version(4).stores({
  // Users table
  users: '++id, username, email, role, firebaseUid, synced, lastUpdated',

  // Projects table
  projects: '++id, userId, name, status, customerId, synced, lastUpdated',

  // Invoices table
  invoices: '++id, userId, projectId, invoiceNumber, status, synced, lastUpdated',

  // Quotations table
  quotations: '++id, userId, quotationNumber, status, synced, lastUpdated',

  // Payments In table
  paymentsIn: '++id, userId, projectId, partyId, date, synced, lastUpdated',

  // Payments Out table - Enhanced with supplier references
  paymentsOut: '++id, userId, projectId, partyId, supplierId, supplierTransactionId, date, synced, lastUpdated',

  // Departments table
  departments: '++id, userId, projectId, name, synced, lastUpdated',

  // Parties table (Customers and Suppliers)
  parties: '++id, userId, type, name, phone, alternateNumber, email, synced, lastUpdated',

  // Settings table (one record per user)
  settings: '++id, userId, synced, lastUpdated',

  // Signature Settings table (one record per user)
  signatureSettings: '++id, userId, type, synced, lastUpdated',

  // Sync metadata table (tracks sync status)
  syncMetadata: '++id, userId, tableName, recordId, lastSyncedAt, syncStatus',

  // NEW: Supplier Transactions table
  supplierTransactions: '++id, userId, supplierId, projectId, type, date, paymentOutId, synced, lastUpdated'
});

// Upgrade to version 5 - Add defaultProjectId to parties table, remove shippingAddress
db.version(5).stores({
  // Users table
  users: '++id, username, email, role, firebaseUid, synced, lastUpdated',

  // Projects table
  projects: '++id, userId, name, status, customerId, synced, lastUpdated',

  // Invoices table
  invoices: '++id, userId, projectId, invoiceNumber, status, synced, lastUpdated',

  // Quotations table
  quotations: '++id, userId, quotationNumber, status, synced, lastUpdated',

  // Payments In table
  paymentsIn: '++id, userId, projectId, partyId, date, synced, lastUpdated',

  // Payments Out table - Enhanced with supplier references
  paymentsOut: '++id, userId, projectId, partyId, supplierId, supplierTransactionId, date, synced, lastUpdated',

  // Departments table
  departments: '++id, userId, projectId, name, synced, lastUpdated',

  // Parties table (Customers and Suppliers) - Added defaultProjectId for suppliers
  parties: '++id, userId, type, name, phone, alternateNumber, email, defaultProjectId, synced, lastUpdated',

  // Settings table (one record per user)
  settings: '++id, userId, synced, lastUpdated',

  // Signature Settings table (one record per user)
  signatureSettings: '++id, userId, type, synced, lastUpdated',

  // Sync metadata table (tracks sync status)
  syncMetadata: '++id, userId, tableName, recordId, lastSyncedAt, syncStatus',

  // Supplier Transactions table
  supplierTransactions: '++id, userId, supplierId, projectId, type, date, paymentOutId, synced, lastUpdated'
}).upgrade(async (trans) => {
  // Migration: Remove shippingAddress field from existing parties
  const parties = await trans.table('parties').toArray();
  for (const party of parties) {
    const updates = {
      defaultProjectId: null // Initialize with null
    };

    // Remove shippingAddress if it exists
    if (party.shippingAddress !== undefined) {
      updates.shippingAddress = undefined;
    }

    await trans.table('parties').update(party.id, updates);
  }
});

// Upgrade to version 6 - Migrate old 'credit'/'debit' transactions to 'purchase'/'payment'
db.version(6).stores({
  // Users table
  users: '++id, username, email, role, firebaseUid, synced, lastUpdated',

  // Projects table
  projects: '++id, userId, name, status, customerId, synced, lastUpdated',

  // Invoices table
  invoices: '++id, userId, projectId, invoiceNumber, status, synced, lastUpdated',

  // Quotations table
  quotations: '++id, userId, quotationNumber, status, synced, lastUpdated',

  // Payments In table
  paymentsIn: '++id, userId, projectId, partyId, date, synced, lastUpdated',

  // Payments Out table - Enhanced with supplier references
  paymentsOut: '++id, userId, projectId, partyId, supplierId, supplierTransactionId, date, synced, lastUpdated',

  // Departments table
  departments: '++id, userId, projectId, name, synced, lastUpdated',

  // Parties table (Customers and Suppliers) - Added defaultProjectId for suppliers
  parties: '++id, userId, type, name, phone, alternateNumber, email, defaultProjectId, synced, lastUpdated',

  // Settings table (one record per user)
  settings: '++id, userId, synced, lastUpdated',

  // Signature Settings table (one record per user)
  signatureSettings: '++id, userId, type, synced, lastUpdated',

  // Sync metadata table (tracks sync status)
  syncMetadata: '++id, userId, tableName, recordId, lastSyncedAt, syncStatus',

  // Supplier Transactions table
  supplierTransactions: '++id, userId, supplierId, projectId, type, date, paymentOutId, synced, lastUpdated'
}).upgrade(async (trans) => {
  // Migration: Convert old 'credit'/'debit' transactions to 'purchase'/'payment'
  const supplierTransactions = await trans.table('supplierTransactions').toArray();

  for (const transaction of supplierTransactions) {
    const updates = {};

    // Convert old terminology to new terminology
    if (transaction.type === 'credit') {
      updates.type = 'purchase'; // Credit = Material purchased on credit (we owe supplier)
    } else if (transaction.type === 'debit') {
      updates.type = 'payment'; // Debit = Payment made to supplier (reduces what we owe)
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      await trans.table('supplierTransactions').update(transaction.id, updates);
    }
  }
});

// Upgrade to version 7 - Add Subscription and Device Tracking
db.version(7).stores({
  // Users table - Enhanced with subscription fields
  users: '++id, username, email, role, firebaseUid, subscriptionTier, subscriptionStatus, synced, lastUpdated',

  // Projects table
  projects: '++id, userId, name, status, customerId, synced, lastUpdated',

  // Invoices table
  invoices: '++id, userId, projectId, invoiceNumber, status, synced, lastUpdated',

  // Quotations table
  quotations: '++id, userId, quotationNumber, status, synced, lastUpdated',

  // Payments In table
  paymentsIn: '++id, userId, projectId, partyId, date, synced, lastUpdated',

  // Payments Out table - Enhanced with supplier references
  paymentsOut: '++id, userId, projectId, partyId, supplierId, supplierTransactionId, date, synced, lastUpdated',

  // Departments table
  departments: '++id, userId, projectId, name, synced, lastUpdated',

  // Parties table (Customers and Suppliers) - Added defaultProjectId for suppliers
  parties: '++id, userId, type, name, phone, alternateNumber, email, defaultProjectId, synced, lastUpdated',

  // Settings table (one record per user)
  settings: '++id, userId, synced, lastUpdated',

  // Signature Settings table (one record per user)
  signatureSettings: '++id, userId, type, synced, lastUpdated',

  // Sync metadata table (tracks sync status)
  syncMetadata: '++id, userId, tableName, recordId, lastSyncedAt, syncStatus',

  // Supplier Transactions table
  supplierTransactions: '++id, userId, supplierId, projectId, type, date, paymentOutId, synced, lastUpdated',

  // NEW: Subscriptions table (one record per organization/account)
  subscriptions: '++id, organizationId, tier, status, billingCycle, startDate, endDate, userLimit, deviceLimit, projectLimit, storageLimit, synced, lastUpdated',

  // NEW: Devices table (tracks user devices)
  devices: '++id, userId, deviceId, deviceName, deviceType, browser, os, lastActive, synced, lastUpdated',

  // NEW: License Keys table
  licenseKeys: '++id, organizationId, key, tier, status, activatedAt, expiresAt, maxUsers, maxDevices, synced, lastUpdated'
}).upgrade(async (trans) => {
  // Migration: Add default subscription tier to existing users
  const users = await trans.table('users').toArray();

  for (const user of users) {
    const updates = {
      subscriptionTier: user.subscriptionTier || 'starter',
      subscriptionStatus: user.subscriptionStatus || 'active'
    };

    await trans.table('users').update(user.id, updates);
  }
});

// Upgrade to version 8 - Add CRITICAL FEATURES: Materials, Labor, Budget, Retention, Change Orders, Documents
db.version(8).stores({
  // Existing tables (unchanged)
  users: '++id, username, email, role, firebaseUid, subscriptionTier, subscriptionStatus, synced, lastUpdated',
  projects: '++id, userId, name, status, customerId, synced, lastUpdated',
  invoices: '++id, userId, projectId, invoiceNumber, status, synced, lastUpdated',
  quotations: '++id, userId, quotationNumber, status, synced, lastUpdated',
  paymentsIn: '++id, userId, projectId, partyId, date, synced, lastUpdated',
  paymentsOut: '++id, userId, projectId, partyId, supplierId, supplierTransactionId, date, synced, lastUpdated',
  departments: '++id, userId, projectId, name, synced, lastUpdated',
  parties: '++id, userId, type, name, phone, alternateNumber, email, defaultProjectId, synced, lastUpdated',
  settings: '++id, userId, synced, lastUpdated',
  signatureSettings: '++id, userId, type, synced, lastUpdated',
  syncMetadata: '++id, userId, tableName, recordId, lastSyncedAt, syncStatus',
  supplierTransactions: '++id, userId, supplierId, projectId, type, date, paymentOutId, synced, lastUpdated',
  subscriptions: '++id, organizationId, tier, status, billingCycle, startDate, endDate, userLimit, deviceLimit, projectLimit, storageLimit, synced, lastUpdated',
  devices: '++id, userId, deviceId, deviceName, deviceType, browser, os, lastActive, synced, lastUpdated',
  licenseKeys: '++id, organizationId, key, tier, status, activatedAt, expiresAt, maxUsers, maxDevices, synced, lastUpdated',

  // MATERIAL/INVENTORY MANAGEMENT
  materials: '++id, userId, materialCode, name, category, currentStock, reorderLevel, isActive, synced, lastUpdated',
  stockTransactions: '++id, userId, materialId, projectId, transactionType, transactionDate, synced, lastUpdated',
  purchaseOrders: '++id, userId, projectId, poNumber, supplierId, status, orderDate, synced, lastUpdated',
  materialAllocation: '++id, userId, projectId, materialId, synced, lastUpdated',

  // LABOR/TIME TRACKING & PAYROLL
  workers: '++id, userId, workerCode, name, phone, workerType, skillCategory, status, currentProject, synced, lastUpdated',
  attendance: '++id, userId, workerId, projectId, attendanceDate, status, synced, lastUpdated',
  timeSheets: '++id, userId, workerId, projectId, weekStartDate, status, synced, lastUpdated',
  payroll: '++id, userId, workerId, projectId, payrollNumber, payPeriodStart, payPeriodEnd, paymentStatus, synced, lastUpdated',
  leaveManagement: '++id, userId, workerId, leaveType, startDate, endDate, status, synced, lastUpdated',
  workerAdvances: '++id, userId, workerId, projectId, advanceDate, repaymentStatus, synced, lastUpdated',

  // BUDGET PLANNING & FORECASTING
  projectBudgets: '++id, userId, projectId, budgetVersion, status, isActive, synced, lastUpdated',
  budgetLineItems: '++id, userId, budgetId, projectId, categoryType, synced, lastUpdated',
  budgetAlerts: '++id, userId, projectId, budgetId, alertType, status, alertDate, synced, lastUpdated',
  budgetRevisions: '++id, userId, projectId, originalBudgetId, revisionNumber, changeDate, synced, lastUpdated',
  costForecasts: '++id, userId, projectId, budgetId, forecastDate, synced, lastUpdated',

  // RETENTION MANAGEMENT
  retentionPolicies: '++id, userId, policyName, retentionPercentage, releaseType, isDefault, isActive, synced, lastUpdated',
  retentionAccounts: '++id, userId, referenceType, referenceId, partyId, projectId, policyId, retentionType, status, synced, lastUpdated',
  retentionReleases: '++id, userId, retentionAccountId, releaseNumber, releaseDate, releaseType, synced, lastUpdated',
  retentionAlerts: '++id, userId, retentionAccountId, alertType, status, alertDate, synced, lastUpdated',

  // CHANGE ORDERS
  changeOrders: '++id, userId, projectId, customerId, changeOrderNumber, title, status, priority, requestDate, synced, lastUpdated',
  changeOrderLineItems: '++id, userId, changeOrderId, itemType, synced, lastUpdated',
  changeOrderHistory: '++id, userId, changeOrderId, action, actionDate, synced, lastUpdated',
  changeOrderImpacts: '++id, userId, changeOrderId, impactType, impactArea, severity, synced, lastUpdated',

  // DOCUMENT MANAGEMENT
  documents: '++id, userId, projectId, partyId, documentNumber, fileName, category, status, isLatestVersion, synced, lastUpdated',
  documentVersions: '++id, userId, documentId, versionNumber, uploadedDate, isCurrentVersion, synced, lastUpdated',
  documentSharing: '++id, userId, documentId, sharedDate, isActive, synced, lastUpdated',
  documentActivity: '++id, userId, documentId, activityType, performedDate, synced, lastUpdated'
});

// Helper function to add synced and lastUpdated fields to records
export const addSyncFields = (record) => ({
  ...record,
  synced: false,
  lastUpdated: new Date().toISOString()
});

// Helper function to mark record as synced
export const markAsSynced = async (tableName, id) => {
  await db[tableName].update(id, {
    synced: true,
    lastUpdated: new Date().toISOString()
  });
};

// Helper function to get unsynced records
export const getUnsyncedRecords = async (tableName, userId) => {
  return await db[tableName]
    .where({ userId, synced: false })
    .toArray();
};

// Helper function to get all records for a user
// If userId is null or 'admin', returns all records (for admin users)
export const getUserRecords = async (tableName, userId, isAdmin = false) => {
  if (isAdmin || !userId) {
    // Admin users get all records
    return await db[tableName].toArray();
  }
  // Regular users get only their records
  return await db[tableName]
    .where({ userId })
    .toArray();
};

// CRUD Operations for Users
export const addUser = async (userData) => {
  const user = addSyncFields(userData);
  const id = await db.users.add(user);
  return { ...user, id };
};

export const getUsers = async () => {
  return await db.users.toArray();
};

export const getUserByUsername = async (username) => {
  return await db.users.where({ username }).first();
};

export const getUserByFirebaseUid = async (firebaseUid) => {
  return await db.users.where({ firebaseUid }).first();
};

export const updateUser = async (id, updates) => {
  await db.users.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteUser = async (id) => {
  await db.users.delete(id);
};

// CRUD Operations for Projects
export const addProject = async (projectData, userId) => {
  const project = addSyncFields({ ...projectData, userId });
  const id = await db.projects.add(project);
  return { ...project, id };
};

export const getProjects = async (userId, isAdmin = false) => {
  return await getUserRecords('projects', userId, isAdmin);
};

export const getProjectById = async (id) => {
  return await db.projects.get(id);
};

export const updateProject = async (id, updates) => {
  await db.projects.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteProject = async (id) => {
  await db.projects.delete(id);
};

// CRUD Operations for Invoices
export const addInvoice = async (invoiceData, userId) => {
  const invoice = addSyncFields({ ...invoiceData, userId });
  const id = await db.invoices.add(invoice);
  return { ...invoice, id };
};

export const getInvoices = async (userId, isAdmin = false) => {
  return await getUserRecords('invoices', userId, isAdmin);
};

export const getInvoiceById = async (id) => {
  return await db.invoices.get(id);
};

export const updateInvoice = async (id, updates) => {
  await db.invoices.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteInvoice = async (id) => {
  await db.invoices.delete(id);
};

// CRUD Operations for Quotations
export const addQuotation = async (quotationData, userId) => {
  const quotation = addSyncFields({ ...quotationData, userId });
  const id = await db.quotations.add(quotation);
  return { ...quotation, id };
};

export const getQuotations = async (userId, isAdmin = false) => {
  return await getUserRecords('quotations', userId, isAdmin);
};

export const getQuotationById = async (id) => {
  return await db.quotations.get(id);
};

export const updateQuotation = async (id, updates) => {
  await db.quotations.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteQuotation = async (id) => {
  await db.quotations.delete(id);
};

// CRUD Operations for Payments In
export const addPaymentIn = async (paymentData, userId) => {
  const payment = addSyncFields({ ...paymentData, userId });
  const id = await db.paymentsIn.add(payment);
  return { ...payment, id };
};

export const getPaymentsIn = async (userId, isAdmin = false) => {
  return await getUserRecords('paymentsIn', userId, isAdmin);
};

export const updatePaymentIn = async (id, updates) => {
  await db.paymentsIn.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deletePaymentIn = async (id) => {
  await db.paymentsIn.delete(id);
};

// CRUD Operations for Payments Out
export const addPaymentOut = async (paymentData, userId) => {
  const payment = addSyncFields({ ...paymentData, userId });
  const id = await db.paymentsOut.add(payment);
  return { ...payment, id };
};

export const getPaymentsOut = async (userId, isAdmin = false) => {
  return await getUserRecords('paymentsOut', userId, isAdmin);
};

export const updatePaymentOut = async (id, updates) => {
  await db.paymentsOut.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deletePaymentOut = async (id) => {
  await db.paymentsOut.delete(id);
};

// CRUD Operations for Departments
export const addDepartment = async (departmentData, userId) => {
  const department = addSyncFields({ ...departmentData, userId });
  const id = await db.departments.add(department);
  return { ...department, id };
};

export const getDepartments = async (userId, projectId = null, isAdmin = false) => {
  if (isAdmin) {
    // Admin gets all departments
    if (projectId) {
      return await db.departments.where({ projectId }).toArray();
    }
    return await db.departments.toArray();
  }

  if (projectId) {
    return await db.departments.where({ userId, projectId }).toArray();
  }
  return await getUserRecords('departments', userId, isAdmin);
};

export const updateDepartment = async (id, updates) => {
  await db.departments.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteDepartment = async (id) => {
  await db.departments.delete(id);
};

// CRUD Operations for Settings
export const saveSettings = async (settingsData, userId) => {
  const existing = await db.settings.where({ userId }).first();
  
  if (existing) {
    await db.settings.update(existing.id, {
      ...settingsData,
      userId,
      synced: false,
      lastUpdated: new Date().toISOString()
    });
    return { ...settingsData, id: existing.id, userId };
  } else {
    const settings = addSyncFields({ ...settingsData, userId });
    const id = await db.settings.add(settings);
    return { ...settings, id };
  }
};

export const getSettings = async (userId, isAdmin = false) => {
  if (isAdmin) {
    // Admin gets their own settings, or first available settings
    const adminSettings = await db.settings.where({ userId }).first();
    if (adminSettings) return adminSettings;
    return await db.settings.toArray().then(settings => settings[0]);
  }
  return await db.settings.where({ userId }).first();
};

// CRUD Operations for Signature Settings
export const saveSignatureSettings = async (signatureData, userId) => {
  const existing = await db.signatureSettings.where({ userId }).first();
  
  if (existing) {
    await db.signatureSettings.update(existing.id, {
      ...signatureData,
      userId,
      synced: false,
      lastUpdated: new Date().toISOString()
    });
    return { ...signatureData, id: existing.id, userId };
  } else {
    const signature = addSyncFields({ ...signatureData, userId });
    const id = await db.signatureSettings.add(signature);
    return { ...signature, id };
  }
};

export const getSignatureSettings = async (userId) => {
  return await db.signatureSettings.where({ userId }).first();
};

// CRUD Operations for Parties (Customers and Suppliers)
export const addParty = async (partyData, userId) => {
  const party = addSyncFields({ ...partyData, userId });
  const id = await db.parties.add(party);
  return { ...party, id };
};

export const getParties = async (userId, isAdmin = false) => {
  return await getUserRecords('parties', userId, isAdmin);
};

export const getPartyById = async (id) => {
  return await db.parties.get(id);
};

export const getPartiesByType = async (userId, type, isAdmin = false) => {
  const allParties = await getUserRecords('parties', userId, isAdmin);
  return allParties.filter(party => party.type === type || party.type === 'both');
};

export const updateParty = async (id, updates) => {
  await db.parties.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteParty = async (id) => {
  await db.parties.delete(id);
};

// CRUD Operations for Subscriptions
export const addSubscription = async (subscriptionData) => {
  const subscription = addSyncFields(subscriptionData);
  const id = await db.subscriptions.add(subscription);
  return { ...subscription, id };
};

export const getSubscriptionByOrganizationId = async (organizationId) => {
  return await db.subscriptions.where({ organizationId }).first();
};

export const updateSubscription = async (id, updates) => {
  await db.subscriptions.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteSubscription = async (id) => {
  await db.subscriptions.delete(id);
};

// CRUD Operations for Devices
export const addDevice = async (deviceData) => {
  const device = addSyncFields(deviceData);
  const id = await db.devices.add(device);
  return { ...device, id };
};

export const getDevicesByUserId = async (userId) => {
  return await db.devices.where({ userId }).toArray();
};

export const getDeviceByDeviceId = async (deviceId) => {
  return await db.devices.where({ deviceId }).first();
};

export const updateDevice = async (id, updates) => {
  await db.devices.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteDevice = async (id) => {
  await db.devices.delete(id);
};

export const updateDeviceLastActive = async (deviceId) => {
  const device = await getDeviceByDeviceId(deviceId);
  if (device) {
    await updateDevice(device.id, {
      lastActive: new Date().toISOString()
    });
  }
};

// CRUD Operations for License Keys
export const addLicenseKey = async (licenseData) => {
  const license = addSyncFields(licenseData);
  const id = await db.licenseKeys.add(license);
  return { ...license, id };
};

export const getLicenseKeyByKey = async (key) => {
  return await db.licenseKeys.where({ key }).first();
};

export const getLicenseKeysByOrganizationId = async (organizationId) => {
  return await db.licenseKeys.where({ organizationId }).toArray();
};

export const updateLicenseKey = async (id, updates) => {
  await db.licenseKeys.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteLicenseKey = async (id) => {
  await db.licenseKeys.delete(id);
};

// CRUD Operations for Supplier Transactions
export const addSupplierTransaction = async (transactionData, userId) => {
  const transaction = addSyncFields({ ...transactionData, userId });
  const id = await db.supplierTransactions.add(transaction);
  return { ...transaction, id };
};

export const getSupplierTransactions = async (userId, isAdmin = false) => {
  return await getUserRecords('supplierTransactions', userId, isAdmin);
};

export const getSupplierTransactionById = async (id) => {
  return await db.supplierTransactions.get(id);
};

export const getSupplierTransactionsBySupplier = async (supplierId) => {
  return await db.supplierTransactions.where({ supplierId }).toArray();
};

export const getSupplierTransactionsByProject = async (projectId) => {
  return await db.supplierTransactions.where({ projectId }).toArray();
};

export const getSupplierTransactionsBySupplierAndProject = async (supplierId, projectId) => {
  return await db.supplierTransactions.where({ supplierId, projectId }).toArray();
};

export const updateSupplierTransaction = async (id, updates) => {
  await db.supplierTransactions.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteSupplierTransaction = async (id) => {
  await db.supplierTransactions.delete(id);
};

export const deleteSupplierTransactionsByProject = async (projectId) => {
  const transactions = await db.supplierTransactions.where({ projectId }).toArray();
  const ids = transactions.map(t => t.id);
  await db.supplierTransactions.bulkDelete(ids);
  return transactions.length;
};

// ==================== MATERIAL/INVENTORY MANAGEMENT CRUD ====================

// Materials
export const addMaterial = async (materialData, userId) => {
  const material = addSyncFields({ ...materialData, userId });
  const id = await db.materials.add(material);
  return { ...material, id };
};

export const getMaterials = async (userId, isAdmin = false) => {
  return await getUserRecords('materials', userId, isAdmin);
};

export const getMaterialById = async (id) => {
  return await db.materials.get(id);
};

export const updateMaterial = async (id, updates) => {
  await db.materials.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteMaterial = async (id) => {
  await db.materials.delete(id);
};

// Stock Transactions
export const addStockTransaction = async (transactionData, userId) => {
  const transaction = addSyncFields({ ...transactionData, userId });
  const id = await db.stockTransactions.add(transaction);
  return { ...transaction, id };
};

export const getStockTransactions = async (userId, isAdmin = false) => {
  return await getUserRecords('stockTransactions', userId, isAdmin);
};

export const getStockTransactionsByMaterial = async (materialId) => {
  return await db.stockTransactions.where({ materialId }).toArray();
};

export const updateStockTransaction = async (id, updates) => {
  await db.stockTransactions.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteStockTransaction = async (id) => {
  await db.stockTransactions.delete(id);
};

// Purchase Orders
export const addPurchaseOrder = async (poData, userId) => {
  const po = addSyncFields({ ...poData, userId });
  const id = await db.purchaseOrders.add(po);
  return { ...po, id };
};

export const getPurchaseOrders = async (userId, isAdmin = false) => {
  return await getUserRecords('purchaseOrders', userId, isAdmin);
};

export const getPurchaseOrderById = async (id) => {
  return await db.purchaseOrders.get(id);
};

export const updatePurchaseOrder = async (id, updates) => {
  await db.purchaseOrders.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deletePurchaseOrder = async (id) => {
  await db.purchaseOrders.delete(id);
};

// Material Allocation
export const addMaterialAllocation = async (allocationData, userId) => {
  const allocation = addSyncFields({ ...allocationData, userId });
  const id = await db.materialAllocation.add(allocation);
  return { ...allocation, id };
};

export const getMaterialAllocations = async (userId, isAdmin = false) => {
  return await getUserRecords('materialAllocation', userId, isAdmin);
};

export const getMaterialAllocationsByProject = async (projectId) => {
  return await db.materialAllocation.where({ projectId }).toArray();
};

export const updateMaterialAllocation = async (id, updates) => {
  await db.materialAllocation.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteMaterialAllocation = async (id) => {
  await db.materialAllocation.delete(id);
};

// ==================== LABOR/TIME TRACKING & PAYROLL CRUD ====================

// Workers
export const addWorker = async (workerData, userId) => {
  const worker = addSyncFields({ ...workerData, userId });
  const id = await db.workers.add(worker);
  return { ...worker, id };
};

export const getWorkers = async (userId, isAdmin = false) => {
  return await getUserRecords('workers', userId, isAdmin);
};

export const getWorkerById = async (id) => {
  return await db.workers.get(id);
};

export const updateWorker = async (id, updates) => {
  await db.workers.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteWorker = async (id) => {
  await db.workers.delete(id);
};

// Attendance
export const addAttendance = async (attendanceData, userId) => {
  const attendance = addSyncFields({ ...attendanceData, userId });
  const id = await db.attendance.add(attendance);
  return { ...attendance, id };
};

export const getAttendance = async (userId, isAdmin = false) => {
  return await getUserRecords('attendance', userId, isAdmin);
};

export const getAttendanceByWorker = async (workerId) => {
  return await db.attendance.where({ workerId }).toArray();
};

export const getAttendanceByDate = async (attendanceDate) => {
  return await db.attendance.where({ attendanceDate }).toArray();
};

export const updateAttendance = async (id, updates) => {
  await db.attendance.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteAttendance = async (id) => {
  await db.attendance.delete(id);
};

// TimeSheets
export const addTimeSheet = async (timeSheetData, userId) => {
  const timeSheet = addSyncFields({ ...timeSheetData, userId });
  const id = await db.timeSheets.add(timeSheet);
  return { ...timeSheet, id };
};

export const getTimeSheets = async (userId, isAdmin = false) => {
  return await getUserRecords('timeSheets', userId, isAdmin);
};

export const getTimeSheetsByWorker = async (workerId) => {
  return await db.timeSheets.where({ workerId }).toArray();
};

export const updateTimeSheet = async (id, updates) => {
  await db.timeSheets.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteTimeSheet = async (id) => {
  await db.timeSheets.delete(id);
};

// Payroll
export const addPayroll = async (payrollData, userId) => {
  const payroll = addSyncFields({ ...payrollData, userId });
  const id = await db.payroll.add(payroll);
  return { ...payroll, id };
};

export const getPayroll = async (userId, isAdmin = false) => {
  return await getUserRecords('payroll', userId, isAdmin);
};

export const getPayrollByWorker = async (workerId) => {
  return await db.payroll.where({ workerId }).toArray();
};

export const getPayrollById = async (id) => {
  return await db.payroll.get(id);
};

export const updatePayroll = async (id, updates) => {
  await db.payroll.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deletePayroll = async (id) => {
  await db.payroll.delete(id);
};

// Leave Management
export const addLeave = async (leaveData, userId) => {
  const leave = addSyncFields({ ...leaveData, userId });
  const id = await db.leaveManagement.add(leave);
  return { ...leave, id };
};

export const getLeaves = async (userId, isAdmin = false) => {
  return await getUserRecords('leaveManagement', userId, isAdmin);
};

export const getLeavesByWorker = async (workerId) => {
  return await db.leaveManagement.where({ workerId }).toArray();
};

export const updateLeave = async (id, updates) => {
  await db.leaveManagement.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteLeave = async (id) => {
  await db.leaveManagement.delete(id);
};

// Worker Advances
export const addWorkerAdvance = async (advanceData, userId) => {
  const advance = addSyncFields({ ...advanceData, userId });
  const id = await db.workerAdvances.add(advance);
  return { ...advance, id };
};

export const getWorkerAdvances = async (userId, isAdmin = false) => {
  return await getUserRecords('workerAdvances', userId, isAdmin);
};

export const getWorkerAdvancesByWorker = async (workerId) => {
  return await db.workerAdvances.where({ workerId }).toArray();
};

export const updateWorkerAdvance = async (id, updates) => {
  await db.workerAdvances.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteWorkerAdvance = async (id) => {
  await db.workerAdvances.delete(id);
};

// ==================== BUDGET PLANNING & FORECASTING CRUD ====================

// Project Budgets
export const addProjectBudget = async (budgetData, userId) => {
  const budget = addSyncFields({ ...budgetData, userId });
  const id = await db.projectBudgets.add(budget);
  return { ...budget, id };
};

export const getProjectBudgets = async (userId, isAdmin = false) => {
  return await getUserRecords('projectBudgets', userId, isAdmin);
};

export const getProjectBudgetsByProject = async (projectId) => {
  return await db.projectBudgets.where({ projectId }).toArray();
};

export const getProjectBudgetById = async (id) => {
  return await db.projectBudgets.get(id);
};

export const updateProjectBudget = async (id, updates) => {
  await db.projectBudgets.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteProjectBudget = async (id) => {
  await db.projectBudgets.delete(id);
};

// Budget Line Items
export const addBudgetLineItem = async (lineItemData, userId) => {
  const lineItem = addSyncFields({ ...lineItemData, userId });
  const id = await db.budgetLineItems.add(lineItem);
  return { ...lineItem, id };
};

export const getBudgetLineItems = async (userId, isAdmin = false) => {
  return await getUserRecords('budgetLineItems', userId, isAdmin);
};

export const getBudgetLineItemsByBudget = async (budgetId) => {
  return await db.budgetLineItems.where({ budgetId }).toArray();
};

export const updateBudgetLineItem = async (id, updates) => {
  await db.budgetLineItems.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteBudgetLineItem = async (id) => {
  await db.budgetLineItems.delete(id);
};

// Budget Alerts
export const addBudgetAlert = async (alertData, userId) => {
  const alert = addSyncFields({ ...alertData, userId });
  const id = await db.budgetAlerts.add(alert);
  return { ...alert, id };
};

export const getBudgetAlerts = async (userId, isAdmin = false) => {
  return await getUserRecords('budgetAlerts', userId, isAdmin);
};

export const getBudgetAlertsByProject = async (projectId) => {
  return await db.budgetAlerts.where({ projectId }).toArray();
};

export const updateBudgetAlert = async (id, updates) => {
  await db.budgetAlerts.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteBudgetAlert = async (id) => {
  await db.budgetAlerts.delete(id);
};

// Budget Revisions
export const addBudgetRevision = async (revisionData, userId) => {
  const revision = addSyncFields({ ...revisionData, userId });
  const id = await db.budgetRevisions.add(revision);
  return { ...revision, id };
};

export const getBudgetRevisions = async (userId, isAdmin = false) => {
  return await getUserRecords('budgetRevisions', userId, isAdmin);
};

export const getBudgetRevisionsByProject = async (projectId) => {
  return await db.budgetRevisions.where({ projectId }).toArray();
};

export const updateBudgetRevision = async (id, updates) => {
  await db.budgetRevisions.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteBudgetRevision = async (id) => {
  await db.budgetRevisions.delete(id);
};

// Cost Forecasts
export const addCostForecast = async (forecastData, userId) => {
  const forecast = addSyncFields({ ...forecastData, userId });
  const id = await db.costForecasts.add(forecast);
  return { ...forecast, id };
};

export const getCostForecasts = async (userId, isAdmin = false) => {
  return await getUserRecords('costForecasts', userId, isAdmin);
};

export const getCostForecastsByProject = async (projectId) => {
  return await db.costForecasts.where({ projectId }).toArray();
};

export const updateCostForecast = async (id, updates) => {
  await db.costForecasts.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteCostForecast = async (id) => {
  await db.costForecasts.delete(id);
};

// ==================== RETENTION MANAGEMENT CRUD ====================

// Retention Policies
export const addRetentionPolicy = async (policyData, userId) => {
  const policy = addSyncFields({ ...policyData, userId });
  const id = await db.retentionPolicies.add(policy);
  return { ...policy, id };
};

export const getRetentionPolicies = async (userId, isAdmin = false) => {
  return await getUserRecords('retentionPolicies', userId, isAdmin);
};

export const getRetentionPolicyById = async (id) => {
  return await db.retentionPolicies.get(id);
};

export const updateRetentionPolicy = async (id, updates) => {
  await db.retentionPolicies.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteRetentionPolicy = async (id) => {
  await db.retentionPolicies.delete(id);
};

// Retention Accounts
export const addRetentionAccount = async (accountData, userId) => {
  const account = addSyncFields({ ...accountData, userId });
  const id = await db.retentionAccounts.add(account);
  return { ...account, id };
};

export const getRetentionAccounts = async (userId, isAdmin = false) => {
  return await getUserRecords('retentionAccounts', userId, isAdmin);
};

export const getRetentionAccountsByProject = async (projectId) => {
  return await db.retentionAccounts.where({ projectId }).toArray();
};

export const getRetentionAccountById = async (id) => {
  return await db.retentionAccounts.get(id);
};

export const updateRetentionAccount = async (id, updates) => {
  await db.retentionAccounts.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteRetentionAccount = async (id) => {
  await db.retentionAccounts.delete(id);
};

// Retention Releases
export const addRetentionRelease = async (releaseData, userId) => {
  const release = addSyncFields({ ...releaseData, userId });
  const id = await db.retentionReleases.add(release);
  return { ...release, id };
};

export const getRetentionReleases = async (userId, isAdmin = false) => {
  return await getUserRecords('retentionReleases', userId, isAdmin);
};

export const getRetentionReleasesByAccount = async (retentionAccountId) => {
  return await db.retentionReleases.where({ retentionAccountId }).toArray();
};

export const updateRetentionRelease = async (id, updates) => {
  await db.retentionReleases.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteRetentionRelease = async (id) => {
  await db.retentionReleases.delete(id);
};

// Retention Alerts
export const addRetentionAlert = async (alertData, userId) => {
  const alert = addSyncFields({ ...alertData, userId });
  const id = await db.retentionAlerts.add(alert);
  return { ...alert, id };
};

export const getRetentionAlerts = async (userId, isAdmin = false) => {
  return await getUserRecords('retentionAlerts', userId, isAdmin);
};

export const updateRetentionAlert = async (id, updates) => {
  await db.retentionAlerts.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteRetentionAlert = async (id) => {
  await db.retentionAlerts.delete(id);
};

// ==================== CHANGE ORDERS CRUD ====================

// Change Orders
export const addChangeOrder = async (changeOrderData, userId) => {
  const changeOrder = addSyncFields({ ...changeOrderData, userId });
  const id = await db.changeOrders.add(changeOrder);
  return { ...changeOrder, id };
};

export const getChangeOrders = async (userId, isAdmin = false) => {
  return await getUserRecords('changeOrders', userId, isAdmin);
};

export const getChangeOrdersByProject = async (projectId) => {
  return await db.changeOrders.where({ projectId }).toArray();
};

export const getChangeOrderById = async (id) => {
  return await db.changeOrders.get(id);
};

export const updateChangeOrder = async (id, updates) => {
  await db.changeOrders.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteChangeOrder = async (id) => {
  await db.changeOrders.delete(id);
};

// Change Order Line Items
export const addChangeOrderLineItem = async (lineItemData, userId) => {
  const lineItem = addSyncFields({ ...lineItemData, userId });
  const id = await db.changeOrderLineItems.add(lineItem);
  return { ...lineItem, id };
};

export const getChangeOrderLineItems = async (userId, isAdmin = false) => {
  return await getUserRecords('changeOrderLineItems', userId, isAdmin);
};

export const getChangeOrderLineItemsByChangeOrder = async (changeOrderId) => {
  return await db.changeOrderLineItems.where({ changeOrderId }).toArray();
};

export const updateChangeOrderLineItem = async (id, updates) => {
  await db.changeOrderLineItems.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteChangeOrderLineItem = async (id) => {
  await db.changeOrderLineItems.delete(id);
};

// Change Order History
export const addChangeOrderHistory = async (historyData, userId) => {
  const history = addSyncFields({ ...historyData, userId });
  const id = await db.changeOrderHistory.add(history);
  return { ...history, id };
};

export const getChangeOrderHistory = async (userId, isAdmin = false) => {
  return await getUserRecords('changeOrderHistory', userId, isAdmin);
};

export const getChangeOrderHistoryByChangeOrder = async (changeOrderId) => {
  return await db.changeOrderHistory.where({ changeOrderId }).toArray();
};

export const updateChangeOrderHistory = async (id, updates) => {
  await db.changeOrderHistory.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteChangeOrderHistory = async (id) => {
  await db.changeOrderHistory.delete(id);
};

// Change Order Impacts
export const addChangeOrderImpact = async (impactData, userId) => {
  const impact = addSyncFields({ ...impactData, userId });
  const id = await db.changeOrderImpacts.add(impact);
  return { ...impact, id };
};

export const getChangeOrderImpacts = async (userId, isAdmin = false) => {
  return await getUserRecords('changeOrderImpacts', userId, isAdmin);
};

export const getChangeOrderImpactsByChangeOrder = async (changeOrderId) => {
  return await db.changeOrderImpacts.where({ changeOrderId }).toArray();
};

export const updateChangeOrderImpact = async (id, updates) => {
  await db.changeOrderImpacts.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteChangeOrderImpact = async (id) => {
  await db.changeOrderImpacts.delete(id);
};

// ==================== DOCUMENT MANAGEMENT CRUD ====================

// Documents
export const addDocument = async (documentData, userId) => {
  const document = addSyncFields({ ...documentData, userId });
  const id = await db.documents.add(document);
  return { ...document, id };
};

export const getDocuments = async (userId, isAdmin = false) => {
  return await getUserRecords('documents', userId, isAdmin);
};

export const getDocumentsByProject = async (projectId) => {
  return await db.documents.where({ projectId }).toArray();
};

export const getDocumentById = async (id) => {
  return await db.documents.get(id);
};

export const updateDocument = async (id, updates) => {
  await db.documents.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteDocument = async (id) => {
  await db.documents.delete(id);
};

// Document Versions
export const addDocumentVersion = async (versionData, userId) => {
  const version = addSyncFields({ ...versionData, userId });
  const id = await db.documentVersions.add(version);
  return { ...version, id };
};

export const getDocumentVersions = async (userId, isAdmin = false) => {
  return await getUserRecords('documentVersions', userId, isAdmin);
};

export const getDocumentVersionsByDocument = async (documentId) => {
  return await db.documentVersions.where({ documentId }).toArray();
};

export const updateDocumentVersion = async (id, updates) => {
  await db.documentVersions.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteDocumentVersion = async (id) => {
  await db.documentVersions.delete(id);
};

// Document Sharing
export const addDocumentSharing = async (sharingData, userId) => {
  const sharing = addSyncFields({ ...sharingData, userId });
  const id = await db.documentSharing.add(sharing);
  return { ...sharing, id };
};

export const getDocumentSharings = async (userId, isAdmin = false) => {
  return await getUserRecords('documentSharing', userId, isAdmin);
};

export const getDocumentSharingsByDocument = async (documentId) => {
  return await db.documentSharing.where({ documentId }).toArray();
};

export const updateDocumentSharing = async (id, updates) => {
  await db.documentSharing.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteDocumentSharing = async (id) => {
  await db.documentSharing.delete(id);
};

// Document Activity
export const addDocumentActivity = async (activityData, userId) => {
  const activity = addSyncFields({ ...activityData, userId });
  const id = await db.documentActivity.add(activity);
  return { ...activity, id };
};

export const getDocumentActivities = async (userId, isAdmin = false) => {
  return await getUserRecords('documentActivity', userId, isAdmin);
};

export const getDocumentActivitiesByDocument = async (documentId) => {
  return await db.documentActivity.where({ documentId }).toArray();
};

export const updateDocumentActivity = async (id, updates) => {
  await db.documentActivity.update(id, {
    ...updates,
    synced: false,
    lastUpdated: new Date().toISOString()
  });
};

export const deleteDocumentActivity = async (id) => {
  await db.documentActivity.delete(id);
};

// Clear all data (for testing/reset)
export const clearAllData = async () => {
  await db.users.clear();
  await db.projects.clear();
  await db.invoices.clear();
  await db.quotations.clear();
  await db.paymentsIn.clear();
  await db.paymentsOut.clear();
  await db.departments.clear();
  await db.parties.clear();
  await db.settings.clear();
  await db.signatureSettings.clear();
  await db.syncMetadata.clear();
  await db.supplierTransactions.clear();
  // Clear new tables
  await db.materials.clear();
  await db.stockTransactions.clear();
  await db.purchaseOrders.clear();
  await db.materialAllocation.clear();
  await db.workers.clear();
  await db.attendance.clear();
  await db.timeSheets.clear();
  await db.payroll.clear();
  await db.leaveManagement.clear();
  await db.workerAdvances.clear();
  await db.projectBudgets.clear();
  await db.budgetLineItems.clear();
  await db.budgetAlerts.clear();
  await db.budgetRevisions.clear();
  await db.costForecasts.clear();
  await db.retentionPolicies.clear();
  await db.retentionAccounts.clear();
  await db.retentionReleases.clear();
  await db.retentionAlerts.clear();
  await db.changeOrders.clear();
  await db.changeOrderLineItems.clear();
  await db.changeOrderHistory.clear();
  await db.changeOrderImpacts.clear();
  await db.documents.clear();
  await db.documentVersions.clear();
  await db.documentSharing.clear();
  await db.documentActivity.clear();
};

export default db;

