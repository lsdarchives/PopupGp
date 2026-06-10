import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnRY2IfkYjg-wXpwhtgfbqhygZ7x6R0Pk",
  authDomain: "popupgp-b987c.firebaseapp.com",
  projectId: "popupgp-b987c",
  storageBucket: "popupgp-b987c.firebasestorage.app",
  messagingSenderId: "932675969056",
  appId: "1:932675969056:web:4c5254cb63f8594bfadc45",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);