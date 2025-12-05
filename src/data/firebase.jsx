// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
// Try to use environment variables first, fallback to hardcoded values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDj-sHUwLk0hQ9UXa8Zcdfx4Kyj9KzFOAE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "expensetrackerapp-b735d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "expensetrackerapp-b735d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "expensetrackerapp-b735d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "235443390363",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:235443390363:web:b7db6ab84043b981d5433e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LVQLXW5C72"
};

// Debug: Log config to verify env vars are loaded
console.log('🔥 Firebase Config Check:', {
  apiKey: firebaseConfig.apiKey ? '✅ Loaded' : '❌ Missing',
  authDomain: firebaseConfig.authDomain ? '✅ Loaded' : '❌ Missing',
  projectId: firebaseConfig.projectId ? '✅ Loaded' : '❌ Missing',
  appId: firebaseConfig.appId ? '✅ Loaded' : '❌ Missing',
});

// Check if any required config is missing
const missingConfig = Object.entries(firebaseConfig).filter(([key, value]) => !value);
if (missingConfig.length > 0) {
  console.error('❌ Missing Firebase configuration:', missingConfig.map(([key]) => key));
  console.error('💡 Make sure .env.local file exists and dev server was restarted');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const analytics = getAnalytics(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(firestore).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser');
  }
});

export default app;