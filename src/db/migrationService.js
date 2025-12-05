import db, {
  addUser,
  addProject,
  addInvoice,
  addQuotation,
  addPaymentIn,
  addPaymentOut,
  addDepartment,
  saveSettings,
  saveSignatureSettings
} from './dexieDB';
import { generateId } from '../utils/dataManager';

const STORAGE_KEY = 'bycodez_data';
const MIGRATION_FLAG_KEY = 'bycodez_migration_completed';

/**
 * Check if migration has already been completed
 */
export const isMigrationCompleted = () => {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
};

/**
 * Mark migration as completed
 */
const markMigrationCompleted = () => {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
};

/**
 * Load data from localStorage
 */
const loadLocalStorageData = () => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
    return null;
  } catch (error) {
    console.error('Error loading localStorage data:', error);
    return null;
  }
};

/**
 * Migrate users from localStorage to Dexie
 */
const migrateUsers = async (users) => {
  if (!users || !Array.isArray(users)) return [];

  const migratedUsers = [];
  for (const user of users) {
    try {
      const dexieUser = await addUser({
        id: user.id || generateId(),
        username: user.username,
        password: user.password, // Will be migrated to Firebase Auth later
        email: user.email || `${user.username}@local.app`,
        role: user.role || 'user',
        name: user.name || user.username,
        firebaseUid: null, // Will be set after Firebase Auth migration
        createdAt: user.createdAt || new Date().toISOString()
      }, true); // Migration runs as admin
      migratedUsers.push(dexieUser);
      console.log(`✅ Migrated user: ${user.username} (Role: ${user.role})`);
    } catch (error) {
      console.error(`❌ Failed to migrate user ${user.username}:`, error);
    }
  }
  return migratedUsers;
};

/**
 * Migrate projects from localStorage to Dexie
 * Note: Projects in localStorage are stored with nested departments and payments
 */
const migrateProjects = async (projects, userId) => {
  if (!projects || !Array.isArray(projects)) return [];
  
  const migratedProjects = [];
  for (const project of projects) {
    try {
      // Extract nested data before migrating project
      const departments = project.departments || [];
      const paymentsIn = project.paymentsIn || [];
      const paymentsOut = project.paymentsOut || [];
      
      // Migrate project (without nested data)
      const projectData = {
        id: project.id || generateId(),
        name: project.name,
        totalCommittedAmount: project.totalCommittedAmount || 0,
        description: project.description || '',
        startDate: project.startDate || new Date().toISOString(),
        status: project.status || 'active',
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: project.updatedAt || new Date().toISOString()
      };
      
      const dexieProject = await addProject(projectData, userId, true); // isAdmin=true for migration
      migratedProjects.push(dexieProject);

      // Migrate nested departments
      for (const dept of departments) {
        await addDepartment({
          id: dept.id || generateId(),
          projectId: dexieProject.id,
          name: dept.name,
          isDefault: dept.isDefault || false
        }, userId, true); // isAdmin=true for migration
      }

      // Migrate nested payments in
      for (const payment of paymentsIn) {
        await addPaymentIn({
          id: payment.id || generateId(),
          projectId: dexieProject.id,
          amount: payment.amount || 0,
          date: payment.date || new Date().toISOString(),
          description: payment.description || '',
          category: payment.category || '',
          paymentMethod: payment.paymentMethod || '',
          reference: payment.reference || ''
        }, userId, true); // isAdmin=true for migration
      }

      // Migrate nested payments out
      for (const payment of paymentsOut) {
        await addPaymentOut({
          id: payment.id || generateId(),
          projectId: dexieProject.id,
          amount: payment.amount || 0,
          date: payment.date || new Date().toISOString(),
          description: payment.description || '',
          department: payment.department || '',
          paymentMethod: payment.paymentMethod || '',
          reference: payment.reference || '',
          attachments: payment.attachments || []
        }, userId, true); // isAdmin=true for migration
      }
      
      console.log(`✅ Migrated project: ${project.name} (with ${departments.length} departments, ${paymentsIn.length} payments in, ${paymentsOut.length} payments out)`);
    } catch (error) {
      console.error(`❌ Failed to migrate project ${project.name}:`, error);
    }
  }
  return migratedProjects;
};

/**
 * Migrate invoices from localStorage to Dexie
 */
const migrateInvoices = async (invoices, userId) => {
  if (!invoices || !Array.isArray(invoices)) return [];

  const migratedInvoices = [];
  for (const invoice of invoices) {
    try {
      const dexieInvoice = await addInvoice({
        ...invoice,
        id: invoice.id || generateId()
      }, userId, true); // isAdmin=true for migration
      migratedInvoices.push(dexieInvoice);
    } catch (error) {
      console.error(`❌ Failed to migrate invoice ${invoice.invoiceNumber}:`, error);
    }
  }
  console.log(`✅ Migrated ${migratedInvoices.length} invoices`);
  return migratedInvoices;
};

/**
 * Migrate quotations from localStorage to Dexie
 */
const migrateQuotations = async (quotations, userId) => {
  if (!quotations || !Array.isArray(quotations)) return [];

  const migratedQuotations = [];
  for (const quotation of quotations) {
    try {
      const dexieQuotation = await addQuotation({
        ...quotation,
        id: quotation.id || generateId()
      }, userId, true); // isAdmin=true for migration
      migratedQuotations.push(dexieQuotation);
    } catch (error) {
      console.error(`❌ Failed to migrate quotation ${quotation.quotationNumber}:`, error);
    }
  }
  console.log(`✅ Migrated ${migratedQuotations.length} quotations`);
  return migratedQuotations;
};

/**
 * Migrate settings from localStorage to Dexie
 */
const migrateSettings = async (settings, userId) => {
  if (!settings) return null;

  try {
    const dexieSettings = await saveSettings(settings, userId, true); // isAdmin=true for migration
    console.log(`✅ Migrated settings`);
    return dexieSettings;
  } catch (error) {
    console.error(`❌ Failed to migrate settings:`, error);
    return null;
  }
};

/**
 * Migrate signature settings from localStorage to Dexie
 */
const migrateSignatureSettings = async (signatureSettings, userId) => {
  if (!signatureSettings) return null;

  try {
    const dexieSignature = await saveSignatureSettings(signatureSettings, userId, true); // isAdmin=true for migration
    console.log(`✅ Migrated signature settings`);
    return dexieSignature;
  } catch (error) {
    console.error(`❌ Failed to migrate signature settings:`, error);
    return null;
  }
};

/**
 * Main migration function
 * Migrates all data from localStorage to Dexie
 */
export const migrateLocalStorageToDexie = async () => {
  // Check if migration already completed
  if (isMigrationCompleted()) {
    console.log('ℹ️ Migration already completed. Skipping...');
    return { success: true, alreadyMigrated: true };
  }

  console.log('🚀 Starting localStorage to Dexie migration...');

  try {
    // Load data from localStorage
    const localData = loadLocalStorageData();

    if (!localData) {
      console.log('ℹ️ No localStorage data found. Skipping migration.');
      console.log('ℹ️ Users will be created in Dexie on first login.');
      markMigrationCompleted();
      return { success: true, noData: true };
    }
    
    // Migrate users first
    const migratedUsers = await migrateUsers(localData.users);
    console.log(`✅ Migrated ${migratedUsers.length} users`);

    // Use the first admin user as the default user for migration
    const defaultUser = migratedUsers.find(u => u.role === 'admin') || migratedUsers[0];

    if (!defaultUser) {
      throw new Error('No users found to migrate data to');
    }

    const userId = defaultUser.id;
    console.log(`📌 Using user "${defaultUser.username}" (ID: ${userId}, Role: ${defaultUser.role}) as data owner`);

    // Migrate all other data
    console.log('🔄 Migrating projects...');
    await migrateProjects(localData.projects, userId);
    console.log('🔄 Migrating invoices...');
    await migrateInvoices(localData.invoices, userId);
    console.log('🔄 Migrating quotations...');
    await migrateQuotations(localData.quotations, userId);
    console.log('🔄 Migrating settings...');
    await migrateSettings(localData.settings, userId);
    
    // Migrate signature settings if exists
    if (localData.signatureSettings) {
      await migrateSignatureSettings(localData.signatureSettings, userId);
    }
    
    // Mark migration as completed
    markMigrationCompleted();
    
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Migration Summary:
      - Users: ${migratedUsers.length}
      - Default User ID: ${userId}
      - All data migrated to Dexie IndexedDB
    `);
    
    return {
      success: true,
      migratedUsers: migratedUsers.length,
      defaultUserId: userId
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reset migration flag (for testing purposes)
 */
export const resetMigrationFlag = () => {
  localStorage.removeItem(MIGRATION_FLAG_KEY);
  console.log('🔄 Migration flag reset');
};

export default {
  migrateLocalStorageToDexie,
  isMigrationCompleted,
  resetMigrationFlag
};

