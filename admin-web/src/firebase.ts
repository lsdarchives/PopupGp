import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const useFirebaseEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

const firebaseConfig = {
  apiKey: 'AIzaSyDnRY2IfkYjg-wXpwhtgfbqhygZ7x6R0Pk',
  authDomain: 'popupgp-b987c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (useFirebaseEmulators ? 'demo-popupgp' : 'popupgp-b987c'),
  storageBucket: 'popupgp-b987c.firebasestorage.app',
  messagingSenderId: '932675969056',
  appId: '1:932675969056:web:4c5254cb63f8594bfadc45',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

if (useFirebaseEmulators) {
  const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1'

  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, emulatorHost, 8080)
}
