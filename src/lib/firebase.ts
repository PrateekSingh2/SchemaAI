import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "schema-ai-demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "schema-ai-demo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "schema-ai-demo.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:demo",
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_api_key_here"
);

// Initialize Firebase safely
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
let db: Firestore;

if (typeof window !== "undefined") {
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Server-side fallback placeholder
  auth = getAuth(app);
  db = getFirestore(app);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app, auth, db, googleProvider };
