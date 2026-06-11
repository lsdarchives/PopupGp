import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDnRY2IfkYjg-wXpwhtgfbqhygZ7x6R0Pk",
  authDomain: "popupgp-b987c.firebaseapp.com",
  projectId: "popupgp-b987c",
  storageBucket: "popupgp-b987c.firebasestorage.app",
  messagingSenderId: "932675969056",
  appId: "1:932675969056:web:4c5254cb63f8594bfadc45",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
