const useEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === "true";

export const firebaseConfig = {
  apiKey: "AIzaSyDnRY2IfkYjg-wXpwhtgfbqhygZ7x6R0Pk",
  authDomain: "popupgp-b987c.firebaseapp.com",
  projectId: useEmulators
    ? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-popupgp"
    : "popupgp-b987c",
  storageBucket: "popupgp-b987c.firebasestorage.app",
  messagingSenderId: "932675969056",
  appId: "1:932675969056:web:4c5254cb63f8594bfadc45",
};
