import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  getDocs
} from "firebase/firestore";

let app;
let db: any = null;
let auth: any = null;
let isFirebaseConfigured = false;

try {
  // Gracefully load config from firebase-applet-config.json if it exists
  const firebaseConfig = require("../firebase-applet-config.json");
  if (firebaseConfig && firebaseConfig.apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseConfigured = true;
    console.log("Firebase initialized successfully with configuration file.");
  }
} catch (e) {
  console.log("firebase-applet-config.json is not present yet. System will fallback to Simulation Mode.");
}

export { 
  app, 
  db, 
  auth, 
  isFirebaseConfigured,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  getDocs,
  type User
};
