
import * as firebaseApp from "firebase/app";
import * as firebaseAuth from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBFQctGewLcFaSHPWs_YpuxomuHXFEK-TQ",
  authDomain: "pronostics-f1e46.firebaseapp.com",
  projectId: "pronostics-f1e46",
  storageBucket: "pronostics-f1e46.firebasestorage.app",
  messagingSenderId: "579305331167",
  appId: "1:579305331167:web:0f0fd8442f866bc3b1cc6a",
  measurementId: "G-K22TJ6FT6T"
};

// Initialize Firebase App instance
// Handle edge cases where imports might be different in specific environments
const initializeApp = firebaseApp.initializeApp || (firebaseApp as any).default?.initializeApp;
const getApps = firebaseApp.getApps || (firebaseApp as any).default?.getApps;
const getApp = firebaseApp.getApp || (firebaseApp as any).default?.getApp;
const getAuth = firebaseAuth.getAuth || (firebaseAuth as any).default?.getAuth;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize and export Auth tied to the app instance
export const auth = getAuth(app);

export { app };
export default app;
