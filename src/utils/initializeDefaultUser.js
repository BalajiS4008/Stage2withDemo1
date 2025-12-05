/**
 * Initialize default admin user for first-time app load
 * This ensures there's always an admin user available across devices
 */

import { addUser, getUserByUsername } from '../db/dexieDB';
import { saveData, loadData } from './dataManager';

/**
 * Create default admin user if none exists
 */
export const initializeDefaultUser = async () => {
  try {
    console.log('🔍 Checking for default admin user...');

    // Check if admin user exists in Dexie
    const existingAdmin = await getUserByUsername('admin');

    if (!existingAdmin) {
      console.log('👤 Creating default admin user...');

      const defaultAdmin = {
        id: 1,
        username: 'admin',
        password: 'admin123', // In production, this should be hashed
        email: 'admin@construction-billing.local',
        role: 'admin',
        name: 'Administrator',
        firebaseUid: null,
        subscriptionTier: 'professional', // Give admin full access
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to Dexie
      await addUser(defaultAdmin);
      console.log('✅ Default admin user created in Dexie');

      // Also add to localStorage for backward compatibility
      const data = loadData();
      const existingLocalUser = data.users.find(u => u.username === 'admin');

      if (!existingLocalUser) {
        data.users.push(defaultAdmin);
        saveData(data);
        console.log('✅ Default admin user added to localStorage');
      }

      console.log('✅ Default admin credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');

      return { success: true, userCreated: true };
    } else {
      console.log('ℹ️ Admin user already exists');
      return { success: true, userCreated: false };
    }
  } catch (error) {
    console.error('❌ Error initializing default user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize default data structure if empty
 */
export const initializeDefaultData = () => {
  try {
    const data = loadData();

    // If no users exist at all, create default admin in localStorage
    if (!data.users || data.users.length === 0) {
      console.log('📝 Initializing default data structure...');

      const defaultAdmin = {
        id: 1,
        username: 'admin',
        password: 'admin123',
        email: 'admin@construction-billing.local',
        role: 'admin',
        name: 'Administrator',
        subscriptionTier: 'professional',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      data.users = [defaultAdmin];
      saveData(data);

      console.log('✅ Default data structure initialized');
      console.log('✅ Default admin credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }
  } catch (error) {
    console.error('❌ Error initializing default data:', error);
  }
};

export default {
  initializeDefaultUser,
  initializeDefaultData
};
