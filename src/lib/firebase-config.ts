
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase for client-side usage
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use test database for development
const databaseId = process.env.NODE_ENV === 'development' ? 'signalcx-test' : '(default)';
const db = getFirestore(app, databaseId);
const auth = getAuth(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Enable offline persistence and handle network issues
let isNetworkEnabled = true;

export const enableFirebaseNetwork = async () => {
  if (!isNetworkEnabled) {
    try {
      await enableNetwork(db);
      isNetworkEnabled = true;
      console.log('Firebase network enabled');
    } catch (error) {
      console.error('Failed to enable Firebase network:', error);
    }
  }
};

export const disableFirebaseNetwork = async () => {
  if (isNetworkEnabled) {
    try {
      await disableNetwork(db);
      isNetworkEnabled = false;
      console.log('Firebase network disabled');
    } catch (error) {
      console.error('Failed to disable Firebase network:', error);
    }
  }
};

export const isFirebaseOnline = () => isNetworkEnabled;

export { app, db, auth, googleProvider };
