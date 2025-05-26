import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDm8IvXMfmbCDzgmf8-HEBhaCQ0dfp4ZAQ",
  authDomain: "saukstasmeiles.firebaseapp.com",
  projectId: "saukstasmeiles",
  storageBucket: "saukstasmeiles.firebasestorage.app",
  messagingSenderId: "58938164125",
  appId: "1:58938164125:web:38183fad0e576db49a2574",
  measurementId: "G-L7GH1YNQ10"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);