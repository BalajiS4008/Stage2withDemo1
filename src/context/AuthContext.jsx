import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../data/firebase.jsx';
import { getUserByFirebaseUid, getUserByUsername, addUser, updateUser } from '../db/dexieDB';
import { migrateLocalStorageToDexie } from '../db/migrationService';
import { loadData } from '../utils/dataManager';
import { registerDevice, getCurrentDeviceInfo } from '../utils/subscriptionManager';
import { initializeDefaultUser, initializeDefaultData } from '../utils/initializeDefaultUser';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  useEffect(() => {
    // Run migration and initialization on first load
    const runInitialization = async () => {
      try {
        // Initialize default data structure in localStorage
        initializeDefaultData();

        // Run migration from localStorage to Dexie
        const result = await migrateLocalStorageToDexie();
        if (result.success) {
          console.log('✅ Migration check completed');
        }

        // Initialize default admin user if none exists
        await initializeDefaultUser();

        setMigrationCompleted(true);
      } catch (error) {
        console.error('❌ Initialization error:', error);
        setMigrationCompleted(true); // Continue even if initialization fails
      }
    };

    runInitialization();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        setFirebaseUser(firebaseUser);

        // Get user data from Dexie
        const dexieUser = await getUserByFirebaseUid(firebaseUser.uid);

        if (dexieUser) {
          const userWithoutPassword = {
            id: dexieUser.id,
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            username: dexieUser.username,
            role: dexieUser.role,
            name: dexieUser.name
          };
          setUser(userWithoutPassword);
        } else {
          // Firebase user exists but not in Dexie (shouldn't happen normally)
          console.warn('Firebase user not found in Dexie');
          setUser(null);
        }
      } else {
        // User is signed out
        setFirebaseUser(null);

        // Check for local user (backward compatibility)
        const storedUser = localStorage.getItem('bycodez_current_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Local login (backward compatibility - for users not yet migrated to Firebase)
  const loginLocal = async (username, password) => {
    try {
      console.log('🔓 Attempting local login...');
      const data = loadData();
      const foundUser = data.users.find(
        u => u.username === username && u.password === password
      );

      if (foundUser) {
        console.log('✅ User found in localStorage:', foundUser.username);
        console.log('👤 User details:', { id: foundUser.id, username: foundUser.username, role: foundUser.role });

        // Add user to Dexie if not already there
        try {
          const existingDexieUser = await getUserByUsername(username);
          if (!existingDexieUser) {
            console.log('📝 Adding user to Dexie...');
            await addUser({
              id: foundUser.id,
              username: foundUser.username,
              password: foundUser.password,
              email: foundUser.email || `${foundUser.username}@local.app`,
              role: foundUser.role || 'user',
              name: foundUser.name || foundUser.username,
              firebaseUid: null,
              createdAt: foundUser.createdAt || new Date().toISOString()
            });
            console.log('✅ User added to Dexie with ID:', foundUser.id);
          } else {
            console.log('ℹ️ User already exists in Dexie with ID:', existingDexieUser.id);
          }
        } catch (dexieError) {
          console.warn('⚠️ Could not add user to Dexie:', dexieError);
          // Continue with login even if Dexie fails
        }

        const userWithoutPassword = {
          id: foundUser.id,
          username: foundUser.username,
          role: foundUser.role,
          name: foundUser.name,
          subscriptionTier: foundUser.subscriptionTier || 'starter',
          subscriptionStatus: foundUser.subscriptionStatus || 'active'
        };
        setUser(userWithoutPassword);
        localStorage.setItem('bycodez_current_user', JSON.stringify(userWithoutPassword));

        // Register device on login
        try {
          const deviceInfo = getCurrentDeviceInfo();
          await registerDevice(foundUser.id, deviceInfo);
          console.log('✅ Device registered:', deviceInfo.deviceName);
        } catch (deviceError) {
          console.warn('⚠️ Could not register device:', deviceError);
        }

        console.log('✅ Login successful! User ID:', foundUser.id);
        return { success: true, user: userWithoutPassword };
      }

      console.log('❌ User not found in localStorage');
      return { success: false, error: 'Invalid username or password' };
    } catch (error) {
      console.error('❌ Local login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Firebase login
  const login = async (username, password) => {
    try {
      console.log('🔐 Login attempt for username:', username);

      // Check if migration has completed
      if (!migrationCompleted) {
        console.log('⏳ Waiting for migration to complete...');
        // Wait a bit for migration
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // First, try to find user in Dexie by username
      const dexieUser = await getUserByUsername(username);
      console.log('👤 Dexie user lookup result:', dexieUser ? 'Found' : 'Not found');

      if (dexieUser) {
        console.log('👤 User details:', {
          id: dexieUser.id,
          username: dexieUser.username,
          hasFirebaseUid: !!dexieUser.firebaseUid,
          hasPassword: !!dexieUser.password
        });
      }

      if (!dexieUser) {
        // User not found in Dexie, try local login
        console.log('⚠️ User not in Dexie, trying local login...');
        return await loginLocal(username, password);
      }

      // If user has firebaseUid, use Firebase auth
      if (dexieUser.firebaseUid) {
        // User already migrated to Firebase
        console.log('🔥 User has Firebase UID, signing in with Firebase...');
        const email = dexieUser.email || `${username}@local.app`;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        const userWithoutPassword = {
          id: dexieUser.id,
          firebaseUid: userCredential.user.uid,
          email: userCredential.user.email,
          username: dexieUser.username,
          role: dexieUser.role,
          name: dexieUser.name
        };

        setUser(userWithoutPassword);
        setFirebaseUser(userCredential.user);

        return { success: true, user: userWithoutPassword };
      } else {
        // User exists in Dexie but not migrated to Firebase yet
        console.log('🔄 User not migrated to Firebase yet, verifying password...');

        // Verify password locally first
        if (dexieUser.password !== password) {
          console.log('❌ Password mismatch');
          return { success: false, error: 'Invalid username or password' };
        }

        console.log('✅ Password verified, creating Firebase account...');

        // Create Firebase account for this user
        const email = dexieUser.email || `${username}@local.app`;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);

          // Update Dexie user with Firebase UID
          await updateUser(dexieUser.id, {
            firebaseUid: userCredential.user.uid,
            email: email
          });

          const userWithoutPassword = {
            id: dexieUser.id,
            firebaseUid: userCredential.user.uid,
            email: email,
            username: dexieUser.username,
            role: dexieUser.role,
            name: dexieUser.name
          };

          setUser(userWithoutPassword);
          setFirebaseUser(userCredential.user);

          console.log(`✅ User ${username} migrated to Firebase Auth`);

          return { success: true, user: userWithoutPassword };
        } catch (firebaseError) {
          if (firebaseError.code === 'auth/email-already-in-use') {
            // Email exists, try to sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            await updateUser(dexieUser.id, {
              firebaseUid: userCredential.user.uid,
              email: email
            });

            const userWithoutPassword = {
              id: dexieUser.id,
              firebaseUid: userCredential.user.uid,
              email: email,
              username: dexieUser.username,
              role: dexieUser.role,
              name: dexieUser.name
            };

            setUser(userWithoutPassword);
            setFirebaseUser(userCredential.user);

            return { success: true, user: userWithoutPassword };
          }
          throw firebaseError;
        }
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      let errorMessage = 'Login failed';

      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid username or password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase configuration error. Please check console.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (firebaseUser) {
        await firebaseSignOut(auth);
      }
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('bycodez_current_user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Reset password (Firebase only)
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    firebaseUser,
    login,
    logout,
    isAdmin,
    resetPassword,
    loading: loading || !migrationCompleted
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

