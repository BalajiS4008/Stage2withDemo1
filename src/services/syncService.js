import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../data/firebase.jsx';
import db, {
  getProjects,
  getInvoices,
  getQuotations,
  getPaymentsIn,
  getPaymentsOut,
  getDepartments,
  getSettings,
  getSignatureSettings,
  getUserByFirebaseUid,
  updateUser,
  addProject,
  addInvoice,
  addQuotation,
  addPaymentIn,
  addPaymentOut,
  addDepartment,
  saveSettings,
  saveSignatureSettings,
  updateProject,
  updateInvoice,
  updateQuotation,
  updatePaymentIn,
  updatePaymentOut,
  updateDepartment,
  markAsSynced
} from '../db/dexieDB';

/**
 * Firestore structure:
 * users/{firebaseUid}/
 *   - profile/userProfile (user metadata: name, email, role, etc.)
 *   - projects/{projectId}
 *   - invoices/{invoiceId}
 *   - quotations/{quotationId}
 *   - paymentsIn/{paymentId}
 *   - paymentsOut/{paymentId}
 *   - departments/{departmentId}
 *   - settings/userSettings
 *   - signatureSettings/userSignature
 */

// Helper: Get Firestore collection reference
const getUserCollection = (firebaseUid, collectionName) => {
  return collection(firestore, 'users', firebaseUid, collectionName);
};

// Helper: Get Firestore document reference
const getUserDoc = (firebaseUid, collectionName, docId) => {
  return doc(firestore, 'users', firebaseUid, collectionName, docId);
};

// Helper: Convert Firestore timestamp to ISO string
const timestampToISO = (timestamp) => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return new Date(timestamp).toISOString();
};

// Helper: Resolve conflicts (last-write-wins based on lastUpdated timestamp)
const resolveConflict = (localRecord, cloudRecord) => {
  const localTime = new Date(localRecord.lastUpdated || 0).getTime();
  const cloudTime = new Date(timestampToISO(cloudRecord.lastUpdated)).getTime();
  
  // Return the record with the most recent timestamp
  return cloudTime > localTime ? cloudRecord : localRecord;
};

/**
 * Sync a single collection from Dexie to Firestore
 */
const syncCollectionToCloud = async (firebaseUid, userId, collectionName, getDexieRecords, updateDexieRecord) => {
  try {
    const records = await getDexieRecords(userId);
    const unsyncedRecords = records.filter(r => !r.synced);
    
    if (unsyncedRecords.length === 0) {
      console.log(`✅ No unsynced ${collectionName} to upload`);
      return { uploaded: 0, errors: 0 };
    }

    console.log(`📤 Uploading ${unsyncedRecords.length} ${collectionName}...`);
    
    let uploaded = 0;
    let errors = 0;

    for (const record of unsyncedRecords) {
      try {
        const docRef = getUserDoc(firebaseUid, collectionName, record.id.toString());
        
        // Remove Dexie-specific fields and prepare for Firestore
        const { synced, ...recordData } = record;
        const firestoreData = {
          ...recordData,
          lastUpdated: serverTimestamp()
        };
        
        await setDoc(docRef, firestoreData, { merge: true });
        
        // Mark as synced in Dexie
        await markAsSynced(collectionName, record.id);
        uploaded++;
      } catch (error) {
        console.error(`Error uploading ${collectionName} ${record.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ Uploaded ${uploaded} ${collectionName} (${errors} errors)`);
    return { uploaded, errors };
  } catch (error) {
    console.error(`Error syncing ${collectionName} to cloud:`, error);
    return { uploaded: 0, errors: 1 };
  }
};

/**
 * Sync a single collection from Firestore to Dexie
 */
const syncCollectionFromCloud = async (firebaseUid, userId, collectionName, addDexieRecord, updateDexieRecord) => {
  try {
    const collectionRef = getUserCollection(firebaseUid, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`✅ No ${collectionName} in cloud`);
      return { downloaded: 0, errors: 0 };
    }

    console.log(`📥 Downloading ${snapshot.size} ${collectionName}...`);
    
    let downloaded = 0;
    let errors = 0;

    for (const docSnap of snapshot.docs) {
      try {
        const cloudData = docSnap.data();
        const recordId = docSnap.id;
        
        // Check if record exists in Dexie
        const localRecord = await db[collectionName].get(recordId);
        
        if (localRecord) {
          // Record exists - check for conflicts
          const winner = resolveConflict(localRecord, cloudData);
          
          if (winner === cloudData) {
            // Cloud version is newer - update local
            await updateDexieRecord(recordId, {
              ...cloudData,
              lastUpdated: timestampToISO(cloudData.lastUpdated),
              synced: true
            });
            downloaded++;
          }
          // If local is newer, it will be uploaded in the next sync
        } else {
          // Record doesn't exist locally - add it
          const recordData = {
            ...cloudData,
            id: recordId,
            lastUpdated: timestampToISO(cloudData.lastUpdated),
            synced: true
          };
          
          await addDexieRecord(recordData, userId);
          downloaded++;
        }
      } catch (error) {
        console.error(`Error downloading ${collectionName} ${docSnap.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ Downloaded ${downloaded} ${collectionName} (${errors} errors)`);
    return { downloaded, errors };
  } catch (error) {
    console.error(`Error syncing ${collectionName} from cloud:`, error);
    return { downloaded: 0, errors: 1 };
  }
};

/**
 * Sync settings (single document per user)
 */
const syncSettingsToCloud = async (firebaseUid, userId) => {
  try {
    const settings = await getSettings(userId);
    
    if (!settings || settings.synced) {
      console.log('✅ Settings already synced');
      return { uploaded: 0, errors: 0 };
    }

    const docRef = getUserDoc(firebaseUid, 'settings', 'userSettings');
    const { synced, id, ...settingsData } = settings;
    
    await setDoc(docRef, {
      ...settingsData,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    await markAsSynced('settings', settings.id);
    
    console.log('✅ Settings uploaded');
    return { uploaded: 1, errors: 0 };
  } catch (error) {
    console.error('Error syncing settings to cloud:', error);
    return { uploaded: 0, errors: 1 };
  }
};

const syncSettingsFromCloud = async (firebaseUid, userId) => {
  try {
    const docRef = getUserDoc(firebaseUid, 'settings', 'userSettings');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('✅ No settings in cloud');
      return { downloaded: 0, errors: 0 };
    }

    const cloudSettings = docSnap.data();
    const localSettings = await getSettings(userId);
    
    if (localSettings) {
      const winner = resolveConflict(localSettings, cloudSettings);
      
      if (winner === cloudSettings) {
        await saveSettings({
          ...cloudSettings,
          lastUpdated: timestampToISO(cloudSettings.lastUpdated),
          synced: true
        }, userId);
        console.log('✅ Settings downloaded');
        return { downloaded: 1, errors: 0 };
      }
    } else {
      await saveSettings({
        ...cloudSettings,
        lastUpdated: timestampToISO(cloudSettings.lastUpdated),
        synced: true
      }, userId);
      console.log('✅ Settings downloaded');
      return { downloaded: 1, errors: 0 };
    }
    
    return { downloaded: 0, errors: 0 };
  } catch (error) {
    console.error('Error syncing settings from cloud:', error);
    return { downloaded: 0, errors: 1 };
  }
};

/**
 * Sync user profile to cloud
 */
const syncUserProfileToCloud = async (firebaseUid, userId) => {
  try {
    const user = await getUserByFirebaseUid(firebaseUid);
    if (!user) {
      console.warn('No user found for firebaseUid:', firebaseUid);
      return { uploaded: 0, errors: 0 };
    }

    // Only sync if user profile has changed
    if (user.synced) {
      return { uploaded: 0, errors: 0 };
    }

    const profileRef = doc(firestore, 'users', firebaseUid, 'profile', 'userProfile');
    const profileData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      lastUpdated: serverTimestamp()
    };

    await setDoc(profileRef, profileData, { merge: true });
    await updateUser(user.id, { synced: true });

    console.log('✅ User profile synced to cloud');
    return { uploaded: 1, errors: 0 };
  } catch (error) {
    console.error('Error syncing user profile to cloud:', error);
    return { uploaded: 0, errors: 1 };
  }
};

/**
 * Sync user profile from cloud
 */
const syncUserProfileFromCloud = async (firebaseUid, userId) => {
  try {
    const profileRef = doc(firestore, 'users', firebaseUid, 'profile', 'userProfile');
    const docSnap = await getDoc(profileRef);

    if (!docSnap.exists()) {
      return { downloaded: 0, errors: 0 };
    }

    const cloudProfile = docSnap.data();
    const localUser = await getUserByFirebaseUid(firebaseUid);

    if (localUser) {
      // Update local user with cloud data if cloud is newer
      const localTime = new Date(localUser.lastUpdated || 0).getTime();
      const cloudTime = new Date(timestampToISO(cloudProfile.lastUpdated)).getTime();

      if (cloudTime > localTime) {
        await updateUser(localUser.id, {
          name: cloudProfile.name,
          email: cloudProfile.email,
          role: cloudProfile.role,
          lastUpdated: timestampToISO(cloudProfile.lastUpdated),
          synced: true
        });
        console.log('✅ User profile updated from cloud');
        return { downloaded: 1, errors: 0 };
      }
    }

    return { downloaded: 0, errors: 0 };
  } catch (error) {
    console.error('Error syncing user profile from cloud:', error);
    return { downloaded: 0, errors: 1 };
  }
};

/**
 * Main sync function - bidirectional sync
 */
export const runFullSync = async (firebaseUid, userId) => {
  if (!firebaseUid || !userId) {
    console.error('Cannot sync: missing firebaseUid or userId');
    return { success: false, error: 'Missing user credentials' };
  }

  console.log('🔄 Starting full bidirectional sync...');
  const startTime = Date.now();
  
  const results = {
    uploaded: 0,
    downloaded: 0,
    errors: 0
  };

  try {
    // Sync user profile first
    await syncUserProfileToCloud(firebaseUid, userId);

    // Sync each collection TO cloud (upload unsynced)
    const uploadResults = await Promise.all([
      syncCollectionToCloud(firebaseUid, userId, 'projects', getProjects, updateProject),
      syncCollectionToCloud(firebaseUid, userId, 'invoices', getInvoices, updateInvoice),
      syncCollectionToCloud(firebaseUid, userId, 'quotations', getQuotations, updateQuotation),
      syncCollectionToCloud(firebaseUid, userId, 'paymentsIn', getPaymentsIn, updatePaymentIn),
      syncCollectionToCloud(firebaseUid, userId, 'paymentsOut', getPaymentsOut, updatePaymentOut),
      syncCollectionToCloud(firebaseUid, userId, 'departments', getDepartments, updateDepartment),
      syncSettingsToCloud(firebaseUid, userId)
    ]);

    uploadResults.forEach(result => {
      results.uploaded += result.uploaded;
      results.errors += result.errors;
    });

    // Sync user profile from cloud
    await syncUserProfileFromCloud(firebaseUid, userId);

    // Sync each collection FROM cloud (download updates)
    const downloadResults = await Promise.all([
      syncCollectionFromCloud(firebaseUid, userId, 'projects', addProject, updateProject),
      syncCollectionFromCloud(firebaseUid, userId, 'invoices', addInvoice, updateInvoice),
      syncCollectionFromCloud(firebaseUid, userId, 'quotations', addQuotation, updateQuotation),
      syncCollectionFromCloud(firebaseUid, userId, 'paymentsIn', addPaymentIn, updatePaymentIn),
      syncCollectionFromCloud(firebaseUid, userId, 'paymentsOut', addPaymentOut, updatePaymentOut),
      syncCollectionFromCloud(firebaseUid, userId, 'departments', addDepartment, updateDepartment),
      syncSettingsFromCloud(firebaseUid, userId)
    ]);

    downloadResults.forEach(result => {
      results.downloaded += result.downloaded;
      results.errors += result.errors;
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Sync completed in ${duration}s`);
    console.log(`📊 Results: ↑${results.uploaded} ↓${results.downloaded} ❌${results.errors}`);
    
    // Save last sync time
    localStorage.setItem('bycodez_last_sync', new Date().toISOString());
    
    return {
      success: true,
      ...results,
      duration
    };
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return {
      success: false,
      error: error.message,
      ...results
    };
  }
};

/**
 * Get last sync time
 */
export const getLastSyncTime = () => {
  return localStorage.getItem('bycodez_last_sync');
};

/**
 * Check if sync is needed (based on time threshold)
 */
export const needsSync = (thresholdMinutes = 15) => {
  const lastSync = getLastSyncTime();
  if (!lastSync) return true;
  
  const lastSyncTime = new Date(lastSync).getTime();
  const now = Date.now();
  const diffMinutes = (now - lastSyncTime) / 1000 / 60;
  
  return diffMinutes >= thresholdMinutes;
};

export default {
  runFullSync,
  getLastSyncTime,
  needsSync
};

