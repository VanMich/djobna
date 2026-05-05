// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAi4Jh-udTMqIyMxxNanrAqseXNFj4UZi4",
  authDomain: "djobna-aaa67.firebaseapp.com",
  projectId: "djobna-aaa67",
  storageBucket: "djobna-aaa67.firebasestorage.app",
  messagingSenderId: "964889009440",
  appId: "1:964889009440:web:57d3031578700e07498b45",
  measurementId: "G-SXY0WB4Z3F",
};

// Initialize Firebase
// getApps() vérifie si Firebase est déjà initialisé
// → évite l'erreur "App already exists" en hot-reload Expo
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
// On exporte auth et db directement
// → dans les autres fichiers : import { auth } from '../config/firebase'
const analytics = getAnalytics(app);
