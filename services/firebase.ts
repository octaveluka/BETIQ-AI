import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBFQctGewLcFaSHPWs_YpuxomuHXFEK-TQ",
  authDomain: "pronostics-f1e46.firebaseapp.com",
  projectId: "pronostics-f1e46",
  storageBucket: "pronostics-f1e46.firebasestorage.app",
  messagingSenderId: "579305331167",
  appId: "1:579305331167:web:0f0fd8442f866bc3b1cc6a",
  measurementId: "G-K22TJ6FT6T"
};

// Initialisation de l'application
const app = initializeApp(firebaseConfig);

// L'appel à getAuth(app) enregistre le composant auth dans l'instance app
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;