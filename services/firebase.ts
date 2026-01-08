import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBFQctGewLcFaSHPWs_YpuxomuHXFEK-TQ",
  authDomain: "pronostics-f1e46.firebaseapp.com",
  projectId: "pronostics-f1e46",
  storageBucket: "pronostics-f1e46.firebasestorage.app",
  messagingSenderId: "579305331167",
  appId: "1:579305331167:web:0f0fd8442f866bc3b1cc6a",
  measurementId: "G-K22TJ6FT6T"
};

// Initialisation unique et partage de l'instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// L'appel à getAuth(app) enregistre le composant auth dans l'instance app
export const auth = getAuth(app);

export default app;